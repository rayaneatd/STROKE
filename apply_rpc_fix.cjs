const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const sql = `
-- Drop existing functions before recreating due to return type changes
DROP FUNCTION IF EXISTS public.get_project_candidates(uuid,uuid,text,text,text[],text[],text[],integer,integer);
DROP FUNCTION IF EXISTS public.get_project_candidates(uuid,uuid,text,text,text[],text[],uuid[],integer,integer);
DROP FUNCTION IF EXISTS public.get_candidate_drawer_data(uuid);

-- Fix get_project_candidates to use match_score instead of score
CREATE OR REPLACE FUNCTION public.get_project_candidates(
    p_project_id uuid,
    p_user_id uuid,
    p_search_query text DEFAULT '',
    p_sort_option text DEFAULT 'SCORE_DESC',
    p_filter_scores text[] DEFAULT NULL,
    p_filter_activities text[] DEFAULT NULL,
    p_filter_uploaders text[] DEFAULT NULL,
    p_page_param integer DEFAULT 0,
    p_page_size integer DEFAULT 50
)
RETURNS TABLE (
    id uuid,
    project_id uuid,
    candidate_name text,
    email text,
    phone text,
    location text,
    summary text,
    status text,
    uploaded_at timestamptz,
    uploaded_by uuid,
    viewed_by uuid[],
    exported_by uuid[],
    email_sent_at timestamptz,
    email_draft text,
    is_favorite boolean,
    rank bigint,
    full_count bigint,
    current_position text,
    years_of_experience numeric,
    match_score integer,
    score_justification text,
    executive_summary text,
    key_skills jsonb,
    missing_skills jsonb,
    red_flags jsonb,
    soft_skills_analysis text,
    interview_questions jsonb,
    career_trajectory text,
    social_links jsonb,
    original_resume_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH candidate_ranks AS (
    SELECT 
      c.id, 
      ROW_NUMBER() OVER (
        PARTITION BY c.project_id
        ORDER BY c.match_score DESC NULLS LAST, c.uploaded_at DESC, c.id ASC
      ) as global_rank
    FROM candidates c
    WHERE c.project_id = p_project_id
  ),
  filtered_candidates AS (
    SELECT 
      c.id,
      c.project_id,
      c.candidate_name,
      c.email,
      c.phone,
      c.location,
      c.summary,
      c.status,
      c.uploaded_at,
      c.uploaded_by,
      c.viewed_by,
      c.exported_by,
      c.email_sent_at,
      c.email_draft,
      c.is_favorite,
      c.current_position,
      c.years_of_experience,
      c.match_score,
      c.score_justification,
      c.executive_summary,
      c.key_skills,
      c.missing_skills,
      c.red_flags,
      c.soft_skills_analysis,
      c.interview_questions,
      c.career_trajectory,
      c.social_links,
      c.original_resume_name,
      cr.global_rank
    FROM candidates c
    JOIN candidate_ranks cr ON c.id = cr.id
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
         ('HIGH' = ANY(p_filter_scores) AND c.match_score >= 80) OR
         ('MID' = ANY(p_filter_scores) AND c.match_score >= 50 AND c.match_score < 80) OR
         ('LOW' = ANY(p_filter_scores) AND c.match_score < 50)
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
         ('NOT_VIEWED' = ANY(p_filter_activities) AND NOT (c.viewed_by @> ARRAY[p_user_id])) OR
         ('REJECTED' = ANY(p_filter_activities) AND c.status = 'rejected')
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
    fc.status,
    fc.uploaded_at,
    fc.uploaded_by,
    fc.viewed_by,
    fc.exported_by,
    fc.email_sent_at,
    fc.email_draft,
    fc.is_favorite,
    fc.global_rank as rank,
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
    CASE WHEN p_sort_option = 'SCORE_DESC' THEN fc.match_score END DESC NULLS LAST,
    CASE WHEN p_sort_option = 'SCORE_ASC' THEN fc.match_score END ASC NULLS LAST,
    CASE WHEN p_sort_option = 'DATE_DESC' THEN fc.uploaded_at END DESC NULLS LAST,
    CASE WHEN p_sort_option = 'DATE_ASC' THEN fc.uploaded_at END ASC NULLS LAST,
    CASE WHEN p_sort_option = 'NAME_ASC' THEN fc.candidate_name END ASC NULLS LAST,
    fc.uploaded_at DESC,
    fc.id ASC
  LIMIT p_page_size
  OFFSET p_page_param * p_page_size;
END;
$$;

-- Fix get_candidate_drawer_data to removing skills column reference
CREATE OR REPLACE FUNCTION public.get_candidate_drawer_data(p_candidate_id uuid)
RETURNS TABLE (
    candidate_name text,
    current_position text,
    years_of_experience numeric,
    location text,
    email text,
    phone text,
    social_links jsonb,
    match_score integer,
    score_justification text,
    career_trajectory text,
    executive_summary text,
    summary text,
    soft_skills_analysis text,
    key_skills jsonb,
    missing_skills jsonb,
    red_flags jsonb,
    interview_questions jsonb,
    email_draft text,
    email_sent_at timestamptz,
    original_resume_name text,
    uploaded_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.candidate_name,
        c.current_position,
        c.years_of_experience,
        c.location,
        c.email,
        c.phone,
        c.social_links,
        c.match_score,
        c.score_justification,
        c.career_trajectory,
        c.executive_summary,
        c.summary,
        c.soft_skills_analysis,
        c.key_skills,
        c.missing_skills,
        c.red_flags,
        c.interview_questions,
        c.email_draft,
        c.email_sent_at,
        c.original_resume_name,
        c.uploaded_at
    FROM
        candidates c
    WHERE
        c.id = p_candidate_id;
END;
$$;
`;

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        await client.query(sql);
        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

main();
