DROP POLICY IF EXISTS "Anyone can submit alacarte requests" ON public.alacarte_requests;
CREATE POLICY "Anyone can submit new alacarte requests"
ON public.alacarte_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND handled_at IS NULL
  AND handled_by IS NULL
  AND length(btrim(service_key)) BETWEEN 1 AND 100
  AND length(btrim(service_label)) BETWEEN 1 AND 200
  AND contact_method IN ('email','phone','text','sms')
  AND length(btrim(contact_value)) BETWEEN 3 AND 255
  AND (note IS NULL OR length(note) <= 2000)
  AND (website_url IS NULL OR length(website_url) <= 500)
);