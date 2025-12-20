-- Create enum for project status
CREATE TYPE project_status AS ENUM ('lead', 'contacted', 'interested', 'client', 'completed', 'archived');

-- Create projects table (core identity table)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_token TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  business_slug TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  website TEXT,
  status project_status NOT NULL DEFAULT 'lead',
  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create demos table
CREATE TABLE public.demos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'default',
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin', 'system')),
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create files table
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  stripe_event_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'subscription', 'one_time')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create outreach_events table
CREATE TABLE public.outreach_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'stop', 'unsubscribe')),
  recipient TEXT NOT NULL,
  template_used TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for token-based queries
CREATE INDEX idx_projects_token ON public.projects(project_token);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_source ON public.projects(source);
CREATE INDEX idx_projects_deleted_at ON public.projects(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_demos_project_token ON public.demos(project_token);
CREATE INDEX idx_demos_project_id ON public.demos(project_id);

CREATE INDEX idx_messages_project_token ON public.messages(project_token);
CREATE INDEX idx_messages_project_id ON public.messages(project_id);
CREATE INDEX idx_messages_unread ON public.messages(project_id) WHERE read_at IS NULL;

CREATE INDEX idx_files_project_token ON public.files(project_token);
CREATE INDEX idx_files_project_id ON public.files(project_id);

CREATE INDEX idx_payments_project_token ON public.payments(project_token);
CREATE INDEX idx_payments_project_id ON public.payments(project_id);
CREATE INDEX idx_payments_stripe_session ON public.payments(stripe_checkout_session_id);

CREATE INDEX idx_outreach_project_token ON public.outreach_events(project_token);
CREATE INDEX idx_outreach_project_id ON public.outreach_events(project_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_demos_updated_at
  BEFORE UPDATE ON public.demos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables (policies will be permissive for token-based access)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for public token-based read access (no auth required)
-- These allow reading by project_token for public demo/portal pages

CREATE POLICY "Public read by token" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Public read by token" ON public.demos
  FOR SELECT USING (true);

CREATE POLICY "Public read by token" ON public.messages
  FOR SELECT USING (true);

CREATE POLICY "Public read by token" ON public.files
  FOR SELECT USING (true);

CREATE POLICY "Public read by token" ON public.payments
  FOR SELECT USING (true);

CREATE POLICY "Public read by token" ON public.outreach_events
  FOR SELECT USING (true);

-- Insert/Update/Delete will be handled via edge functions with service role
-- No client-side mutations allowed directly