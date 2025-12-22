-- Fix overly permissive RLS policies by denying all direct anon access
-- All legitimate access goes through edge functions using service_role

-- Drop existing permissive policies and create restrictive ones
-- Projects table
DROP POLICY IF EXISTS "Public read by token" ON public.projects;
CREATE POLICY "No public access to projects" ON public.projects
  FOR ALL USING (false);

-- Demos table
DROP POLICY IF EXISTS "Public read by token" ON public.demos;
CREATE POLICY "No public access to demos" ON public.demos
  FOR ALL USING (false);

-- Messages table
DROP POLICY IF EXISTS "Public read by token" ON public.messages;
CREATE POLICY "No public access to messages" ON public.messages
  FOR ALL USING (false);

-- Files table
DROP POLICY IF EXISTS "Public read by token" ON public.files;
CREATE POLICY "No public access to files" ON public.files
  FOR ALL USING (false);

-- Payments table
DROP POLICY IF EXISTS "Public read by token" ON public.payments;
CREATE POLICY "No public access to payments" ON public.payments
  FOR ALL USING (false);

-- Outreach events table
DROP POLICY IF EXISTS "Public read by token" ON public.outreach_events;
CREATE POLICY "No public access to outreach_events" ON public.outreach_events
  FOR ALL USING (false);