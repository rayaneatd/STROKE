-- 1. Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;

-- 2. Projects RLS Policies
DROP POLICY IF EXISTS "Users can view joined projects" ON public.projects;

CREATE POLICY "Users can view projects they are members of" 
ON public.projects FOR SELECT 
TO authenticated 
USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
);

CREATE POLICY "Users can create their own projects" 
ON public.projects FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners or Admins can update projects" 
ON public.projects FOR UPDATE 
TO authenticated 
USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid() AND role IN ('OWNER', 'ADMIN'))
);

CREATE POLICY "Only owners can delete projects" 
ON public.projects FOR DELETE 
TO authenticated 
USING (owner_id = auth.uid());

-- 3. Project Members RLS Policies
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members; -- Clean up if exists

CREATE POLICY "Members can view fellow project members" 
ON public.project_members FOR SELECT 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())))
);

CREATE POLICY "Owners or Admins can manage members" 
ON public.project_members FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_members.project_id AND user_id = auth.uid() AND role IN ('OWNER', 'ADMIN'))
    OR 
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

-- 4. Candidates RLS Policies
DROP POLICY IF EXISTS "Members can view project candidates" ON public.candidates;

CREATE POLICY "Members can view candidates of their projects" 
ON public.candidates FOR SELECT 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = candidates.project_id AND user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

CREATE POLICY "Members with SCAN permission can insert candidates" 
ON public.candidates FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = candidates.project_id AND user_id = auth.uid() AND 'SCAN' = ANY(permissions))
    OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

CREATE POLICY "Members with ANALYZE permission can update candidates" 
ON public.candidates FOR UPDATE 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = candidates.project_id AND user_id = auth.uid() AND 'ANALYZE' = ANY(permissions))
    OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

CREATE POLICY "Owners and Admins can delete candidates" 
ON public.candidates FOR DELETE 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = candidates.project_id AND user_id = auth.uid() AND role IN ('OWNER', 'ADMIN'))
    OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

-- 5. Trigger: Auto-add creator as OWNER
CREATE OR REPLACE FUNCTION public.handle_project_creator_membership()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role, joined_at)
  VALUES (new.id, new.owner_id, 'OWNER', NOW());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_project_creator_membership();










-- 6. Budget Columns (Ensure they exist)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS total_invested INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS investment_balance INTEGER DEFAULT 0;

-- 7. Atomic Function for Funding/Withdrawal
CREATE OR REPLACE FUNCTION public.transfer_project_funds(
    p_project_id UUID,
    p_amount INTEGER,
    p_action TEXT -- 'DEPOSIT' or 'WITHDRAW'
)
RETURNS JSONB AS $$
DECLARE
    v_owner_id UUID;
    v_owner_balance INTEGER;
    v_project_balance INTEGER;
    v_result JSONB;
BEGIN
    -- 1. Get Project Owner and Balances
    SELECT owner_id, investment_balance INTO v_owner_id, v_project_balance
    FROM public.projects WHERE id = p_project_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Project not found');
    END IF;

    -- Ensure only owner can fund/withdraw
    IF v_owner_id != auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only owner can manage funds');
    END IF;

    SELECT scans_balance INTO v_owner_balance FROM public.profiles WHERE id = v_owner_id;

    -- 2. Validate and Execute
    IF p_action = 'DEPOSIT' THEN
        IF v_owner_balance < p_amount THEN
            RETURN jsonb_build_object('success', false, 'error', 'Insufficient personal balance');
        END IF;

        UPDATE public.profiles SET scans_balance = scans_balance - p_amount WHERE id = v_owner_id;
        UPDATE public.projects SET 
            investment_balance = investment_balance + p_amount,
            total_invested = total_invested + p_amount
        WHERE id = p_project_id;
        
    ELSIF p_action = 'WITHDRAW' THEN
        IF v_project_balance < p_amount THEN
            RETURN jsonb_build_object('success', false, 'error', 'Insufficient project balance');
        END IF;

        UPDATE public.projects SET investment_balance = investment_balance - p_amount WHERE id = p_project_id;
        UPDATE public.profiles SET scans_balance = scans_balance + p_amount WHERE id = v_owner_id;
        
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
    END IF;

    -- 3. Return updated state
    RETURN jsonb_build_object(
        'success', true, 
        'project_balance', (SELECT investment_balance FROM public.projects WHERE id = p_project_id),
        'user_balance', (SELECT scans_balance FROM public.profiles WHERE id = v_owner_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
