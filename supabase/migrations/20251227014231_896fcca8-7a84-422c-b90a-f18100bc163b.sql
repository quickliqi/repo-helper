-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('investor', 'wholesaler', 'admin');

-- Create enum for property types
CREATE TYPE public.property_type AS ENUM ('single_family', 'multi_family', 'condo', 'townhouse', 'commercial', 'land', 'mobile_home', 'other');

-- Create enum for deal types
CREATE TYPE public.deal_type AS ENUM ('fix_and_flip', 'buy_and_hold', 'wholesale', 'subject_to', 'seller_finance', 'other');

-- Create enum for property condition
CREATE TYPE public.property_condition AS ENUM ('excellent', 'good', 'fair', 'poor', 'distressed');

-- Create enum for property status
CREATE TYPE public.property_status AS ENUM ('active', 'under_contract', 'pending', 'sold', 'withdrawn');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  city TEXT,
  state TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create buy_boxes table (investor criteria)
CREATE TABLE public.buy_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Buy Box',
  property_types property_type[] NOT NULL DEFAULT '{}',
  deal_types deal_type[] NOT NULL DEFAULT '{}',
  min_price INTEGER,
  max_price INTEGER,
  min_arv INTEGER,
  max_arv INTEGER,
  min_equity_percentage INTEGER,
  preferred_conditions property_condition[] DEFAULT '{}',
  target_cities TEXT[] DEFAULT '{}',
  target_states TEXT[] DEFAULT '{}',
  target_zip_codes TEXT[] DEFAULT '{}',
  max_radius_miles INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create properties table (wholesaler listings)
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  property_type property_type NOT NULL,
  deal_type deal_type NOT NULL,
  condition property_condition NOT NULL,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  sqft INTEGER,
  lot_size_sqft INTEGER,
  year_built INTEGER,
  asking_price INTEGER NOT NULL,
  arv INTEGER,
  repair_estimate INTEGER,
  assignment_fee INTEGER,
  equity_percentage INTEGER,
  description TEXT,
  highlights TEXT[],
  image_urls TEXT[] DEFAULT '{}',
  status property_status DEFAULT 'active',
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  buy_box_id UUID REFERENCES public.buy_boxes(id) ON DELETE CASCADE NOT NULL,
  investor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_score INTEGER DEFAULT 0,
  is_viewed BOOLEAN DEFAULT FALSE,
  is_saved BOOLEAN DEFAULT FALSE,
  is_contacted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (property_id, buy_box_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  related_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  related_match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buy_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role on signup" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Buy boxes policies (investors can manage their own, wholesalers can view all active)
CREATE POLICY "Investors can manage own buy boxes" ON public.buy_boxes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Wholesalers can view active buy boxes" ON public.buy_boxes
  FOR SELECT USING (
    is_active = TRUE AND public.has_role(auth.uid(), 'wholesaler')
  );

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON public.properties
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Wholesalers can insert properties" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND public.has_role(auth.uid(), 'wholesaler')
  );

CREATE POLICY "Wholesalers can update own properties" ON public.properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Wholesalers can delete own properties" ON public.properties
  FOR DELETE USING (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Investors can view own matches" ON public.matches
  FOR SELECT USING (auth.uid() = investor_id);

CREATE POLICY "Wholesalers can view matches for their properties" ON public.matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can create matches" ON public.matches
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Investors can update own matches" ON public.matches
  FOR UPDATE USING (auth.uid() = investor_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (TRUE);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buy_boxes_updated_at
  BEFORE UPDATE ON public.buy_boxes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to match properties to buy boxes
CREATE OR REPLACE FUNCTION public.match_property_to_buy_boxes(property_id_input UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prop RECORD;
  bb RECORD;
  score INTEGER;
BEGIN
  -- Get the property
  SELECT * INTO prop FROM public.properties WHERE id = property_id_input;
  
  IF prop IS NULL THEN
    RETURN;
  END IF;
  
  -- Loop through active buy boxes
  FOR bb IN SELECT * FROM public.buy_boxes WHERE is_active = TRUE
  LOOP
    score := 0;
    
    -- Check property type match
    IF prop.property_type = ANY(bb.property_types) THEN
      score := score + 25;
    END IF;
    
    -- Check deal type match
    IF prop.deal_type = ANY(bb.deal_types) THEN
      score := score + 25;
    END IF;
    
    -- Check price range
    IF (bb.min_price IS NULL OR prop.asking_price >= bb.min_price)
       AND (bb.max_price IS NULL OR prop.asking_price <= bb.max_price) THEN
      score := score + 20;
    END IF;
    
    -- Check location (city or state match)
    IF prop.city = ANY(bb.target_cities) OR prop.state = ANY(bb.target_states) 
       OR prop.zip_code = ANY(bb.target_zip_codes) THEN
      score := score + 20;
    ELSIF array_length(bb.target_cities, 1) IS NULL 
          AND array_length(bb.target_states, 1) IS NULL 
          AND array_length(bb.target_zip_codes, 1) IS NULL THEN
      score := score + 10; -- No location preference set
    END IF;
    
    -- Check condition
    IF prop.condition = ANY(bb.preferred_conditions) OR array_length(bb.preferred_conditions, 1) IS NULL THEN
      score := score + 10;
    END IF;
    
    -- Only create match if score is above threshold (50%)
    IF score >= 50 THEN
      INSERT INTO public.matches (property_id, buy_box_id, investor_id, match_score)
      VALUES (prop.id, bb.id, bb.user_id, score)
      ON CONFLICT (property_id, buy_box_id) DO UPDATE SET match_score = score;
      
      -- Create notification for investor
      INSERT INTO public.notifications (user_id, title, message, type, related_property_id)
      VALUES (
        bb.user_id,
        'New Property Match!',
        'A new property in ' || prop.city || ', ' || prop.state || ' matches your ' || bb.name || ' criteria.',
        'match',
        prop.id
      );
    END IF;
  END LOOP;
END;
$$;

-- Trigger to auto-match when property is created
CREATE OR REPLACE FUNCTION public.trigger_match_on_property_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.match_property_to_buy_boxes(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER match_property_on_insert
  AFTER INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.trigger_match_on_property_insert();