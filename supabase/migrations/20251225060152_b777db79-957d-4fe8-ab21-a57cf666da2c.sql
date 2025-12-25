-- Attachments for prototype comments (pins)
CREATE TABLE public.prototype_comment_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_token TEXT NOT NULL,
  prototype_id UUID NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.prototype_comments(id) ON DELETE CASCADE,
  uploader_type TEXT NOT NULL CHECK (uploader_type IN ('client', 'admin')),
  uploader_user_id UUID NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient lookups
CREATE INDEX idx_pcm_project_token ON public.prototype_comment_media(project_token);
CREATE INDEX idx_pcm_comment_id ON public.prototype_comment_media(comment_id);
CREATE INDEX idx_pcm_prototype_id ON public.prototype_comment_media(prototype_id);

-- Enable RLS
ALTER TABLE public.prototype_comment_media ENABLE ROW LEVEL SECURITY;

-- Block direct table access (use edge functions only)
CREATE POLICY "No direct access to prototype_comment_media"
ON public.prototype_comment_media
FOR ALL
TO public
USING (false);