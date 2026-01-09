-- Fix messaging RLS: Replace blocking policy with proper access control

-- Step 1: Drop the blocking policy
DROP POLICY IF EXISTS "No public access to messages" ON messages;

-- Step 2: Create policy for project owners to read their messages
CREATE POLICY "Project owners can read their messages"
ON messages
FOR SELECT
USING (
  project_token IN (
    SELECT project_token FROM projects 
    WHERE owner_user_id = auth.uid()
    AND deleted_at IS NULL
  )
);

-- Step 3: Create policy for admins to read all messages
CREATE POLICY "Admins can read all messages"
ON messages
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Step 4: Allow project owners to insert their own messages
CREATE POLICY "Project owners can send messages"
ON messages
FOR INSERT
WITH CHECK (
  sender_type = 'client'
  AND project_token IN (
    SELECT project_token FROM projects 
    WHERE owner_user_id = auth.uid()
    AND deleted_at IS NULL
  )
);

-- Step 5: Allow admins to insert messages (as operator)
CREATE POLICY "Admins can send messages"
ON messages
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);