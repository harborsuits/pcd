-- Make comment_id nullable in prototype_comment_media to allow pre-upload
-- (files uploaded before comment is created, then linked after)

-- First drop the existing foreign key constraint
ALTER TABLE public.prototype_comment_media 
DROP CONSTRAINT IF EXISTS prototype_comment_media_comment_id_fkey;

-- Make the column nullable
ALTER TABLE public.prototype_comment_media 
ALTER COLUMN comment_id DROP NOT NULL;

-- Re-add the foreign key constraint but allowing NULL values
ALTER TABLE public.prototype_comment_media 
ADD CONSTRAINT prototype_comment_media_comment_id_fkey 
FOREIGN KEY (comment_id) REFERENCES public.prototype_comments(id) ON DELETE CASCADE;