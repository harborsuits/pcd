-- Add text-range anchoring columns for precise word-level comment pins
ALTER TABLE public.prototype_comments
  ADD COLUMN IF NOT EXISTS text_offset integer,
  ADD COLUMN IF NOT EXISTS text_context text;