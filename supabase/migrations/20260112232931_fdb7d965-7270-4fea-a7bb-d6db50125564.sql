-- Add index for efficient webhook routing by Ulio shop_id
CREATE INDEX IF NOT EXISTS idx_projects_ulio_business_id 
ON projects(ulio_business_id) 
WHERE ulio_business_id IS NOT NULL;