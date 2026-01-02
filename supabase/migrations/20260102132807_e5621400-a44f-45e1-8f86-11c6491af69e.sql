CREATE OR REPLACE FUNCTION public.match_property_to_buy_boxes(property_id_input uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prop RECORD;
  bb RECORD;
  investor_profile RECORD;
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
    -- Skip investors who are not actively buying
    SELECT * INTO investor_profile FROM public.profiles WHERE user_id = bb.user_id;
    IF investor_profile IS NOT NULL AND investor_profile.is_actively_buying = FALSE THEN
      CONTINUE;
    END IF;
    
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