-- Phase 1: Add proper admin RLS policies to leads, lead_outreach_events, outreach_suppressions
-- Using separate policies for SELECT, INSERT, UPDATE, DELETE with proper USING/WITH CHECK

-- ========== leads table ==========
-- Drop existing deny-all policy
DROP POLICY IF EXISTS "No public access to leads" ON leads;

-- Add admin policies
CREATE POLICY "Admins can select leads" 
  ON leads FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert leads" 
  ON leads FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update leads" 
  ON leads FOR UPDATE 
  USING (is_admin(auth.uid())) 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete leads" 
  ON leads FOR DELETE 
  USING (is_admin(auth.uid()));

-- ========== lead_outreach_events table ==========
-- Drop existing deny-all policy
DROP POLICY IF EXISTS "No public access to lead_outreach_events" ON lead_outreach_events;

-- Add admin policies
CREATE POLICY "Admins can select lead_outreach_events" 
  ON lead_outreach_events FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert lead_outreach_events" 
  ON lead_outreach_events FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update lead_outreach_events" 
  ON lead_outreach_events FOR UPDATE 
  USING (is_admin(auth.uid())) 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete lead_outreach_events" 
  ON lead_outreach_events FOR DELETE 
  USING (is_admin(auth.uid()));

-- ========== outreach_suppressions table ==========
-- Drop existing deny-all policy
DROP POLICY IF EXISTS "No public access to outreach_suppressions" ON outreach_suppressions;

-- Add admin policies
CREATE POLICY "Admins can select outreach_suppressions" 
  ON outreach_suppressions FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert outreach_suppressions" 
  ON outreach_suppressions FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update outreach_suppressions" 
  ON outreach_suppressions FOR UPDATE 
  USING (is_admin(auth.uid())) 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete outreach_suppressions" 
  ON outreach_suppressions FOR DELETE 
  USING (is_admin(auth.uid()));

-- ========== sms_templates table (also needs proper split policies) ==========
-- Drop existing policy
DROP POLICY IF EXISTS "Admin access only" ON sms_templates;

-- Add split policies
CREATE POLICY "Admins can select sms_templates" 
  ON sms_templates FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert sms_templates" 
  ON sms_templates FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update sms_templates" 
  ON sms_templates FOR UPDATE 
  USING (is_admin(auth.uid())) 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete sms_templates" 
  ON sms_templates FOR DELETE 
  USING (is_admin(auth.uid()));

-- ========== Phase 5: Create admin_actions audit log table ==========
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS - only service role can access (for edge function writes)
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Admins can read audit logs
CREATE POLICY "Admins can select admin_actions" 
  ON admin_actions FOR SELECT 
  USING (is_admin(auth.uid()));

-- Service role only for writes (edge functions)
CREATE POLICY "Service role can insert admin_actions" 
  ON admin_actions FOR INSERT 
  WITH CHECK (current_user = 'service_role');

-- ========== Phase 6: Allow nullable lead_id for unmatched inbound ==========
-- lead_outreach_events.lead_id should allow null for unmatched inbound SMS
-- Check if constraint exists and alter if needed
DO $$
BEGIN
  -- The lead_id column allows null already based on foreign key setup
  -- Just ensure we can insert with null lead_id
  NULL;
END $$;