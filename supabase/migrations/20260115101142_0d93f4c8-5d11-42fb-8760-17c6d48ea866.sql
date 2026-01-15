-- Add delivery tracking columns to lead_outreach_events
ALTER TABLE public.lead_outreach_events
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivery_status_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivery_error_code TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ DEFAULT NULL;

-- Update existing inbound records
UPDATE public.lead_outreach_events 
SET direction = 'inbound' 
WHERE status = 'replied';

-- Create sms_templates table
CREATE TABLE public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- Admin-only policy
CREATE POLICY "Admin access only" ON public.sms_templates
  FOR ALL USING (public.is_admin(auth.uid()));

-- Seed with existing templates
INSERT INTO public.sms_templates (name, body) VALUES
  ('intro_v1', 'Hi! I noticed {{business_name}} doesn''t have a website yet. I built a free demo for you to check out: {{demo_url}} - Reply STOP to opt out.'),
  ('intro_v2', 'Hey there! I created a quick website preview for {{business_name}}: {{demo_url}} - Let me know what you think! Reply STOP to opt out.');

-- Add index for faster lookups
CREATE INDEX idx_lead_outreach_events_direction ON public.lead_outreach_events(direction);
CREATE INDEX idx_lead_outreach_events_seen_at ON public.lead_outreach_events(seen_at) WHERE seen_at IS NULL;