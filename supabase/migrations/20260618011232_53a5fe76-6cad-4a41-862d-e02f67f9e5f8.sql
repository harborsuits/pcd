
-- admin_audit_log: add explicit admin INSERT policy (service_role already bypasses RLS)
DROP POLICY IF EXISTS "Admins can insert audit log entries" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit log entries"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- project_events: add explicit admin SELECT policy (service_role already bypasses RLS)
DROP POLICY IF EXISTS "Admins can read project events" ON public.project_events;
CREATE POLICY "Admins can read project events"
ON public.project_events
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
