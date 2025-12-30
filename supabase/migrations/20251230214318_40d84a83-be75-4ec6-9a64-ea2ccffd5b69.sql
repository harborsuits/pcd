-- Add pipeline_stage for CRM lifecycle tracking
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS pipeline_stage text NOT NULL DEFAULT 'new';

-- Add source_demo_token to track which demo they came from
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS source_demo_token text;

-- Create index for pipeline stage filtering
CREATE INDEX IF NOT EXISTS idx_projects_pipeline_stage ON public.projects(pipeline_stage);

-- Create index for duplicate detection
CREATE INDEX IF NOT EXISTS idx_projects_contact_email ON public.projects(contact_email) WHERE contact_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_contact_phone ON public.projects(contact_phone) WHERE contact_phone IS NOT NULL;