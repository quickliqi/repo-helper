
-- Create a function to create initial subscription for investors
CREATE OR REPLACE FUNCTION public.create_initial_investor_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = NEW.user_id LIMIT 1;
  
  -- Only create trial for investors
  IF user_role = 'investor' THEN
    INSERT INTO public.subscriptions (
      user_id, 
      status, 
      plan_type, 
      trial_ends_at, 
      current_period_start, 
      current_period_end
    )
    VALUES (
      NEW.user_id, 
      'trialing', 
      'investor_pro', 
      NOW() + INTERVAL '7 days',
      NOW(),
      NOW() + INTERVAL '7 days'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles table (fires after role is created)
DROP TRIGGER IF EXISTS create_investor_trial_on_role ON public.user_roles;
CREATE TRIGGER create_investor_trial_on_role
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  WHEN (NEW.role = 'investor')
  EXECUTE FUNCTION public.create_initial_investor_trial();

-- Add unique constraint on user_id in subscriptions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_key'
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;
