-- Add phone_raw and phone_e164 columns to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS phone_raw text,
ADD COLUMN IF NOT EXISTS phone_e164 text;