-- Add screenshot support columns to prototype_comments
ALTER TABLE prototype_comments
ADD COLUMN IF NOT EXISTS screenshot_path text,
ADD COLUMN IF NOT EXISTS screenshot_w integer,
ADD COLUMN IF NOT EXISTS screenshot_h integer;