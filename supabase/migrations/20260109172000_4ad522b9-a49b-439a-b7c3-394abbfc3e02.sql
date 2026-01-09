-- Make prototype_id nullable in prototype_comment_media to allow pre-upload
-- (files uploaded before prototype assignment)

-- First drop the existing foreign key constraint
ALTER TABLE public.prototype_comment_media 
DROP CONSTRAINT IF EXISTS prototype_comment_media_prototype_id_fkey;

-- Make the column nullable
ALTER TABLE public.prototype_comment_media 
ALTER COLUMN prototype_id DROP NOT NULL;

-- Re-add the foreign key constraint but allowing NULL values
ALTER TABLE public.prototype_comment_media 
ADD CONSTRAINT prototype_comment_media_prototype_id_fkey 
FOREIGN KEY (prototype_id) REFERENCES public.prototypes(id) ON DELETE CASCADE;