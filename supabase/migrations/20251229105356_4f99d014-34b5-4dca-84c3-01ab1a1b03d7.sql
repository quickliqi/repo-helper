-- Fix PUBLIC_DATA_EXPOSURE: Restrict profiles to owner-only access
-- Users should only be able to view their own profile
-- When "Direct wholesaler contact" feature is needed, a more targeted approach 
-- (like a view or specific columns) can be implemented

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);