-- Create operator_notes table for internal notes per project
CREATE TABLE public.operator_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token text NOT NULL,
  content text NOT NULL,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.operator_notes ENABLE ROW LEVEL SECURITY;

-- Block public access (service role only via edge functions)
CREATE POLICY "No public access to operator_notes"
ON public.operator_notes
FOR ALL
TO public
USING (false);

-- Create index for faster lookups
CREATE INDEX idx_operator_notes_project_id ON public.operator_notes(project_id);
CREATE INDEX idx_operator_notes_project_token ON public.operator_notes(project_token);

-- Create project_checklist_items table for tracking project milestones
CREATE TABLE public.project_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token text NOT NULL,
  label text NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.project_checklist_items ENABLE ROW LEVEL SECURITY;

-- Block public access (service role only via edge functions)
CREATE POLICY "No public access to project_checklist_items"
ON public.project_checklist_items
FOR ALL
TO public
USING (false);

-- Create indexes
CREATE INDEX idx_checklist_project_id ON public.project_checklist_items(project_id);
CREATE INDEX idx_checklist_project_token ON public.project_checklist_items(project_token);