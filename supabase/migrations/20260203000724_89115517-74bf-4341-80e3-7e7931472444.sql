-- Fix function search path for get_user_avg_rating
CREATE OR REPLACE FUNCTION public.get_user_avg_rating(p_user_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0)
  FROM public.user_ratings
  WHERE rated_user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Fix function search path for get_user_rating_count
CREATE OR REPLACE FUNCTION public.get_user_rating_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_ratings
  WHERE rated_user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;