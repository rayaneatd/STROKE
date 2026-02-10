-- 1. Create SECURITY DEFINER helper functions to break recursion
-- These functions run with the privileges of the creator and bypass RLS on the tables they query.

CREATE OR REPLACE FUNCTION public.check_is_project_member(p_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = p_id AND user_id = u_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_project_owner(p_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = p_id AND owner_id = u_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_project_admin_or_owner(p_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects WHERE id = p_id AND owner_id = u_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_members WHERE project_id = p_id AND user_id = u_id AND role IN ('OWNER', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing recursive policies
DROP POLICY IF EXISTS "Users can view projects they are members of" ON public.projects;
DROP POLICY IF EXISTS "Users can view joined projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view fellow project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners or Admins can manage members" ON public.project_members;

-- 3. Re-define Projects Policies
CREATE POLICY "Users can view projects they are members of" 
ON public.projects FOR SELECT 
TO authenticated 
USING (
    owner_id = auth.uid() OR 
    public.check_is_project_member(id, auth.uid())
);

-- 4. Re-define Project Members Policies
CREATE POLICY "Members can view fellow project members" 
ON public.project_members FOR SELECT 
TO authenticated 
USING (
    user_id = auth.uid() OR 
    public.check_is_project_member(project_id, auth.uid()) OR
    public.check_is_project_owner(project_id, auth.uid())
);

CREATE POLICY "Owners or Admins can manage members" 
ON public.project_members FOR ALL 
TO authenticated 
USING (
    public.check_is_project_admin_or_owner(project_id, auth.uid())
);
