-- Add industry_template and company_blurb to leads table (if not present)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS industry_template text,
ADD COLUMN IF NOT EXISTS company_blurb text;