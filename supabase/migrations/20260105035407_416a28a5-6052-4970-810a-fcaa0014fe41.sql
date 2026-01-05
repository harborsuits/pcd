-- Clear all poisoned anchor_selector values (ephemeral data-pcd-anchor selectors)
UPDATE prototype_comments 
SET anchor_selector = NULL 
WHERE anchor_selector LIKE '%data-pcd-anchor%';

-- Add constraint to prevent future poison (block any ephemeral selectors from being stored)
ALTER TABLE prototype_comments
ADD CONSTRAINT prototype_comments_no_ephemeral_anchor_selector
CHECK (anchor_selector IS NULL OR anchor_selector NOT LIKE '%data-pcd-anchor%');