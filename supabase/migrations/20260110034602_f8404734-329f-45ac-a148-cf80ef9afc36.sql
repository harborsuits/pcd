-- Fix SECURITY DEFINER function to use empty search_path for defense-in-depth
-- The function already uses fully qualified table names (public.client_leads), so this is safe

CREATE OR REPLACE FUNCTION public.check_client_lead_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;