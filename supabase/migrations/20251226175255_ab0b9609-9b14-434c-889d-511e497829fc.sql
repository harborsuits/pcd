-- Create project milestones table
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  is_done BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_client_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestone notes table
CREATE TABLE public.milestone_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES public.project_milestones(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies - No direct public access (accessed via admin edge function)
CREATE POLICY "No public access to project_milestones"
ON public.project_milestones
FOR ALL
USING (false);

CREATE POLICY "No public access to milestone_notes"
ON public.milestone_notes
FOR ALL
USING (false);

-- Add trigger for updated_at on milestones
CREATE TRIGGER update_project_milestones_updated_at
BEFORE UPDATE ON public.project_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_project_milestones_project_token ON public.project_milestones(project_token);
CREATE INDEX idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX idx_milestone_notes_milestone_id ON public.milestone_notes(milestone_id);