-- Create push_subscriptions table for web push notifications
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_token TEXT NOT NULL,
  who TEXT NOT NULL DEFAULT 'client', -- 'client' or 'admin'
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- No public access (only edge functions with service role can manage)
CREATE POLICY "No public access to push_subscriptions" 
  ON public.push_subscriptions 
  FOR ALL 
  USING (false);