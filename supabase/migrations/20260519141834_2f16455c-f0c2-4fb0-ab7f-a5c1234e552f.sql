UPDATE public.notification_events
SET sent_at = now()
WHERE sent_at IS NULL
  AND project_id IN (
    SELECT id FROM public.projects
    WHERE contact_email IS NOT NULL
      AND contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
  );