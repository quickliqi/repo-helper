-- =====================================================
-- Security Fix: INPUT_VALIDATION - Add database constraints
-- =====================================================

-- Properties table constraints
ALTER TABLE public.properties 
  ADD CONSTRAINT properties_title_length CHECK (char_length(title) BETWEEN 5 AND 200),
  ADD CONSTRAINT properties_description_length CHECK (description IS NULL OR char_length(description) <= 10000),
  ADD CONSTRAINT properties_address_length CHECK (char_length(address) BETWEEN 3 AND 500),
  ADD CONSTRAINT properties_city_length CHECK (char_length(city) BETWEEN 1 AND 100),
  ADD CONSTRAINT properties_state_length CHECK (char_length(state) BETWEEN 1 AND 100),
  ADD CONSTRAINT properties_zip_length CHECK (char_length(zip_code) BETWEEN 3 AND 20);

-- Profiles table constraints
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_name_length CHECK (char_length(full_name) BETWEEN 1 AND 200),
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 2000),
  ADD CONSTRAINT profiles_phone_format CHECK (phone IS NULL OR phone ~ '^[0-9\(\)\s\-\+\.]{5,30}$'),
  ADD CONSTRAINT profiles_company_length CHECK (company_name IS NULL OR char_length(company_name) <= 200),
  ADD CONSTRAINT profiles_city_length CHECK (city IS NULL OR char_length(city) <= 100),
  ADD CONSTRAINT profiles_state_length CHECK (state IS NULL OR char_length(state) <= 100);

-- Buy boxes table constraints
ALTER TABLE public.buy_boxes 
  ADD CONSTRAINT buy_boxes_name_length CHECK (char_length(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT buy_boxes_notes_length CHECK (notes IS NULL OR char_length(notes) <= 5000);

-- Notifications table constraints
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_title_length CHECK (char_length(title) BETWEEN 1 AND 500),
  ADD CONSTRAINT notifications_message_length CHECK (char_length(message) <= 5000),
  ADD CONSTRAINT notifications_type_length CHECK (char_length(type) BETWEEN 1 AND 50);

-- =====================================================
-- Security Fix: STORAGE_EXPOSURE - Tighten storage policies
-- =====================================================

-- Drop existing permissive policies for property-images
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;

-- Create stricter policies for property-images (user folder isolation)
CREATE POLICY "Users can upload to own folder in property-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'property-images');

CREATE POLICY "Users can update own property images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own property images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Drop existing permissive policies for avatars
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Create stricter policies for avatars (user folder isolation)
CREATE POLICY "Users can upload to own folder in avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- Security Fix: DEFINER_OR_RPC_BYPASS - Add rate limiting
-- =====================================================

-- Create throttle tracking table
CREATE TABLE IF NOT EXISTS public.property_match_throttle (
  user_id UUID PRIMARY KEY,
  properties_created_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (only service role via SECURITY DEFINER functions)
ALTER TABLE public.property_match_throttle ENABLE ROW LEVEL SECURITY;

-- Update match function with rate limiting
CREATE OR REPLACE FUNCTION public.match_property_to_buy_boxes(property_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  prop RECORD;
  bb RECORD;
  score INTEGER;
  daily_limit INTEGER := 20;
  current_count INTEGER;
BEGIN
  SELECT * INTO prop FROM public.properties WHERE id = property_id_input;
  
  IF prop IS NULL THEN
    RETURN;
  END IF;
  
  -- Rate limiting
  INSERT INTO public.property_match_throttle (user_id, properties_created_today, last_reset_date)
  VALUES (prop.user_id, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    properties_created_today = CASE 
      WHEN property_match_throttle.last_reset_date < CURRENT_DATE THEN 0
      ELSE property_match_throttle.properties_created_today
    END,
    last_reset_date = CURRENT_DATE,
    updated_at = NOW();
  
  SELECT properties_created_today INTO current_count 
  FROM public.property_match_throttle 
  WHERE user_id = prop.user_id;
  
  IF current_count >= daily_limit THEN
    RAISE NOTICE 'User % exceeded daily limit', prop.user_id;
    RETURN;
  END IF;
  
  UPDATE public.property_match_throttle 
  SET properties_created_today = properties_created_today + 1, updated_at = NOW()
  WHERE user_id = prop.user_id;
  
  FOR bb IN SELECT * FROM public.buy_boxes WHERE is_active = TRUE
  LOOP
    score := 0;
    IF prop.property_type = ANY(bb.property_types) THEN score := score + 25; END IF;
    IF prop.deal_type = ANY(bb.deal_types) THEN score := score + 25; END IF;
    IF (bb.min_price IS NULL OR prop.asking_price >= bb.min_price)
       AND (bb.max_price IS NULL OR prop.asking_price <= bb.max_price) THEN
      score := score + 20;
    END IF;
    IF prop.city = ANY(bb.target_cities) OR prop.state = ANY(bb.target_states) 
       OR prop.zip_code = ANY(bb.target_zip_codes) THEN
      score := score + 20;
    ELSIF array_length(bb.target_cities, 1) IS NULL 
          AND array_length(bb.target_states, 1) IS NULL 
          AND array_length(bb.target_zip_codes, 1) IS NULL THEN
      score := score + 10;
    END IF;
    IF prop.condition = ANY(bb.preferred_conditions) OR array_length(bb.preferred_conditions, 1) IS NULL THEN
      score := score + 10;
    END IF;
    
    IF score >= 50 THEN
      INSERT INTO public.matches (property_id, buy_box_id, investor_id, match_score)
      VALUES (prop.id, bb.id, bb.user_id, score)
      ON CONFLICT (property_id, buy_box_id) DO UPDATE SET match_score = score;
      
      INSERT INTO public.notifications (user_id, title, message, type, related_property_id)
      VALUES (bb.user_id, 'New Property Match!',
        'A new property in ' || prop.city || ', ' || prop.state || ' matches your ' || bb.name || ' criteria.',
        'match', prop.id);
    END IF;
  END LOOP;
END;
$function$;