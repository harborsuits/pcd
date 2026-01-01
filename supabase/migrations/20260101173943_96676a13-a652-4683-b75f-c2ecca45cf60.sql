-- Add status enum and resolution fields to prototype_comments
-- Status workflow: open → in_progress → resolved / wont_do

-- Add status column with default 'open'
ALTER TABLE public.prototype_comments 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';

-- Add resolution note for audit trail
ALTER TABLE public.prototype_comments 
ADD COLUMN IF NOT EXISTS resolution_note text;

-- Add resolved_by to track who resolved it
ALTER TABLE public.prototype_comments 
ADD COLUMN IF NOT EXISTS resolved_by text;

-- Add constraint to ensure valid status values
ALTER TABLE public.prototype_comments 
ADD CONSTRAINT prototype_comments_status_check 
CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_do'));

-- Update existing resolved comments to have 'resolved' status
UPDATE public.prototype_comments 
SET status = 'resolved' 
WHERE resolved_at IS NOT NULL AND status = 'open';

-- Create index for filtering by status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_prototype_comments_status 
ON public.prototype_comments(status);