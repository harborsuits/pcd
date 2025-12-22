-- Add review status columns to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS demo_review_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS demo_review_notes text,
ADD COLUMN IF NOT EXISTS demo_reviewed_at timestamptz;

-- Add index for filtering by review status
CREATE INDEX IF NOT EXISTS idx_leads_demo_review_status ON public.leads (demo_review_status);

-- Add constraint for allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_demo_review_status_check'
  ) THEN
    ALTER TABLE public.leads
    ADD CONSTRAINT leads_demo_review_status_check
    CHECK (demo_review_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;