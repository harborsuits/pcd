-- Fix 1: Update admin_inbox_v1 function with stricter search_path
-- Set search_path = '' to prevent schema search path attacks

CREATE OR REPLACE FUNCTION public.admin_inbox_v1()
RETURNS TABLE(
  project_id uuid,
  project_token text,
  business_name text,
  status text,
  last_message_content text,
  last_message_sender_type text,
  last_message_created_at timestamptz,
  unread_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''  -- Stricter: empty search_path prevents schema attacks
AS $$
  -- Only allow service_role to call this function
  -- This prevents direct access from anon role even if RLS is misconfigured
  SELECT 
    p.id as project_id,
    p.project_token,
    p.business_name,
    p.status::text,
    lm.content as last_message_content,
    lm.sender_type as last_message_sender_type,
    lm.created_at as last_message_created_at,
    COALESCE(uc.count, 0) as unread_count
  FROM public.projects p
  LEFT JOIN LATERAL (
    SELECT m.content, m.sender_type, m.created_at
    FROM public.messages m
    WHERE m.project_id = p.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM public.messages m
    WHERE m.project_id = p.id
      AND m.sender_type = 'client' 
      AND m.read_at IS NULL
  ) uc ON true
  WHERE p.deleted_at IS NULL
    AND current_user = 'service_role'  -- Only service_role can execute
  ORDER BY lm.created_at DESC NULLS LAST;
$$;

-- Add comment explaining security model
COMMENT ON FUNCTION public.admin_inbox_v1() IS 
'Admin inbox function with SECURITY DEFINER. Protected by:
1. current_user = service_role check in query
2. Empty search_path to prevent schema attacks
3. Only callable via edge functions using service_role key
4. All table references fully qualified with public schema';

-- Fix 2: Restrict storage policies for project-media bucket
-- Remove overly permissive policy granting ALL to authenticated users
DROP POLICY IF EXISTS "Admin full access to project-media" ON storage.objects;

-- Create more restrictive policies:
-- Only allow service_role access (via edge functions) for ALL operations
-- This ensures all file access goes through edge functions which validate project_token

CREATE POLICY "Service role full access to project-media"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'project-media')
WITH CHECK (bucket_id = 'project-media');

-- Similarly fix project-files bucket if it has the same issue
DROP POLICY IF EXISTS "Admin full access to project-files" ON storage.objects;

CREATE POLICY "Service role full access to project-files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'project-files')
WITH CHECK (bucket_id = 'project-files');