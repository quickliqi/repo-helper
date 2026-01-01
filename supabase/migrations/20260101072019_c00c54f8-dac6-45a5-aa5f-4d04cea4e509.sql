-- Add admin RLS policies for payment_history
CREATE POLICY "Admins can view all payments"
ON public.payment_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin RLS policies for subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin RLS policies for profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin RLS policies for listing_credits
CREATE POLICY "Admins can view all listing credits"
ON public.listing_credits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin RLS policies for scrape_credits
CREATE POLICY "Admins can view all scrape credits"
ON public.scrape_credits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin RLS policies for properties
CREATE POLICY "Admins can view all properties"
ON public.properties
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));