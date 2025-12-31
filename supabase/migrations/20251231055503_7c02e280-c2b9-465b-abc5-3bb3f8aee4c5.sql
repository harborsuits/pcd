-- Add anchor + page context fields to prototype_comments
ALTER TABLE public.prototype_comments
  ADD COLUMN IF NOT EXISTS page_url text,
  ADD COLUMN IF NOT EXISTS page_path text,
  ADD COLUMN IF NOT EXISTS scroll_y integer,
  ADD COLUMN IF NOT EXISTS viewport_w integer,
  ADD COLUMN IF NOT EXISTS viewport_h integer,
  ADD COLUMN IF NOT EXISTS breakpoint text,
  ADD COLUMN IF NOT EXISTS anchor_id text,
  ADD COLUMN IF NOT EXISTS anchor_selector text,
  ADD COLUMN IF NOT EXISTS x_pct numeric,
  ADD COLUMN IF NOT EXISTS y_pct numeric,
  ADD COLUMN IF NOT EXISTS text_hint text;

-- Add index for efficient page-based filtering
CREATE INDEX IF NOT EXISTS idx_prototype_comments_page_path ON public.prototype_comments(page_path);

-- Comment on columns for documentation
COMMENT ON COLUMN public.prototype_comments.page_url IS 'Full URL of the iframe at comment creation time';
COMMENT ON COLUMN public.prototype_comments.page_path IS 'Pathname portion (e.g., /pricing) for same-origin prototypes';
COMMENT ON COLUMN public.prototype_comments.scroll_y IS 'Scroll position inside iframe when comment was created';
COMMENT ON COLUMN public.prototype_comments.viewport_w IS 'Viewport width at comment creation';
COMMENT ON COLUMN public.prototype_comments.viewport_h IS 'Viewport height at comment creation';
COMMENT ON COLUMN public.prototype_comments.breakpoint IS 'Responsive breakpoint label (sm/md/lg/xl)';
COMMENT ON COLUMN public.prototype_comments.anchor_id IS 'data-comment-anchor or element id for stable positioning';
COMMENT ON COLUMN public.prototype_comments.anchor_selector IS 'CSS selector fallback for finding anchor element';
COMMENT ON COLUMN public.prototype_comments.x_pct IS 'X position as % within the anchor element bounding box';
COMMENT ON COLUMN public.prototype_comments.y_pct IS 'Y position as % within the anchor element bounding box';
COMMENT ON COLUMN public.prototype_comments.text_hint IS 'Nearby text content for context/verification';