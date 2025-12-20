-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Only service role can access (edge function uses service role)
-- No public policies needed since all access goes through our media proxy edge function