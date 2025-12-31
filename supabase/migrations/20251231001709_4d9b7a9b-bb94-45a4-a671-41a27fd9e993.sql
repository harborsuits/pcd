-- Add phase_b_intake column to project_intakes for structured intake data
-- This stores the Phase B checklist data separately from the onboarding wizard data
ALTER TABLE public.project_intakes 
ADD COLUMN IF NOT EXISTS phase_b_json jsonb DEFAULT '{}'::jsonb;

-- Add phase_b_status to track completion
ALTER TABLE public.project_intakes 
ADD COLUMN IF NOT EXISTS phase_b_status text DEFAULT 'pending' 
CHECK (phase_b_status IN ('pending', 'in_progress', 'complete'));

-- Add completed_at for when Phase B was marked complete
ALTER TABLE public.project_intakes 
ADD COLUMN IF NOT EXISTS phase_b_completed_at timestamptz;