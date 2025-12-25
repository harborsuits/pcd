-- Add final_approved_at column to projects for client final approval
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS final_approved_at timestamp with time zone DEFAULT NULL;

-- Create notification_events table for email notifications
CREATE TABLE public.notification_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    project_token text NOT NULL,
    event_type text NOT NULL, -- 'intake_submitted', 'intake_approved', 'prototype_added', 'final_approved', 'launch_complete'
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    sent_at timestamp with time zone DEFAULT NULL, -- NULL = not sent yet
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notification_events
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- RLS policy: no public access (service role only)
CREATE POLICY "No public access to notification_events" 
ON public.notification_events 
FOR ALL 
USING (false);

-- Index for querying unsent notifications
CREATE INDEX idx_notification_events_unsent ON public.notification_events(sent_at) WHERE sent_at IS NULL;