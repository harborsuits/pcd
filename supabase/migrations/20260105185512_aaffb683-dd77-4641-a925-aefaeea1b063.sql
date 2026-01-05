-- Add service_type column to projects table
-- Values: 'website' | 'ai' | 'both'
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT 'website';

-- Add a comment for documentation
COMMENT ON COLUMN public.projects.service_type IS 'Type of service: website, ai, or both';

-- Create an index for filtering by service_type
CREATE INDEX IF NOT EXISTS idx_projects_service_type ON public.projects(service_type);

-- Create a composite index for common operator queries
CREATE INDEX IF NOT EXISTS idx_projects_pipeline_service ON public.projects(pipeline_stage, service_type) WHERE deleted_at IS NULL;