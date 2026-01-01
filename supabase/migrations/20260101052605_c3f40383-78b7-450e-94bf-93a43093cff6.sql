-- Create a function to give new users 1 free listing credit
CREATE OR REPLACE FUNCTION public.create_initial_listing_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert 1 free listing credit for the new user
  INSERT INTO public.listing_credits (user_id, credits_remaining, credits_used)
  VALUES (NEW.user_id, 1, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire when a user_role is inserted (which happens during signup)
CREATE TRIGGER trigger_create_initial_credit
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.create_initial_listing_credit();

-- Add unique constraint on user_id in listing_credits if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'listing_credits_user_id_key'
  ) THEN
    ALTER TABLE public.listing_credits ADD CONSTRAINT listing_credits_user_id_key UNIQUE (user_id);
  END IF;
END $$;