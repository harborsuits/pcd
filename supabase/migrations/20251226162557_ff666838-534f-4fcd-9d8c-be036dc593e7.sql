-- Add requester_ip column for IP-based rate limiting
ALTER TABLE public.email_verifications 
ADD COLUMN IF NOT EXISTS requester_ip text;

-- Add index for IP rate limiting queries
CREATE INDEX IF NOT EXISTS idx_email_verifications_ip_created 
ON public.email_verifications(requester_ip, created_at DESC) 
WHERE requester_ip IS NOT NULL;