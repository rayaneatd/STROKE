-- Add missing columns to profiles table for richer user identity
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS overage_cap INTEGER DEFAULT 500;

-- Enable Realtime for the profiles table
-- This allows UI components to update instantly when preferences change on another device
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
