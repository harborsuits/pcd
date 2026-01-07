-- Add columns for snip-first feedback (crop region storage)
ALTER TABLE public.prototype_comments
ADD COLUMN IF NOT EXISTS screenshot_full_path text,
ADD COLUMN IF NOT EXISTS crop_x numeric,
ADD COLUMN IF NOT EXISTS crop_y numeric,
ADD COLUMN IF NOT EXISTS crop_w numeric,
ADD COLUMN IF NOT EXISTS crop_h numeric;

-- Add comment to explain the columns
COMMENT ON COLUMN public.prototype_comments.screenshot_full_path IS 'Path to full captured screenshot (before cropping)';
COMMENT ON COLUMN public.prototype_comments.crop_x IS 'Crop region X position as percentage (0-1)';
COMMENT ON COLUMN public.prototype_comments.crop_y IS 'Crop region Y position as percentage (0-1)';
COMMENT ON COLUMN public.prototype_comments.crop_w IS 'Crop region width as percentage (0-1)';
COMMENT ON COLUMN public.prototype_comments.crop_h IS 'Crop region height as percentage (0-1)';