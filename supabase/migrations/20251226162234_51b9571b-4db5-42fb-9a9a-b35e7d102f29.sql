-- Add attempt_count column to email_verifications for brute-force protection
ALTER TABLE public.email_verifications 
ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;

-- Add index for faster rate limit queries
CREATE INDEX IF NOT EXISTS idx_email_verifications_email_created 
ON public.email_verifications(email, created_at DESC);

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires 
ON public.email_verifications(expires_at) 
WHERE verified_at IS NULL;