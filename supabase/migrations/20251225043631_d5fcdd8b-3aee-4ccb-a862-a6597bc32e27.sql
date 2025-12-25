-- Prototypes table (one per project, can have versions)
CREATE TABLE public.prototypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  url TEXT NOT NULL,
  version_label TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pin comments (attached to prototype by x/y percentage)
CREATE TABLE public.prototype_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prototype_id UUID NOT NULL REFERENCES prototypes(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  author_type TEXT NOT NULL,
  body TEXT NOT NULL,
  pin_x NUMERIC,
  pin_y NUMERIC,
  resolved_at TIMESTAMPTZ,
  source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prototypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prototype_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies (service_role only, accessed via edge functions)
CREATE POLICY "No public access to prototypes" ON public.prototypes FOR ALL USING (false);
CREATE POLICY "No public access to prototype_comments" ON public.prototype_comments FOR ALL USING (false);

-- Indexes for performance
CREATE INDEX idx_prototypes_project_token ON public.prototypes(project_token);
CREATE INDEX idx_prototypes_project_id ON public.prototypes(project_id);
CREATE INDEX idx_prototype_comments_prototype_id ON public.prototype_comments(prototype_id);
CREATE INDEX idx_prototype_comments_project_token ON public.prototype_comments(project_token);

-- Updated_at trigger for prototypes
CREATE TRIGGER update_prototypes_updated_at
  BEFORE UPDATE ON public.prototypes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.prototype_comments;