-- Add portal_stage column to projects for explicit phase control
ALTER TABLE public.projects
ADD COLUMN portal_stage text NOT NULL DEFAULT 'intake'
CONSTRAINT portal_stage_check CHECK (portal_stage IN ('intake', 'build', 'preview', 'revisions', 'final', 'launched'));

-- Add stage_changed_at for tracking
ALTER TABLE public.projects
ADD COLUMN portal_stage_changed_at timestamp with time zone DEFAULT now();

-- Add stage_changed_by for audit
ALTER TABLE public.projects
ADD COLUMN portal_stage_changed_by text;