
-- 1. Add columns for scan logic to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS raw_text TEXT,

ADD COLUMN IF NOT EXISTS original_resume_name TEXT,
ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- Index on file_hash for faster duplicate checks
CREATE INDEX IF NOT EXISTS idx_candidates_file_hash ON public.candidates(file_hash);
CREATE INDEX IF NOT EXISTS idx_candidates_project_id_hash ON public.candidates(project_id, file_hash);

-- 2. Trigger to clean up raw_text when status is COMPLETED
CREATE OR REPLACE FUNCTION public.cleanup_raw_text()
RETURNS trigger AS $$
BEGIN
  -- When status changes to COMPLETED, clear the raw_text to save space
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    NEW.raw_text = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_cleanup_raw_text ON public.candidates;
CREATE TRIGGER trigger_cleanup_raw_text
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_raw_text();

-- 3. Storage RLS for 'resumes' bucket
-- Note: You must create the bucket 'resumes' in the dashboard if it doesn't exist, 
-- or via API. SQL cannot create buckets directly in all Supabase versions/setups easily 
-- without pg_net or specific extensions, so we assume it exists.

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow uploads if user is a member of the project
-- Path structure: {project_id}/{filename}
CREATE POLICY "Users can upload resumes to their projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id::text = (storage.foldername(name))[1]
    AND pm.user_id = auth.uid()
  )
);

-- Policy: Allow reads if user is a member of the project
CREATE POLICY "Users can view resumes in their projects"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id::text = (storage.foldername(name))[1]
    AND pm.user_id = auth.uid()
  )
);

-- Policy: Allow delete (optional, for cleanup)
CREATE POLICY "Users can delete resumes in their projects"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id::text = (storage.foldername(name))[1]
    AND pm.user_id = auth.uid()
  )
);
