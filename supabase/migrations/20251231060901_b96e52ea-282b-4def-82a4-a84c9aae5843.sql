-- Add threading and privacy fields to prototype_comments
ALTER TABLE public.prototype_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.prototype_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

-- Index for faster thread queries
CREATE INDEX IF NOT EXISTS idx_prototype_comments_parent ON public.prototype_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Index for filtering internal comments
CREATE INDEX IF NOT EXISTS idx_prototype_comments_internal ON public.prototype_comments(is_internal) WHERE is_internal = true;