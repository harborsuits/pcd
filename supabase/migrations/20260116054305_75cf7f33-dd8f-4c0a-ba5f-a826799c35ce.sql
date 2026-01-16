-- Add selected_tier column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS selected_tier text;

-- Add deposit_amount_cents for custom deposit amounts
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS deposit_amount_cents integer;

-- Add comment for clarity
COMMENT ON COLUMN public.projects.selected_tier IS 'The pricing tier selected during intake (starter, growth, full_ops, etc.)';
COMMENT ON COLUMN public.projects.deposit_amount_cents IS 'Custom deposit amount in cents, overrides tier-based calculation';