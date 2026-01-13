-- Drop existing non-unique index if exists
DROP INDEX IF EXISTS idx_projects_ulio_business_id;

-- Create unique partial index to prevent duplicate Ulio business IDs
-- Only one active project can have a given ulio_business_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_ulio_business_id_unique 
  ON projects(ulio_business_id) 
  WHERE ulio_business_id IS NOT NULL AND deleted_at IS NULL;