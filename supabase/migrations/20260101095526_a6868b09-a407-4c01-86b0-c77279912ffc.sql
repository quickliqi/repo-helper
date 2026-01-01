-- Create contact_requests table to track contact exchanges
CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  message TEXT,
  investor_email TEXT NOT NULL,
  investor_name TEXT NOT NULL,
  investor_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Investors can view their own contact requests
CREATE POLICY "Investors can view own contact requests"
ON public.contact_requests
FOR SELECT
USING (auth.uid() = investor_id);

-- Sellers can view contact requests for their properties
CREATE POLICY "Sellers can view contact requests for their properties"
ON public.contact_requests
FOR SELECT
USING (auth.uid() = seller_id);

-- Verified users can create contact requests
CREATE POLICY "Verified users can create contact requests"
ON public.contact_requests
FOR INSERT
WITH CHECK (
  auth.uid() = investor_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.verification_status = 'approved'
  )
);

-- Create index for faster lookups
CREATE INDEX idx_contact_requests_property ON public.contact_requests(property_id);
CREATE INDEX idx_contact_requests_investor ON public.contact_requests(investor_id);
CREATE INDEX idx_contact_requests_seller ON public.contact_requests(seller_id);