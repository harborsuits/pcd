-- Add needs_info columns to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS needs_info boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_info_items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS needs_info_note text;

-- Create discovery checklist table
CREATE TABLE IF NOT EXISTS public.project_discovery_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token text NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  checked boolean NOT NULL DEFAULT false,
  checked_at timestamptz,
  checked_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, key)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_discovery_project ON public.project_discovery_checklist(project_id);
CREATE INDEX IF NOT EXISTS idx_discovery_token ON public.project_discovery_checklist(project_token);

-- Enable RLS
ALTER TABLE public.project_discovery_checklist ENABLE ROW LEVEL SECURITY;

-- Block public access (service role only)
CREATE POLICY "No public access to project_discovery_checklist"
  ON public.project_discovery_checklist
  AS RESTRICTIVE
  FOR ALL
  USING (false);