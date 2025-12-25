-- Create storage bucket for project media
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-media', 'project-media', false)
ON CONFLICT (id) DO NOTHING;

-- Create project_media table
CREATE TABLE public.project_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_token TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploader_type TEXT NOT NULL CHECK (uploader_type IN ('client', 'admin')),
  uploader_user_id UUID NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on project_token for fast lookups
CREATE INDEX idx_project_media_project_token ON public.project_media(project_token);

-- Enable RLS
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

-- Block all direct public access (access via edge functions only)
CREATE POLICY "No public access to project_media"
ON public.project_media
FOR ALL
TO public
USING (false);

-- Storage policies for project-media bucket
-- Admin can do anything
CREATE POLICY "Admin full access to project-media"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'project-media')
WITH CHECK (bucket_id = 'project-media');

-- Service role can do anything (for edge functions)
CREATE POLICY "Service role access to project-media"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'project-media')
WITH CHECK (bucket_id = 'project-media');