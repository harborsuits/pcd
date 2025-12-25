-- Add intake_status column to project_intakes
ALTER TABLE public.project_intakes 
ADD COLUMN intake_status text NOT NULL DEFAULT 'draft' 
CHECK (intake_status IN ('draft', 'submitted', 'approved'));