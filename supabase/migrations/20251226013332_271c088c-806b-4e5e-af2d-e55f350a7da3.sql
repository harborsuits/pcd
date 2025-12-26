-- Email verification table for OTP codes
CREATE TABLE public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified_at timestamp with time zone,
  project_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for quick lookup by email
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX idx_email_verifications_expires ON public.email_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Block all direct access - only service role can touch this
CREATE POLICY "No public access to email_verifications"
  ON public.email_verifications
  FOR ALL
  USING (false);