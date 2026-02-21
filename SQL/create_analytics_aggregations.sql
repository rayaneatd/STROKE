-- Function to get timeline data (Activity & Performance)
-- Aggregates data from candidates (added, qualified) and analytics_events (failed)
CREATE OR REPLACE FUNCTION public.get_project_activity_timeline(
    p_project_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    date TEXT,
    added BIGINT,
    qualified BIGINT,
    failed BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        -- Generate a series of dates from start_date (or 30 days ago) to today
        SELECT generate_series(
            COALESCE(p_start_date, NOW() - INTERVAL '30 days'),
            NOW(),
            INTERVAL '1 day'
        )::DATE AS day
    ),
    candidate_stats AS (
        SELECT 
            uploaded_at::DATE as day,
            COUNT(*) as added_count,
            COUNT(*) FILTER (WHERE score >= 70) as qualified_count
        FROM candidates
        WHERE project_id = p_project_id
        AND (p_start_date IS NULL OR uploaded_at >= p_start_date)
        GROUP BY 1
    ),
    failure_stats AS (
        SELECT 
            created_at::DATE as day,
            COUNT(*) as failed_count
        FROM analytics_events
        WHERE project_id = p_project_id
        AND event_type = 'FAIL'
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        GROUP BY 1
    )
    SELECT 
        TO_CHAR(ds.day, 'YYYY-MM-DD') as date,
        COALESCE(cs.added_count, 0) as added,
        COALESCE(cs.qualified_count, 0) as qualified,
        COALESCE(fs.failed_count, 0) as failed
    FROM date_series ds
    LEFT JOIN candidate_stats cs ON ds.day = cs.day
    LEFT JOIN failure_stats fs ON ds.day = fs.day
    ORDER BY ds.day;
END;
$$;

-- Function to get failure distribution (Failure Analysis)
-- Aggregates failures by reason from analytics_events metadata
CREATE OR REPLACE FUNCTION public.get_project_failure_distribution(
    p_project_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    reason TEXT,
    count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(metadata->>'reason', 'Unknown Error') as reason,
        COUNT(*) as count
    FROM analytics_events
    WHERE project_id = p_project_id
    AND event_type = 'FAIL'
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    GROUP BY 1
    ORDER BY 2 DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_project_activity_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_failure_distribution TO authenticated;
