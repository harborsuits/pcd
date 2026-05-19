ALTER TABLE public.client_leads ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.client_leads ADD COLUMN IF NOT EXISTS business_type text;
ALTER TABLE public.client_leads ADD COLUMN IF NOT EXISTS website_url text;