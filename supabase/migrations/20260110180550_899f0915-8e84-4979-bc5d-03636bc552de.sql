-- Add client confirmation tracking fields
ALTER TABLE public.prototype_comments
  ADD COLUMN IF NOT EXISTS client_confirmed_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS client_confirmed_by text DEFAULT NULL;