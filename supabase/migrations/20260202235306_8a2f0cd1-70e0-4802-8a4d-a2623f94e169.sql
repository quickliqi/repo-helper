-- Create atomic view increment function
CREATE OR REPLACE FUNCTION public.increment_views(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE properties 
  SET views_count = COALESCE(views_count, 0) + 1 
  WHERE id = p_property_id;
END;
$$;