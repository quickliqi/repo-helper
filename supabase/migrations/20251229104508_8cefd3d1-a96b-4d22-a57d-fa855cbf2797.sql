-- Fix PUBLIC_DATA_EXPOSURE: Restrict profiles to authenticated users only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Fix DEFINER_OR_RPC_BYPASS: Remove dangerous "System can manage" policies
-- Edge functions use service role which bypasses RLS anyway, so these are unnecessary and dangerous

DROP POLICY IF EXISTS "System can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "System can manage credits" ON public.listing_credits;
DROP POLICY IF EXISTS "System can create matches" ON public.matches;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create payments" ON public.payment_history;