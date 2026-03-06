
-- 1. Relax the status constraint on candidates table and add missing columns
ALTER TABLE public.candidates 
DROP CONSTRAINT IF EXISTS candidates_status_check;

ALTER TABLE public.candidates
ADD CONSTRAINT candidates_status_check 
CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'new', 'screened', 'interview', 'rejected', 'hired'));

-- Add missing columns to candidates table if they don't exist
DO $$ 
BEGIN
    -- Basic info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'is_favorite') THEN
        ALTER TABLE public.candidates ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'phone') THEN
        ALTER TABLE public.candidates ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'location') THEN
        ALTER TABLE public.candidates ADD COLUMN location TEXT;
    END IF;
    
    -- Analysis results
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'current_position') THEN
        ALTER TABLE public.candidates ADD COLUMN current_position TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'years_of_experience') THEN
        ALTER TABLE public.candidates ADD COLUMN years_of_experience NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'match_score') THEN
        ALTER TABLE public.candidates ADD COLUMN match_score INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'executive_summary') THEN
        ALTER TABLE public.candidates ADD COLUMN executive_summary TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'soft_skills_analysis') THEN
        ALTER TABLE public.candidates ADD COLUMN soft_skills_analysis TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'career_trajectory') THEN
        ALTER TABLE public.candidates ADD COLUMN career_trajectory TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'score_justification') THEN
        ALTER TABLE public.candidates ADD COLUMN score_justification TEXT;
    END IF;

    -- JSON Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'key_skills') THEN
        ALTER TABLE public.candidates ADD COLUMN key_skills JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'missing_skills') THEN
        ALTER TABLE public.candidates ADD COLUMN missing_skills JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'red_flags') THEN
        ALTER TABLE public.candidates ADD COLUMN red_flags JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'interview_questions') THEN
        ALTER TABLE public.candidates ADD COLUMN interview_questions JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'social_links') THEN
        ALTER TABLE public.candidates ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'email') THEN
        ALTER TABLE public.candidates ADD COLUMN email TEXT;
    END IF;
END $$;

-- 2. Add RLS policy for updating and inserting candidates
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidates' AND policyname = 'Members can update project candidates') THEN
        CREATE POLICY "Members can update project candidates" ON public.candidates
        FOR UPDATE USING (
            EXISTS (SELECT 1 FROM public.project_members WHERE project_id = candidates.project_id AND user_id = auth.uid())
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidates' AND policyname = 'Members can insert project candidates') THEN
        CREATE POLICY "Members can insert project candidates" ON public.candidates
        FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.project_members WHERE project_id = candidates.project_id AND user_id = auth.uid())
        );
    END IF;
END $$;

-- 3. Create RPCs for Candidate Actions

-- RPC: Get Candidate Drawer Data
CREATE OR REPLACE FUNCTION get_candidate_drawer_data(p_candidate_id UUID)
RETURNS TABLE (
    candidate_name TEXT,
    current_position TEXT,
    years_of_experience NUMERIC,
    location TEXT,
    email TEXT,
    phone TEXT,
    social_links JSONB,
    match_score INTEGER,
    career_trajectory TEXT,
    executive_summary TEXT,
    soft_skills_analysis TEXT,
    key_skills JSONB,
    missing_skills JSONB,
    red_flags JSONB,
    interview_questions JSONB,
    email_draft TEXT,
    email_sent_at TIMESTAMPTZ,
    original_resume_name TEXT,
    uploaded_at TIMESTAMPTZ
) AS $$
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
        c.career_trajectory,
        c.executive_summary,
        c.soft_skills_analysis,
        c.key_skills,
        c.missing_skills,
        c.red_flags,
        c.interview_questions,
        c.email_draft,
        c.email_sent_at,
        c.original_resume_name,
        c.uploaded_at
    FROM candidates c
    WHERE c.id = p_candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Save Email Draft
CREATE OR REPLACE FUNCTION save_candidate_email_draft(
    p_candidate_id UUID,
    p_draft TEXT,
    p_sent_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE candidates
    SET 
        email_draft = p_draft,
        email_sent_at = COALESCE(p_sent_at, email_sent_at)
    WHERE id = p_candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Update Interview Questions
CREATE OR REPLACE FUNCTION update_candidate_interview_questions(
    p_candidate_id UUID,
    p_questions JSONB
)
RETURNS VOID AS $$
BEGIN
    UPDATE candidates
    SET interview_questions = p_questions
    WHERE id = p_candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Mark Viewed
CREATE OR REPLACE FUNCTION mark_candidate_viewed(
    candidate_id UUID,
    user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE candidates
    SET viewed_by = array_append(COALESCE(viewed_by, '{}'), user_id)
    WHERE id = candidate_id AND NOT (viewed_by @> ARRAY[user_id]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Mark Exported
CREATE OR REPLACE FUNCTION mark_candidate_exported(
    candidate_id UUID,
    user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE candidates
    SET exported_by = array_append(COALESCE(exported_by, '{}'), user_id)
    WHERE id = candidate_id AND NOT (exported_by @> ARRAY[user_id]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
