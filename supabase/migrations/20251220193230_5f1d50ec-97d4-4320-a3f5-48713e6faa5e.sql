-- Lead Engine Tables

-- 1. leads table - stores business leads from Google Places
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'google_places',
  place_id text UNIQUE NOT NULL,
  query_term text,
  location_text text,
  radius_m int,
  business_name text NOT NULL,
  phone text,
  website text,
  address text,
  category text,
  lat double precision,
  lng double precision,
  lead_score int DEFAULT 0,
  lead_reasons jsonb DEFAULT '[]'::jsonb,
  demo_project_id uuid,
  demo_token text,
  demo_url text,
  demo_status text DEFAULT 'none',
  outreach_status text DEFAULT 'new'
);

-- Indexes for leads
CREATE INDEX idx_leads_outreach_status ON public.leads(outreach_status);
CREATE INDEX idx_leads_score_desc ON public.leads(lead_score DESC);
CREATE INDEX idx_leads_place_id ON public.leads(place_id);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS: No public access (admin-only via service role)
CREATE POLICY "No public access to leads"
ON public.leads
FOR ALL
USING (false);

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. lead_search_runs table - logs each search run
CREATE TABLE public.lead_search_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  query_term text NOT NULL,
  location_text text NOT NULL,
  radius_m int NOT NULL,
  results_count int DEFAULT 0,
  provider text DEFAULT 'google_places',
  raw_meta jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.lead_search_runs ENABLE ROW LEVEL SECURITY;

-- RLS: No public access
CREATE POLICY "No public access to lead_search_runs"
ON public.lead_search_runs
FOR ALL
USING (false);

-- 3. outreach_events table - logs outreach attempts
CREATE TABLE public.lead_outreach_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'queued',
  provider_message_id text,
  error text
);

-- Index for lead lookups
CREATE INDEX idx_lead_outreach_events_lead_id ON public.lead_outreach_events(lead_id);

-- Enable RLS
ALTER TABLE public.lead_outreach_events ENABLE ROW LEVEL SECURITY;

-- RLS: No public access
CREATE POLICY "No public access to lead_outreach_events"
ON public.lead_outreach_events
FOR ALL
USING (false);

-- 4. outreach_suppressions table - opt-outs and do-not-contact
CREATE TABLE public.outreach_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  phone text UNIQUE NOT NULL,
  reason text DEFAULT 'opted_out'
);

-- Enable RLS
ALTER TABLE public.outreach_suppressions ENABLE ROW LEVEL SECURITY;

-- RLS: No public access
CREATE POLICY "No public access to outreach_suppressions"
ON public.outreach_suppressions
FOR ALL
USING (false);