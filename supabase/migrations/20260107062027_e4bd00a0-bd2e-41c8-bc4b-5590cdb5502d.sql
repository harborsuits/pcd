-- Create project_clients table for client portal identity
CREATE TABLE public.project_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'owner',
  invite_status TEXT NOT NULL DEFAULT 'invited',
  invite_sent_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, email)
);

-- Enable RLS
ALTER TABLE public.project_clients ENABLE ROW LEVEL SECURITY;

-- No public access - service role only
CREATE POLICY "No public access to project_clients" 
ON public.project_clients 
FOR ALL 
USING (false);

-- Add index for lookups
CREATE INDEX idx_project_clients_project_token ON public.project_clients(project_token);
CREATE INDEX idx_project_clients_email ON public.project_clients(email);

-- Add trigger for updated_at
CREATE TRIGGER update_project_clients_updated_at
BEFORE UPDATE ON public.project_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();