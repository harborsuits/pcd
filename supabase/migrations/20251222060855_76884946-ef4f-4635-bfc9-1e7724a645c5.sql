-- Create review_items table for work-in-progress items that clients can approve/reject
CREATE TABLE public.review_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_token TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL DEFAULT 'draft', -- draft, copy, image, link
  item_url TEXT, -- URL to preview (for drafts/links)
  item_content TEXT, -- Rich text content (for copy)
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, changes_requested
  client_notes TEXT, -- Client's feedback when requesting changes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;

-- Block all direct public access (access via service_role through edge functions)
CREATE POLICY "No public access to review_items"
ON public.review_items
FOR ALL
USING (false);

-- Enable realtime for review_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_items;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_review_items_updated_at
BEFORE UPDATE ON public.review_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();