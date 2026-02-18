
-- Drop existing function if exists to avoid signature conflicts
DROP FUNCTION IF EXISTS get_project_candidates;

CREATE OR REPLACE FUNCTION get_project_candidates(
  p_project_id UUID,
  p_user_id UUID,
  p_search_query TEXT,
  p_sort_option TEXT,
  p_filter_scores TEXT[],
  p_filter_activities TEXT[],
  p_status TEXT[],
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
  score NUMERIC,
  status TEXT,
  uploaded_at TIMESTAMPTZ,
  uploaded_by UUID,
  viewed_by UUID[],
  exported_by UUID[],
  email_sent_at TIMESTAMPTZ,
  email_draft TEXT,
  rank BIGINT,
  full_count BIGINT
) AS $$
DECLARE
  v_sort_field TEXT;
  v_sort_order TEXT;
BEGIN
  -- Determine sort field and order
  IF p_sort_option = 'SCORE_DESC' THEN
    v_sort_field := 'score'; v_sort_order := 'DESC';
  ELSIF p_sort_option = 'SCORE_ASC' THEN
    v_sort_field := 'score'; v_sort_order := 'ASC';
  ELSIF p_sort_option = 'DATE_DESC' THEN
    v_sort_field := 'uploaded_at'; v_sort_order := 'DESC';
  ELSIF p_sort_option = 'DATE_ASC' THEN
    v_sort_field := 'uploaded_at'; v_sort_order := 'ASC';
  ELSIF p_sort_option = 'NAME_ASC' THEN
    v_sort_field := 'candidate_name'; v_sort_order := 'ASC';
  ELSE
    v_sort_field := 'uploaded_at'; v_sort_order := 'DESC';
  END IF;

  RETURN QUERY
  WITH project_ranks AS (
    SELECT 
      c.id as c_id,
      RANK() OVER (
        PARTITION BY c.project_id 
        ORDER BY 
          CASE WHEN c.status = 'COMPLETED' THEN c.score ELSE -1 END DESC,
          c.uploaded_at DESC
      ) as global_rank
    FROM candidates c
    WHERE c.project_id = p_project_id
  ),
  filtered_candidates AS (
    SELECT 
      c.*,
      pr.global_rank
    FROM candidates c
    JOIN project_ranks pr ON c.id = pr.c_id
    WHERE 
      c.project_id = p_project_id
      AND
      -- Search
      (p_search_query IS NULL OR p_search_query = '' OR
       c.candidate_name ILIKE '%' || p_search_query || '%' OR
       c.email ILIKE '%' || p_search_query || '%' OR
       c.location ILIKE '%' || p_search_query || '%')
      AND
      -- Status Filter
      (p_status IS NULL OR c.status = ANY(p_status))
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
         ('VIEWED' = ANY(p_filter_activities) AND p_user_id = ANY(c.viewed_by)) OR
         ('NOT_VIEWED' = ANY(p_filter_activities) AND NOT (p_user_id = ANY(c.viewed_by))) OR
         ('EXPORTED' = ANY(p_filter_activities) AND p_user_id = ANY(c.exported_by)) OR
         ('NOT_EXPORTED' = ANY(p_filter_activities) AND NOT (p_user_id = ANY(c.exported_by)))
       )
      )
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
    fc.global_rank as rank,
    tc.count as full_count
  FROM filtered_candidates fc, total_count tc
  ORDER BY
    CASE WHEN p_sort_option = 'SCORE_DESC' THEN fc.score END DESC,
    CASE WHEN p_sort_option = 'SCORE_ASC' THEN fc.score END ASC,
    CASE WHEN p_sort_option = 'DATE_DESC' THEN fc.uploaded_at END DESC,
    CASE WHEN p_sort_option = 'DATE_ASC' THEN fc.uploaded_at END ASC,
    CASE WHEN p_sort_option = 'NAME_ASC' THEN fc.candidate_name END ASC
  LIMIT p_page_size
  OFFSET p_page_param * p_page_size;
END;
$$ LANGUAGE plpgsql;
