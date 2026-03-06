
-- MEGA FIX FOR CANDIDATE ACTIONS AND ANTI-GHOSTING

-- 1. FIX STATUS CONSTRAINT
ALTER TABLE public.candidates 
DROP CONSTRAINT IF EXISTS candidates_status_check;

-- Standardize statuses to lowercase to match frontend usage
UPDATE public.candidates SET status = LOWER(status);

ALTER TABLE public.candidates
ADD CONSTRAINT candidates_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'new', 'screened', 'interview', 'rejected', 'hired'));

-- 2. ENSURE COLUMNS EXIST
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'is_favorite') THEN
        ALTER TABLE public.candidates ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'email_draft') THEN
        ALTER TABLE public.candidates ADD COLUMN email_draft TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'email_sent_at') THEN
        ALTER TABLE public.candidates ADD COLUMN email_sent_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'viewed_by') THEN
        ALTER TABLE public.candidates ADD COLUMN viewed_by UUID[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'exported_by') THEN
        ALTER TABLE public.candidates ADD COLUMN exported_by UUID[] DEFAULT '{}';
    END IF;
END $$;

-- 3. FIX RLS POLICIES
-- Drop potentially broken policies
DROP POLICY IF EXISTS "Members can update project candidates" ON public.candidates;
DROP POLICY IF EXISTS "Members can insert project candidates" ON public.candidates;

-- Create robust policies
CREATE POLICY "Members can update project candidates" ON public.candidates
FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.project_members 
        WHERE project_id = candidates.project_id 
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.project_members 
        WHERE project_id = candidates.project_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Members can insert project candidates" ON public.candidates
FOR INSERT 
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.project_members 
        WHERE project_id = candidates.project_id 
        AND user_id = auth.uid()
    )
);

-- 4. CREATE MISSING RPCS

-- RPC: Get AI Tone for Anti-Ghosting
CREATE OR REPLACE FUNCTION get_project_owner_ai_tone(p_project_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_owner_id UUID;
    v_tone TEXT;
BEGIN
    SELECT owner_id INTO v_owner_id FROM projects WHERE id = p_project_id;
    
    SELECT (preferences->>'aiTone') INTO v_tone 
    FROM profiles 
    WHERE id = v_owner_id;
    
    RETURN COALESCE(v_tone, 'PROFESSIONAL');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Mark Exported
CREATE OR REPLACE FUNCTION mark_candidate_exported(candidate_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE candidates
    SET exported_by = array_append(COALESCE(exported_by, '{}'), user_id)
    WHERE id = candidate_id AND NOT (exported_by @> ARRAY[user_id]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Mark Viewed
CREATE OR REPLACE FUNCTION mark_candidate_viewed(candidate_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE candidates
    SET viewed_by = array_append(COALESCE(viewed_by, '{}'), user_id)
    WHERE id = candidate_id AND NOT (viewed_by @> ARRAY[user_id]);
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

-- RPC: Get Candidate Drawer Data (Comprehensive)
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
