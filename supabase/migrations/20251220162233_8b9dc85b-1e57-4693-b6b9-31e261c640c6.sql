-- Create admin_notes table for internal notes
CREATE TABLE public.admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- RLS policy: only accessible via service role (edge functions with admin key)
-- No public access to admin notes
CREATE POLICY "No public access to admin notes" 
ON public.admin_notes 
FOR ALL 
USING (false);

-- Create index for faster lookups
CREATE INDEX idx_admin_notes_project_id ON public.admin_notes(project_id);
CREATE INDEX idx_admin_notes_project_token ON public.admin_notes(project_token);

-- Trigger for updated_at
CREATE TRIGGER update_admin_notes_updated_at
BEFORE UPDATE ON public.admin_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();