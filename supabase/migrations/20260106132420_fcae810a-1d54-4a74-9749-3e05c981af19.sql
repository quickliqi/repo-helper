-- Create email_leads table for capturing leads
CREATE TABLE public.email_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('investor', 'wholesaler', 'general')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  landing_page TEXT,
  converted_to_user BOOLEAN DEFAULT false,
  converted_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique constraint on email
CREATE UNIQUE INDEX email_leads_email_unique ON public.email_leads (email);

-- Enable RLS
ALTER TABLE public.email_leads ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (lead capture)
CREATE POLICY "Anyone can submit lead" 
ON public.email_leads 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view leads
CREATE POLICY "Admins can view all leads" 
ON public.email_leads 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Update timestamp trigger
CREATE TRIGGER update_email_leads_updated_at
BEFORE UPDATE ON public.email_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();