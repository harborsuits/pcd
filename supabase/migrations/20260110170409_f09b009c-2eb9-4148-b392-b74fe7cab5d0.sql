-- Pre-requisites: Database Correctness Fixes for Communication System

-- 1. Enable full row data for UPDATE/DELETE realtime payloads
ALTER TABLE public.prototype_comments REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Add thread_root_id and last_activity_at columns
ALTER TABLE public.prototype_comments
  ADD COLUMN IF NOT EXISTS thread_root_id uuid,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- 3. Indexes for fast thread queries
CREATE INDEX IF NOT EXISTS idx_comments_thread_root 
  ON public.prototype_comments(thread_root_id);
CREATE INDEX IF NOT EXISTS idx_comments_last_activity 
  ON public.prototype_comments(last_activity_at DESC);

-- 4. Backfill existing comments (single-level replies)
UPDATE public.prototype_comments c
SET 
  thread_root_id = COALESCE(c.parent_comment_id, c.id),
  last_activity_at = COALESCE(c.last_activity_at, c.created_at)
WHERE c.thread_root_id IS NULL;

-- 5. Trigger: auto-set thread_root_id and update activity on insert
CREATE OR REPLACE FUNCTION public.set_thread_root_and_activity()
RETURNS TRIGGER AS $$
DECLARE parent_root uuid;
BEGIN
  IF NEW.parent_comment_id IS NULL THEN
    NEW.thread_root_id = NEW.id;
  ELSE
    SELECT thread_root_id INTO parent_root
    FROM public.prototype_comments
    WHERE id = NEW.parent_comment_id;

    NEW.thread_root_id = COALESCE(parent_root, NEW.parent_comment_id);
  END IF;

  NEW.last_activity_at = NEW.created_at;

  -- Also bump the root comment's last_activity_at
  UPDATE public.prototype_comments
  SET last_activity_at = NEW.created_at
  WHERE id = NEW.thread_root_id AND id != NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_thread_root_and_activity ON public.prototype_comments;
CREATE TRIGGER trg_set_thread_root_and_activity
  BEFORE INSERT ON public.prototype_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_thread_root_and_activity();

-- 6. Add is_locked field for explicit thread locking
ALTER TABLE public.prototype_comments
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

-- 7. Thread read tracking table
CREATE TABLE IF NOT EXISTS public.thread_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_token text,
  thread_root_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT thread_reads_identity_check CHECK (
    user_id IS NOT NULL OR project_token IS NOT NULL
  )
);

-- Unique constraints for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS uniq_thread_reads_user
  ON public.thread_reads(user_id, thread_root_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_thread_reads_token
  ON public.thread_reads(project_token, thread_root_id)
  WHERE project_token IS NOT NULL;

-- Enable RLS on thread_reads
ALTER TABLE public.thread_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for thread_reads
CREATE POLICY "Admins manage all thread_reads"
  ON public.thread_reads FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users manage own thread_reads"
  ON public.thread_reads FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable realtime on thread_reads
ALTER TABLE public.thread_reads REPLICA IDENTITY FULL;