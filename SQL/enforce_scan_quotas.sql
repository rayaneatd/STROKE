
-- Function to deduct scan credits with quota enforcement
CREATE OR REPLACE FUNCTION public.deduct_scan_credits(
    p_project_id UUID,
    p_user_id UUID,
    p_cost INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_record RECORD;
    v_project_record RECORD;
    v_owner_record RECORD;
    v_new_balance INTEGER;
    v_billing_mode TEXT;
    v_quota_val INTEGER;
BEGIN
    -- 1. Get Member Info (Quota & Usage)
    SELECT * INTO v_member_record
    FROM public.project_members
    WHERE project_id = p_project_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User is not a member of this project');
    END IF;

    -- 2. Check Member Quota
    -- scan_quota is TEXT: 'UNLIMITED' or number string
    IF v_member_record.scan_quota IS NOT NULL AND v_member_record.scan_quota != 'UNLIMITED' THEN
        v_quota_val := v_member_record.scan_quota::INTEGER;
        IF (v_member_record.scans_used + p_cost) > v_quota_val THEN
             RETURN jsonb_build_object('success', false, 'error', 'Member scan quota exceeded');
        END IF;
    END IF;

    -- 3. Get Project Info (Billing Mode & Investment Balance)
    SELECT * INTO v_project_record
    FROM public.projects
    WHERE id = p_project_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Project not found');
    END IF;

    v_billing_mode := v_project_record.settings->>'billingMode';

    -- 4. Handle Billing Deduction
    IF v_billing_mode = 'PROJECT_INVESTMENT' THEN
        -- Deduct from Project Investment Balance
        IF v_project_record.investment_balance < p_cost THEN
            RETURN jsonb_build_object('success', false, 'error', 'Project investment balance insufficient');
        END IF;

        UPDATE public.projects
        SET investment_balance = investment_balance - p_cost
        WHERE id = p_project_id
        RETURNING investment_balance INTO v_new_balance;

    ELSE
        -- Default: Shared Wallet (Deduct from Owner)
        SELECT * INTO v_owner_record
        FROM public.profiles
        WHERE id = v_project_record.owner_id;

        IF v_owner_record.scans_balance < p_cost THEN
             RETURN jsonb_build_object('success', false, 'error', 'Owner wallet balance insufficient');
        END IF;

        UPDATE public.profiles
        SET scans_balance = scans_balance - p_cost
        WHERE id = v_project_record.owner_id;
        
        v_new_balance := v_owner_record.scans_balance - p_cost;
    END IF;

    -- 5. Update Member Usage
    UPDATE public.project_members
    SET scans_used = scans_used + p_cost
    WHERE project_id = p_project_id AND user_id = p_user_id;

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
