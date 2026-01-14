-- Add deposit_status column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS deposit_status text DEFAULT 'pending';

-- Add comment for clarity
COMMENT ON COLUMN public.projects.deposit_status IS 'Deposit payment status: pending, paid, skipped';