-- Add screenshot_media_id to prototype_comments 
-- This references the screenshot in prototype_comment_media instead of using screenshot_path directly
ALTER TABLE public.prototype_comments 
ADD COLUMN IF NOT EXISTS screenshot_media_id uuid REFERENCES public.prototype_comment_media(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_prototype_comments_screenshot_media_id 
ON public.prototype_comments(screenshot_media_id) WHERE screenshot_media_id IS NOT NULL;

-- Comment on the new column
COMMENT ON COLUMN public.prototype_comments.screenshot_media_id IS 'References the screenshot in prototype_comment_media for pin feedback';