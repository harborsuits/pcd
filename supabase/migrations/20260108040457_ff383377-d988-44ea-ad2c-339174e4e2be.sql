-- Create table for à la carte service requests
CREATE TABLE public.alacarte_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Service requested
  service_key TEXT NOT NULL,
  service_label TEXT NOT NULL,
  
  -- Basic info
  has_website BOOLEAN,
  website_url TEXT,
  is_existing_client BOOLEAN,
  contact_method TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  note TEXT,
  
  -- Status for operator routing
  status TEXT NOT NULL DEFAULT 'new',
  handled_at TIMESTAMP WITH TIME ZONE,
  handled_by TEXT
);

-- Enable RLS
ALTER TABLE public.alacarte_requests ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anonymous requests)
CREATE POLICY "Anyone can submit alacarte requests"
ON public.alacarte_requests
FOR INSERT
WITH CHECK (true);

-- Only operators can view/update
CREATE POLICY "Admins can view alacarte requests"
ON public.alacarte_requests
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update alacarte requests"
ON public.alacarte_requests
FOR UPDATE
USING (is_admin(auth.uid()));