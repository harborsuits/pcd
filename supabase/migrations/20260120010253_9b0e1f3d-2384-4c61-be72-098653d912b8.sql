-- Add claim code columns to projects for secure ownership claiming
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS claim_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS claim_code_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claim_code_used_at TIMESTAMPTZ;

-- Create index for fast claim code lookups
CREATE INDEX IF NOT EXISTS idx_projects_claim_code 
  ON public.projects (claim_code) WHERE claim_code IS NOT NULL;