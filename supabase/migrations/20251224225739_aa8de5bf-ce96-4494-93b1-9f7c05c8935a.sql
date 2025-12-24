-- Add delivered_at column to messages table for delivery tracking
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Add comment for clarity
COMMENT ON COLUMN public.messages.delivered_at IS 'Timestamp when the message was delivered to the recipient (shown in their UI)';