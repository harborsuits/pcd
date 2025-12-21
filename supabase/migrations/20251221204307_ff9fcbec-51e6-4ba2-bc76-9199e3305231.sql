-- Add lead_enriched column for Google Places data (separate from lead_reasons array)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_enriched jsonb DEFAULT '{}'::jsonb;