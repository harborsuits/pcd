-- Drop the existing check constraint and recreate with all valid values
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS valid_service_type;

ALTER TABLE public.projects ADD CONSTRAINT valid_service_type 
  CHECK (service_type IN ('website', 'ai', 'ai_receptionist', 'both', 'other', 'demo'));