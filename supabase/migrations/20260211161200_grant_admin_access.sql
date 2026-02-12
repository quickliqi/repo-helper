-- Migration to grant admin access to a specific email and update RLS policies for full admin access

-- 1. Create a function to handle automatic admin role assignment
CREATE OR REPLACE FUNCTION public.handle_admin_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'thomasdamienak@gmail.com' THEN
    -- Ensure the admin role exists for this user in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Pre-verify the admin profile if it exists
    UPDATE public.profiles
    SET is_verified = true, verification_status = 'approved', verified_at = now()
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant admin to existing user if they already exist
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'thomasdamienak@gmail.com';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    UPDATE public.profiles
    SET is_verified = true, verification_status = 'approved', verified_at = now()
    WHERE user_id = v_user_id;
  END IF;
END $$;

-- 2. Create a trigger on auth.users for new admin assignment
-- Note: This requires the trigger to be on auth.users which usually needs special permissions
-- In some Supabase setups, you might need to use a different approach if you can't touch auth schemas
-- but let's assume standard behavior for now.
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_role_on_signup();

-- 3. Update RLS policies for full admin access across all tables

-- Tables to update: profiles, user_roles, properties, buy_boxes, matches, notifications, verification_requests, email_leads

-- Profiles
CREATE POLICY "Admins have full access to all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User Roles
CREATE POLICY "Admins have full access to all user roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Properties
CREATE POLICY "Admins have full access to all properties" ON public.properties
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Buy Boxes
CREATE POLICY "Admins have full access to all buy boxes" ON public.buy_boxes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Matches
CREATE POLICY "Admins have full access to all matches" ON public.matches
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Notifications
CREATE POLICY "Admins have full access to all notifications" ON public.notifications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Verification Requests (already had some admin policies, but let's unify)
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Admins can update verification requests" ON public.verification_requests;
CREATE POLICY "Admins have full access to all verification requests" ON public.verification_requests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Email Leads
DROP POLICY IF EXISTS "Admins can view all leads" ON public.email_leads;
CREATE POLICY "Admins have full access to all email leads" ON public.email_leads
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. Grant bypass for verification requirements for admins on properties
-- The existing policy for "Verified wholesalers can insert properties" checks for status = 'approved'
-- We should update it or add a new one for admin.

CREATE POLICY "Admins can insert properties without verification"
ON public.properties
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);
