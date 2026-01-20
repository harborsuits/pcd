-- Add admin SELECT policy for client_leads table
-- This ensures admins can view all leads while regular users can only see their claimed leads

CREATE POLICY "Admins can view all leads"
ON public.client_leads
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));