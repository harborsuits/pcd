-- Add columns for Ulio AI receptionist integration
-- service_type: what product(s) the client is getting
-- ulio_business_id: the UUID from Ulio's partner portal
-- ulio_setup_url: deep link to this client's Ulio setup page

-- Add service_type column with default 'website'
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT 'website';

-- Add Ulio integration fields
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS ulio_business_id text;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS ulio_setup_url text;

-- Add check constraint for valid service types
ALTER TABLE public.projects 
ADD CONSTRAINT valid_service_type CHECK (service_type IN ('website', 'ai_receptionist', 'both'));

-- Add index for service_type for filtering
CREATE INDEX IF NOT EXISTS idx_projects_service_type ON public.projects(service_type);

-- Comment for documentation
COMMENT ON COLUMN public.projects.service_type IS 'Product type: website, ai_receptionist, or both';
COMMENT ON COLUMN public.projects.ulio_business_id IS 'Ulio partner portal business UUID';
COMMENT ON COLUMN public.projects.ulio_setup_url IS 'Deep link to Ulio setup page for this client';