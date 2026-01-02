-- Add archived_at column to prototype_comments
ALTER TABLE public.prototype_comments 
ADD COLUMN archived_at timestamp with time zone DEFAULT NULL;

-- Add index for filtering archived comments
CREATE INDEX idx_prototype_comments_archived ON public.prototype_comments(archived_at) WHERE archived_at IS NULL;