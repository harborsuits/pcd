-- Add CHECK constraints for input validation on alacarte_requests table
-- This addresses the INPUT_VALIDATION security finding

-- Add length constraints to prevent excessively long inputs
ALTER TABLE public.alacarte_requests
  ADD CONSTRAINT alacarte_service_key_length CHECK (char_length(service_key) <= 200),
  ADD CONSTRAINT alacarte_service_label_length CHECK (char_length(service_label) <= 200),
  ADD CONSTRAINT alacarte_website_url_length CHECK (website_url IS NULL OR char_length(website_url) <= 500),
  ADD CONSTRAINT alacarte_contact_method_length CHECK (contact_method IS NULL OR char_length(contact_method) <= 50),
  ADD CONSTRAINT alacarte_contact_value_length CHECK (contact_value IS NULL OR char_length(contact_value) <= 255),
  ADD CONSTRAINT alacarte_note_length CHECK (note IS NULL OR char_length(note) <= 2000);

-- Add non-empty check for required fields
ALTER TABLE public.alacarte_requests
  ADD CONSTRAINT alacarte_service_key_not_empty CHECK (char_length(trim(service_key)) > 0),
  ADD CONSTRAINT alacarte_service_label_not_empty CHECK (char_length(trim(service_label)) > 0);