-- Update the trigger function to send email notification on verification status change
CREATE OR REPLACE FUNCTION public.update_profile_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload JSONB;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update profile
    UPDATE public.profiles
    SET verification_status = 'approved', verified_at = now(), is_verified = true
    WHERE user_id = NEW.user_id;
    
    -- Send approval email via edge function
    payload := jsonb_build_object(
      'user_id', NEW.user_id,
      'status', 'approved',
      'admin_notes', NEW.admin_notes
    );
    
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-verification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    );
    
  ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    -- Update profile
    UPDATE public.profiles
    SET verification_status = 'rejected'
    WHERE user_id = NEW.user_id;
    
    -- Send rejection email via edge function
    payload := jsonb_build_object(
      'user_id', NEW.user_id,
      'status', 'rejected',
      'admin_notes', NEW.admin_notes
    );
    
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-verification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    );
  END IF;
  
  RETURN NEW;
END;
$$;