-- Create client_leads table for public lead capture (before auth)
CREATE TABLE public.client_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_normalized text GENERATED ALWAYS AS (lower(trim(email))) STORED,
  name text,
  phone text,
  business_name text NOT NULL,
  source text DEFAULT 'get-started',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  claimed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_leads ENABLE ROW LEVEL SECURITY;

-- Public can insert (rate limited in edge function)
CREATE POLICY "Anyone can create a lead"
ON public.client_leads
FOR INSERT
WITH CHECK (true);

-- Users can view their own claimed leads
CREATE POLICY "Users can view their claimed leads"
ON public.client_leads
FOR SELECT
USING (auth.uid() = claimed_by_user_id);

-- Users can claim unclaimed leads matching their email
CREATE POLICY "Users can claim leads matching their email"
ON public.client_leads
FOR UPDATE
USING (
  claimed_by_user_id IS NULL 
  AND email_normalized = lower(trim((SELECT email FROM auth.users WHERE id = auth.uid())))
)
WITH CHECK (
  claimed_by_user_id = auth.uid()
);

-- Index for fast lookups
CREATE INDEX idx_client_leads_email_normalized ON public.client_leads(email_normalized);
CREATE INDEX idx_client_leads_unclaimed ON public.client_leads(email_normalized) WHERE claimed_by_user_id IS NULL;