-- Drop and recreate admin_inbox_v1 with role check
CREATE OR REPLACE FUNCTION public.admin_inbox_v1()
RETURNS TABLE(
  project_id uuid,
  project_token text,
  business_name text,
  status text,
  last_message_content text,
  last_message_sender_type text,
  last_message_created_at timestamp with time zone,
  unread_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
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
  FROM projects p
  LEFT JOIN LATERAL (
    SELECT m.content, m.sender_type, m.created_at
    FROM messages m
    WHERE m.project_id = p.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM messages m
    WHERE m.project_id = p.id
      AND m.sender_type = 'client' 
      AND m.read_at IS NULL
  ) uc ON true
  WHERE p.deleted_at IS NULL
    AND current_user = 'service_role'  -- Only service_role can execute
  ORDER BY lm.created_at DESC NULLS LAST;
$$;