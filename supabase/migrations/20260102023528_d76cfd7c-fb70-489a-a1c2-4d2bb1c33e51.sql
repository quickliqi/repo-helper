-- Create rate limiting table for edge functions
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_user_function ON public.rate_limits (user_id, function_name, window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Only service role can select rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (false);

CREATE POLICY "Only service role can insert rate limits" 
ON public.rate_limits 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only service role can update rate limits" 
ON public.rate_limits 
FOR UPDATE 
USING (false);

CREATE POLICY "Only service role can delete rate limits" 
ON public.rate_limits 
FOR DELETE 
USING (false);

-- Create function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_function_name text,
  p_max_requests integer DEFAULT 10,
  p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamp with time zone;
  v_current_count integer;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Clean up old records (older than 1 hour)
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
  
  -- Count requests in current window
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND function_name = p_function_name
    AND window_start > v_window_start;
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Insert new request record
  INSERT INTO public.rate_limits (user_id, function_name, request_count, window_start)
  VALUES (p_user_id, p_function_name, 1, now());
  
  RETURN true;
END;
$$;

-- Create function to get remaining requests
CREATE OR REPLACE FUNCTION public.get_rate_limit_remaining(
  p_user_id uuid,
  p_function_name text,
  p_max_requests integer DEFAULT 10,
  p_window_minutes integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamp with time zone;
  v_current_count integer;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND function_name = p_function_name
    AND window_start > v_window_start;
  
  RETURN GREATEST(0, p_max_requests - v_current_count);
END;
$$;