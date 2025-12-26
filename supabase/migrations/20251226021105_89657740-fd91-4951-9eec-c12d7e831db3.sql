-- Add email_verified column to projects table
-- This gates portal access independent of Supabase auth state
ALTER TABLE public.projects
ADD COLUMN email_verified boolean NOT NULL DEFAULT false;