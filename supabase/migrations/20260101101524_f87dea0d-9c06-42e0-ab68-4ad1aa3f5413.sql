-- 1. Drop existing verification-required RLS policies
DROP POLICY IF EXISTS "Verified wholesalers can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Verified users can create contact requests" ON public.contact_requests;

-- 2. Create new policies without verification requirement
CREATE POLICY "Wholesalers can insert properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'wholesaler'::app_role)
);

CREATE POLICY "Authenticated users can create contact requests" 
ON public.contact_requests 
FOR INSERT 
WITH CHECK (auth.uid() = investor_id);

-- 3. Add RLS policy to allow public viewing of properties for demo purposes
-- (this already exists as "Anyone can view active properties")

-- 4. Insert mock properties with null user_id (will need to update RLS or use service role)
-- First, let's check if there's a way to add demo properties
-- We'll create a "demo" flag or use a placeholder approach

-- Add a demo_listing column to identify mock data
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Update the SELECT policy to include demo listings
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
CREATE POLICY "Anyone can view active or demo properties" 
ON public.properties 
FOR SELECT 
USING ((status = 'active'::property_status) OR (auth.uid() = user_id) OR (is_demo = true));