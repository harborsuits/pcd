-- Create project_intakes table for structured intake data with versioning
CREATE TABLE public.project_intakes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_user_id uuid,
  intake_version integer NOT NULL DEFAULT 1,
  intake_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_project_intakes_project_id ON public.project_intakes(project_id);
CREATE INDEX idx_project_intakes_owner_user_id ON public.project_intakes(owner_user_id);

-- Enable RLS
ALTER TABLE public.project_intakes ENABLE ROW LEVEL SECURITY;

-- Block public access (restrictive policy)
CREATE POLICY "No public access to project_intakes"
ON public.project_intakes
FOR ALL
USING (false);

-- Add trigger for updated_at
CREATE TRIGGER update_project_intakes_updated_at
BEFORE UPDATE ON public.project_intakes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();