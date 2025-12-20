-- Create RPC for admin inbox with SQL aggregation (much faster than fetching all messages)
CREATE OR REPLACE FUNCTION public.admin_inbox_v1()
RETURNS TABLE (
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
SET search_path = public
AS $$
  WITH latest_messages AS (
    SELECT DISTINCT ON (m.project_id)
      m.project_id,
      m.content,
      m.sender_type,
      m.created_at
    FROM messages m
    INNER JOIN projects p ON p.id = m.project_id AND p.deleted_at IS NULL
    ORDER BY m.project_id, m.created_at DESC
  ),
  unread_counts AS (
    SELECT 
      m.project_id,
      COUNT(*) as count
    FROM messages m
    INNER JOIN projects p ON p.id = m.project_id AND p.deleted_at IS NULL
    WHERE m.sender_type = 'client' AND m.read_at IS NULL
    GROUP BY m.project_id
  )
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
  LEFT JOIN latest_messages lm ON lm.project_id = p.id
  LEFT JOIN unread_counts uc ON uc.project_id = p.id
  WHERE p.deleted_at IS NULL
  ORDER BY lm.created_at DESC NULLS LAST;
$$;