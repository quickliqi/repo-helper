-- Fix RLS policies for all tables with missing explicit policies
-- All sensitive tables should only allow service role to modify data

-- ============================================================
-- SUBSCRIPTIONS TABLE - Add explicit deny policies
-- ============================================================
CREATE POLICY "Only service role can insert subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only service role can update subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (false);

CREATE POLICY "Only service role can delete subscriptions" 
ON public.subscriptions 
FOR DELETE 
USING (false);

-- ============================================================
-- LISTING_CREDITS TABLE - Add explicit deny policies
-- ============================================================
CREATE POLICY "Only service role can insert listing credits" 
ON public.listing_credits 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only service role can update listing credits" 
ON public.listing_credits 
FOR UPDATE 
USING (false);

CREATE POLICY "Only service role can delete listing credits" 
ON public.listing_credits 
FOR DELETE 
USING (false);

-- ============================================================
-- SCRAPE_CREDITS TABLE - Add explicit deny policies
-- ============================================================
CREATE POLICY "Only service role can insert scrape credits" 
ON public.scrape_credits 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only service role can update scrape credits" 
ON public.scrape_credits 
FOR UPDATE 
USING (false);

CREATE POLICY "Only service role can delete scrape credits" 
ON public.scrape_credits 
FOR DELETE 
USING (false);

-- ============================================================
-- SCRAPE_SESSIONS TABLE - Add explicit deny policies
-- ============================================================
CREATE POLICY "Only service role can insert scrape sessions" 
ON public.scrape_sessions 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only service role can update scrape sessions" 
ON public.scrape_sessions 
FOR UPDATE 
USING (false);

CREATE POLICY "Only service role can delete scrape sessions" 
ON public.scrape_sessions 
FOR DELETE 
USING (false);

-- ============================================================
-- SCRAPE_RESULTS TABLE - Add explicit INSERT/DELETE deny policies
-- ============================================================
CREATE POLICY "Only service role can insert scrape results" 
ON public.scrape_results 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only service role can delete scrape results" 
ON public.scrape_results 
FOR DELETE 
USING (false);

-- ============================================================
-- MATCHES TABLE - Add explicit INSERT/DELETE deny policies
-- ============================================================
CREATE POLICY "Only service role can insert matches" 
ON public.matches 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only service role can delete matches" 
ON public.matches 
FOR DELETE 
USING (false);

-- ============================================================
-- NOTIFICATIONS TABLE - Add explicit INSERT/DELETE deny policies
-- ============================================================
CREATE POLICY "Only service role can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only service role can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (false);

-- ============================================================
-- CONTACT_REQUESTS TABLE - Add explicit UPDATE/DELETE deny policies
-- ============================================================
CREATE POLICY "Only service role can update contact requests" 
ON public.contact_requests 
FOR UPDATE 
USING (false);

CREATE POLICY "Only service role can delete contact requests" 
ON public.contact_requests 
FOR DELETE 
USING (false);

-- ============================================================
-- PROPERTY_MATCH_THROTTLE TABLE - Replace permissive policy with restrictive one
-- ============================================================
DROP POLICY IF EXISTS "System can manage throttle records" ON public.property_match_throttle;

-- Only allow service role to manage throttle (service role bypasses RLS)
CREATE POLICY "Only service role can select throttle records" 
ON public.property_match_throttle 
FOR SELECT 
USING (false);

CREATE POLICY "Only service role can insert throttle records" 
ON public.property_match_throttle 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only service role can update throttle records" 
ON public.property_match_throttle 
FOR UPDATE 
USING (false);

CREATE POLICY "Only service role can delete throttle records" 
ON public.property_match_throttle 
FOR DELETE 
USING (false);