-- Add owner_user_id to projects table for client authentication
ALTER TABLE public.projects
ADD COLUMN owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_projects_owner_user_id ON public.projects(owner_user_id);

-- Comment for clarity
COMMENT ON COLUMN public.projects.owner_user_id IS 'The authenticated user ID who claimed/owns this project portal';