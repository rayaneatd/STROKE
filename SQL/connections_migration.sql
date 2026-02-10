-- Refinement of RLS Policies for Profiles & Connections
-- Execute this to enable the social/networking features

-- 1. Allow users to FIND other users by email (required for invitations)
-- We keep it safe by only allowing SELECT.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- 2. Connections: More granular RLS
DROP POLICY IF EXISTS "Users can view own connections" ON public.connections;

-- Allow users to see connections they are part of
CREATE POLICY "Users can view their own connections" 
ON public.connections FOR SELECT 
TO authenticated 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Allow users to send invitations
CREATE POLICY "Users can insert connection requests" 
ON public.connections FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = sender_id);

-- Allow participants to update status (Accept/Decline) or sender to Cancel
CREATE POLICY "Users can update their connection status" 
ON public.connections FOR UPDATE 
TO authenticated 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Allow participants to remove connection or sender to cancel
CREATE POLICY "Users can delete their connections" 
ON public.connections FOR DELETE 
TO authenticated 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
