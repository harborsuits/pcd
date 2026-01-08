-- =============================================================
-- BILLING ARCHITECTURE: Accounts + Line Items
-- =============================================================

-- 1. Client Accounts (one per email, holds Stripe Customer ID)
-- =============================================================
CREATE TABLE public.client_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for lookups
CREATE INDEX idx_client_accounts_email ON public.client_accounts(email);
CREATE INDEX idx_client_accounts_stripe_customer ON public.client_accounts(stripe_customer_id);

-- RLS
ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to client_accounts" 
  ON public.client_accounts 
  FOR ALL 
  USING (false);

-- Updated at trigger
CREATE TRIGGER update_client_accounts_updated_at
  BEFORE UPDATE ON public.client_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 2. Project Line Items (billing evidence layer)
-- =============================================================
CREATE TABLE public.project_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  
  -- What was offered
  type TEXT NOT NULL DEFAULT 'setup', -- setup | subscription | addon | credit | refund
  label TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL,
  billing_mode TEXT NOT NULL DEFAULT 'one_time', -- one_time | recurring
  billing_interval TEXT, -- month | year (for recurring)
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Stripe linkage
  stripe_price_id TEXT,
  stripe_invoice_id TEXT,
  stripe_invoice_item_id TEXT,
  stripe_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'proposed', -- proposed | accepted | invoiced | paid | cancelled | refunded
  
  -- Audit trail
  created_by TEXT, -- operator email or 'system'
  accepted_at TIMESTAMP WITH TIME ZONE,
  invoiced_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_project_line_items_project ON public.project_line_items(project_id);
CREATE INDEX idx_project_line_items_token ON public.project_line_items(project_token);
CREATE INDEX idx_project_line_items_status ON public.project_line_items(status);
CREATE INDEX idx_project_line_items_stripe_invoice ON public.project_line_items(stripe_invoice_id);

-- RLS
ALTER TABLE public.project_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to project_line_items" 
  ON public.project_line_items 
  FOR ALL 
  USING (false);

-- Updated at trigger
CREATE TRIGGER update_project_line_items_updated_at
  BEFORE UPDATE ON public.project_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 3. Link projects to client accounts
-- =============================================================
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS client_account_id UUID REFERENCES public.client_accounts(id) ON DELETE SET NULL;

CREATE INDEX idx_projects_client_account ON public.projects(client_account_id);