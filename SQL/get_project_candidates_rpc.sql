DROP FUNCTION IF EXISTS get_project_candidates(UUID, UUID, TEXT, TEXT, TEXT[], TEXT[], TEXT[], INT, INT);
DROP FUNCTION IF EXISTS get_project_candidates(UUID, UUID, TEXT, TEXT, TEXT[], TEXT[], UUID[], INT, INT);
DROP FUNCTION IF EXISTS get_project_candidates(UUID, UUID, TEXT, TEXT, TEXT[], TEXT[], UUID[], TEXT[], INT, INT);

CREATE OR REPLACE FUNCTION get_project_candidates(
  p_project_id UUID,
  p_user_id UUID,
  p_search_query TEXT,
  p_sort_option TEXT,
  p_filter_scores TEXT[],
  p_filter_activities TEXT[],
  p_filter_uploaders TEXT[],
  p_page_param INT,
  p_page_size INT
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  candidate_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  summary TEXT,
  skills TEXT[],
  score INTEGER,
  status TEXT,
  uploaded_at TIMESTAMPTZ,
  uploaded_by UUID,
  viewed_by UUID[],
  exported_by UUID[],
  email_sent_at TIMESTAMPTZ,
  email_draft TEXT,
  is_favorite BOOLEAN,
  rank BIGINT,
  full_count BIGINT,
  current_position TEXT,
  years_of_experience NUMERIC,
  match_score INTEGER,
  score_justification TEXT,
  executive_summary TEXT,
  key_skills JSONB,
  missing_skills JSONB,
  red_flags JSONB,
  soft_skills_analysis TEXT,
  interview_questions JSONB,
  career_trajectory TEXT,
  social_links JSONB,
  original_resume_name TEXT
) AS $$
DECLARE
  v_sort_field TEXT;
  v_sort_order TEXT;
BEGIN
  RETURN QUERY
  WITH filtered_candidates AS (
    SELECT 
      c.*
    FROM candidates c
    WHERE 
      c.project_id = p_project_id
      AND
      -- Search
      (p_search_query IS NULL OR p_search_query = '' OR
       c.candidate_name ILIKE '%' || p_search_query || '%' OR
       c.email ILIKE '%' || p_search_query || '%' OR
       c.location ILIKE '%' || p_search_query || '%')
      AND
      -- Score Filter
      (p_filter_scores IS NULL OR array_length(p_filter_scores, 1) IS NULL OR
       (
         ('HIGH' = ANY(p_filter_scores) AND c.score >= 80) OR
         ('MID' = ANY(p_filter_scores) AND c.score >= 50 AND c.score < 80) OR
         ('LOW' = ANY(p_filter_scores) AND c.score < 50)
       )
      )
      AND
      -- Activity Filter
      (p_filter_activities IS NULL OR array_length(p_filter_activities, 1) IS NULL OR
       (
         ('EMAILED' = ANY(p_filter_activities) AND c.email_sent_at IS NOT NULL) OR
         ('NOT_EMAILED' = ANY(p_filter_activities) AND c.email_sent_at IS NULL) OR
         ('EXPORTED' = ANY(p_filter_activities) AND c.exported_by IS NOT NULL AND array_length(c.exported_by, 1) > 0) OR
         ('NOT_EXPORTED' = ANY(p_filter_activities) AND (c.exported_by IS NULL OR array_length(c.exported_by, 1) = 0)) OR
         ('VIEWED' = ANY(p_filter_activities) AND (c.viewed_by @> ARRAY[p_user_id])) OR
         ('NOT_VIEWED' = ANY(p_filter_activities) AND NOT (c.viewed_by @> ARRAY[p_user_id]))
       )
      )
      AND
      -- Uploader Filter
      (p_filter_uploaders IS NULL OR array_length(p_filter_uploaders, 1) IS NULL OR
       c.uploaded_by::text = ANY(p_filter_uploaders))
  ),
  total_count AS (
    SELECT COUNT(*) as count FROM filtered_candidates
  )
  SELECT 
    fc.id,
    fc.project_id,
    fc.candidate_name,
    fc.email,
    fc.phone,
    fc.location,
    fc.summary,
    fc.skills,
    fc.score,
    fc.status,
    fc.uploaded_at,
    fc.uploaded_by,
    fc.viewed_by,
    fc.exported_by,
    fc.email_sent_at,
    fc.email_draft,
    fc.is_favorite,
    ROW_NUMBER() OVER (
      ORDER BY 
        fc.is_favorite DESC NULLS LAST, -- Favorites always first
        CASE WHEN p_sort_option = 'SCORE_DESC' THEN fc.score END DESC NULLS LAST,
        CASE WHEN p_sort_option = 'SCORE_ASC' THEN fc.score END ASC NULLS LAST,
        CASE WHEN p_sort_option = 'DATE_DESC' THEN fc.uploaded_at END DESC NULLS LAST,
        CASE WHEN p_sort_option = 'DATE_ASC' THEN fc.uploaded_at END ASC NULLS LAST,
        CASE WHEN p_sort_option = 'NAME_ASC' THEN fc.candidate_name END ASC NULLS LAST,
        fc.uploaded_at DESC,
        fc.id ASC
    )::BIGINT as rank,
    tc.count as full_count,
    fc.current_position,
    fc.years_of_experience,
    fc.match_score,
    fc.score_justification,
    fc.executive_summary,
    fc.key_skills,
    fc.missing_skills,
    fc.red_flags,
    fc.soft_skills_analysis,
    fc.interview_questions,
    fc.career_trajectory,
    fc.social_links,
    fc.original_resume_name
  FROM filtered_candidates fc
  CROSS JOIN total_count tc
  ORDER BY 
    fc.is_favorite DESC NULLS LAST,
    CASE WHEN p_sort_option = 'SCORE_DESC' THEN fc.score END DESC NULLS LAST,
    CASE WHEN p_sort_option = 'SCORE_ASC' THEN fc.score END ASC NULLS LAST,
    CASE WHEN p_sort_option = 'DATE_DESC' THEN fc.uploaded_at END DESC NULLS LAST,
    CASE WHEN p_sort_option = 'DATE_ASC' THEN fc.uploaded_at END ASC NULLS LAST,
    CASE WHEN p_sort_option = 'NAME_ASC' THEN fc.candidate_name END ASC NULLS LAST,
    fc.uploaded_at DESC,
    fc.id ASC
  LIMIT p_page_size
  OFFSET p_page_param * p_page_size;
END;
$$ LANGUAGE plpgsql;
