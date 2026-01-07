-- Add rate limiting trigger for client_leads to prevent spam
-- This replaces the overly permissive "WITH CHECK (true)" INSERT policy

-- Create a function to check rate limits before allowing inserts
CREATE OR REPLACE FUNCTION public.check_client_lead_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_email_count integer;
  recent_phone_count integer;
BEGIN
  -- Check if this email has submitted too many leads recently (max 3 per hour)
  SELECT COUNT(*) INTO recent_email_count
  FROM public.client_leads
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND email_normalized = lower(trim(NEW.email));
  
  IF recent_email_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many submissions from this email';
  END IF;
  
  -- Check if this phone has submitted too many leads recently (max 3 per hour)
  IF NEW.phone IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_phone_count
    FROM public.client_leads
    WHERE created_at > NOW() - INTERVAL '1 hour'
      AND phone = NEW.phone;
    
    IF recent_phone_count >= 3 THEN
      RAISE EXCEPTION 'Rate limit exceeded: too many submissions from this phone';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce rate limiting
DROP TRIGGER IF EXISTS enforce_client_lead_rate_limit ON public.client_leads;
CREATE TRIGGER enforce_client_lead_rate_limit
  BEFORE INSERT ON public.client_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.check_client_lead_rate_limit();

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can create a lead" ON public.client_leads;

-- Create a more restrictive policy that still allows public inserts but with basic validation
CREATE POLICY "Public can create leads with valid data"
ON public.client_leads
FOR INSERT
WITH CHECK (
  -- Require non-empty business name and email
  business_name IS NOT NULL 
  AND length(trim(business_name)) > 0
  AND email IS NOT NULL 
  AND length(trim(email)) > 0
  AND position('@' in email) > 1
);