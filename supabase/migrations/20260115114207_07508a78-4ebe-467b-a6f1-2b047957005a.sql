-- Update SMS templates to use {{site_url}} with casual tone
-- First clear existing and insert fresh

-- Update intro_v1
UPDATE public.sms_templates 
SET body = 'Hi! I help local businesses like {{business_name}} get found online with websites + AI receptionists. Check us out: {{site_url}} — Reply STOP to opt out.',
    updated_at = now()
WHERE name = 'intro_v1';

-- Update intro_v2
UPDATE public.sms_templates 
SET body = 'Hey! Quick question — does {{business_name}} have a website yet? If not, I''d love to help. See what we do: {{site_url}} — Reply STOP to opt out.',
    updated_at = now()
WHERE name = 'intro_v2';

-- Insert intro_v3 if it doesn't exist
INSERT INTO public.sms_templates (name, body, is_active)
VALUES (
  'intro_v3',
  'Hi there! I noticed {{business_name}} and thought you might like what we do for local businesses — websites that actually bring in calls. Take a look: {{site_url}} — Reply STOP anytime.',
  true
)
ON CONFLICT (name) DO UPDATE SET 
  body = EXCLUDED.body,
  updated_at = now();