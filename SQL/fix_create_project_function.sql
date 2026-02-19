CREATE OR REPLACE FUNCTION public.create_project_with_funding(
    p_project_data JSONB,
    p_owner_id UUID,
    p_investment_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_project_id UUID;
  v_owner_balance INTEGER;
BEGIN
  -- Check owner balance if investment is required
  IF p_investment_amount > 0 THEN
    SELECT COALESCE(scans_balance, 0) INTO v_owner_balance
    FROM profiles
    WHERE id = p_owner_id;

    IF v_owner_balance < p_investment_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Deduct from owner
    UPDATE profiles
    SET scans_balance = scans_balance - p_investment_amount
    WHERE id = p_owner_id;
  END IF;

  -- Insert Project
  INSERT INTO projects (
    title,
    description,
    owner_id,
    status,
    settings,
    investment_balance,
    total_invested
  ) VALUES (
    p_project_data->>'title',
    p_project_data->>'description',
    p_owner_id,
    COALESCE(p_project_data->>'status', 'ACTIVE'),
    COALESCE(p_project_data->'settings', '{}'::jsonb),
    p_investment_amount, -- Initial balance
    p_investment_amount  -- Total invested
  ) RETURNING id INTO v_project_id;

  -- Insert Owner Member (with ON CONFLICT UPDATE to handle trigger pre-insertion)
  INSERT INTO project_members (
    project_id,
    user_id,
    role,
    permissions,
    scan_quota,
    joined_at
  ) VALUES (
    v_project_id,
    p_owner_id,
    'OWNER',
    '{SCAN,ANALYZE,MANAGE_TEAM,MANAGE_SETTINGS}'::text[],
    'UNLIMITED', -- Fixed: Use string 'UNLIMITED' instead of -1 integer if column is text, or check schema
    now()
  )
  ON CONFLICT (project_id, user_id) 
  DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    scan_quota = EXCLUDED.scan_quota;

  RETURN jsonb_build_object(
    'success', true, 
    'project_id', v_project_id,
    'new_balance', CASE WHEN p_investment_amount > 0 THEN v_owner_balance - p_investment_amount ELSE NULL END
  );
EXCEPTION WHEN OTHERS THEN
  -- Rollback will happen automatically
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
