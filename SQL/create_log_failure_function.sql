-- Create a robust function to log failures, bypassing complex client-side RLS checks if needed
-- This function runs with SECURITY DEFINER to ensure it has permissions to insert into analytics_events
-- but checks permissions manually to ensure security.

CREATE OR REPLACE FUNCTION public.log_failure_event(
    p_project_id UUID,
    p_user_id UUID,
    p_reason TEXT,
    p_file_name TEXT,
    p_file_size BIGINT,
    p_file_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the creator (usually postgres/admin)
AS $$
BEGIN
    -- 1. Security Check: Ensure the user is actually a member of the project or the owner
    -- This prevents random users from spamming logs into projects they don't own.
    IF NOT EXISTS (
        SELECT 1 FROM public.project_members WHERE project_id = p_project_id AND user_id = auth.uid()
    ) AND NOT EXISTS (
        SELECT 1 FROM public.projects WHERE id = p_project_id AND owner_id = auth.uid()
    ) THEN
        -- Allow the operation if the p_user_id matches auth.uid() (self-action) AND they have access
        -- But if auth.uid() is null (service role) or different, we trust the caller IF it's an internal process.
        -- For now, let's stick to standard RLS-like logic: caller must be authorized.
        
        -- Fallback: If auth.uid() is missing (edge case), we might want to allow it if we trust the backend.
        -- But for client-side calls, auth.uid() should be present.
        IF auth.uid() IS NULL THEN
             RAISE EXCEPTION 'Not authenticated';
        END IF;

        RAISE EXCEPTION 'User does not have permission to log events for this project';
    END IF;

    -- 2. Perform the Insert
    INSERT INTO public.analytics_events (
        project_id,
        user_id,
        event_type,
        metadata,
        created_at
    ) VALUES (
        p_project_id,
        auth.uid(), -- Force use of authenticated user ID for security, or use p_user_id if you trust the input
        'FAIL',
        jsonb_build_object(
            'reason', p_reason,
            'fileName', p_file_name,
            'size', p_file_size,
            'type', p_file_type
        ),
        NOW()
    );

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log error (optional) or just return false
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_failure_event TO authenticated;
