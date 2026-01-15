-- Add AI trial tracking columns to projects table
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS is_ai_trial BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_trial_ends_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for filtering trials
CREATE INDEX IF NOT EXISTS idx_projects_ai_trial ON public.projects (is_ai_trial) WHERE is_ai_trial = TRUE;

-- Comment for clarity
COMMENT ON COLUMN public.projects.is_ai_trial IS 'True if this is a 7-day AI receptionist trial';
COMMENT ON COLUMN public.projects.ai_trial_ends_at IS 'When the 7-day trial expires (NULL for non-trials)';