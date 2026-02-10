-- 1. Allow authenticated users to search/view other profiles
-- This is necessary for the "Add Member" search functionality to work.
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
CREATE POLICY "Enable read access for authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- 2. Create a SECURITY DEFINER function to fetch connections securely
-- This allows Admins to see the Project Owner's connections if project settings allow it.
CREATE OR REPLACE FUNCTION public.get_project_owner_connections(p_project_id UUID)
RETURNS SETOF public.profiles AS $$
DECLARE
    v_owner_id UUID;
    v_permission TEXT;
BEGIN
    -- Get project owner and permission setting
    SELECT owner_id, (settings->>'employeeAddPermission')::TEXT 
    INTO v_owner_id, v_permission
    FROM public.projects 
    WHERE id = p_project_id;

    -- Guard: Only Owner or Admins can call this
    IF NOT (
        v_owner_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = p_project_id 
            AND user_id = auth.uid() 
            AND role IN ('OWNER', 'ADMIN')
        )
    ) THEN
        RETURN;
    END IF;

    -- Guard: If permission is NOT 'ALL' or 'OWNER_CONNECTIONS', and caller is NOT owner, return empty
    IF v_owner_id != auth.uid() AND v_permission NOT IN ('ALL', 'OWNER_CONNECTIONS') THEN
        RETURN;
    END IF;

    -- Return profiles of users connected to the owner
    RETURN QUERY
    SELECT p.*
    FROM public.profiles p
    JOIN public.connections c ON (c.sender_id = p.id OR c.receiver_id = p.id)
    WHERE (c.sender_id = v_owner_id OR c.receiver_id = v_owner_id)
    AND c.status = 'CONNECTED'
    AND p.id != v_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_project_owner_connections(UUID) TO authenticated;

-- 4. Refine Project Members policies for safer management
DROP POLICY IF EXISTS "Owners or Admins can manage members" ON public.project_members;
CREATE POLICY "Owners or Admins can manage members" 
ON public.project_members FOR ALL 
TO authenticated 
USING (
    public.check_is_project_admin_or_owner(project_id, auth.uid())
);
