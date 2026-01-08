-- Create comment_versions table for version history
CREATE TABLE public.comment_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  author_type TEXT NOT NULL,
  body TEXT NOT NULL,
  screenshot_path TEXT,
  screenshot_full_path TEXT,
  crop_x NUMERIC,
  crop_y NUMERIC,
  crop_w NUMERIC,
  crop_h NUMERIC,
  screenshot_w INTEGER,
  screenshot_h INTEGER,
  change_type TEXT NOT NULL DEFAULT 'original',
  project_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_comment_versions_comment 
    FOREIGN KEY (comment_id) REFERENCES prototype_comments(id) ON DELETE CASCADE,
  CONSTRAINT uq_comment_version UNIQUE(comment_id, version_number)
);

-- Create indexes for fast lookups
CREATE INDEX idx_comment_versions_comment_id ON comment_versions(comment_id);
CREATE INDEX idx_comment_versions_project_token ON comment_versions(project_token);

-- Add tracking columns to prototype_comments
ALTER TABLE prototype_comments 
  ADD COLUMN edited_at TIMESTAMPTZ,
  ADD COLUMN version_count INTEGER DEFAULT 1,
  ADD COLUMN is_relevant BOOLEAN DEFAULT true;

-- Enable RLS on comment_versions
ALTER TABLE comment_versions ENABLE ROW LEVEL SECURITY;

-- Restrictive policy: no direct public access (service role only via edge function)
CREATE POLICY "No public access to comment_versions" ON comment_versions
  AS RESTRICTIVE FOR ALL USING (false);