-- Create project_events table for flow logging
CREATE TABLE public.project_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_token TEXT NOT NULL,
  event_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for fast lookups by project token
CREATE INDEX idx_project_events_token ON public.project_events(project_token);
CREATE INDEX idx_project_events_name ON public.project_events(event_name);
CREATE INDEX idx_project_events_created ON public.project_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

-- Allow service_role to insert/select (admin console only)
CREATE POLICY "Service role can manage project events"
  ON public.project_events
  FOR ALL
  USING (current_user = 'service_role')
  WITH CHECK (current_user = 'service_role');

-- Add AI trial status to projects table
ALTER TABLE public.projects 
  ADD COLUMN ai_trial_status TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.ai_trial_status IS 'AI receptionist trial status: null, accepted, declined, setup_complete';
COMMENT ON TABLE public.project_events IS 'Flow log for tracking project lifecycle events';