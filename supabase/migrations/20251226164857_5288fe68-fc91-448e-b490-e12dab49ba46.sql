-- Move pg_trgm extension from public to extensions schema if it exists
DO $$
BEGIN
  -- Check if pg_trgm is installed in public schema
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_trgm' 
    AND extnamespace = 'public'::regnamespace
  ) THEN
    -- Drop and recreate in extensions schema
    DROP EXTENSION IF EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
  END IF;
  
  -- Move any other extensions that might be in public to extensions
  -- (common ones that could be there)
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'uuid-ossp' 
    AND extnamespace = 'public'::regnamespace
  ) THEN
    DROP EXTENSION IF EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
  END IF;
END
$$;