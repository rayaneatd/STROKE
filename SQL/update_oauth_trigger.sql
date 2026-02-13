-- Improved trigger for handling OAuth user creation
-- Handles various metadata keys for name and avatar

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  meta_name text;
  meta_avatar text;
BEGIN
  -- Try to find a name in metadata
  meta_name := new.raw_user_meta_data->>'display_name';
  IF meta_name IS NULL OR meta_name = '' THEN
    meta_name := new.raw_user_meta_data->>'full_name';
  END IF;
  IF meta_name IS NULL OR meta_name = '' THEN
    meta_name := new.raw_user_meta_data->>'name';
  END IF;
  -- Fallback to email username if no name found
  IF meta_name IS NULL OR meta_name = '' THEN
    meta_name := split_part(new.email, '@', 1);
  END IF;

  -- Try to find avatar in metadata
  meta_avatar := new.raw_user_meta_data->>'avatar_url';
  IF meta_avatar IS NULL OR meta_avatar = '' THEN
    meta_avatar := new.raw_user_meta_data->>'picture'; -- Google often uses 'picture'
  END IF;

  INSERT INTO public.profiles (id, email, display_name, avatar_url, role, subscription_plan)
  VALUES (
    new.id, 
    new.email, 
    meta_name, 
    meta_avatar,
    'USER',
    'FREE'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
