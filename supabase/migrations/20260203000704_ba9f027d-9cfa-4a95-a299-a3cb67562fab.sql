-- Create saved_searches table for property alerts
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  search_query TEXT,
  property_types TEXT[] DEFAULT '{}',
  deal_types TEXT[] DEFAULT '{}',
  states TEXT[] DEFAULT '{}',
  min_price INTEGER,
  max_price INTEGER,
  notifications_enabled BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_ratings table for trust indicators
CREATE TABLE public.user_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rater_user_id UUID NOT NULL,
  rated_user_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rater_user_id, rated_user_id, property_id)
);

-- Create saved_properties table for favorites
CREATE TABLE public.saved_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Add stats columns to profiles for trust indicators
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deals_closed INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_since DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS response_rate INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avg_response_time_hours INTEGER;

-- Update member_since for existing profiles
UPDATE public.profiles SET member_since = DATE(created_at) WHERE member_since IS NULL;

-- Enable Row Level Security
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_searches
CREATE POLICY "Users can view their own saved searches"
ON public.saved_searches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches"
ON public.saved_searches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
ON public.saved_searches FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
ON public.saved_searches FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for user_ratings
CREATE POLICY "Anyone can view ratings"
ON public.user_ratings FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create ratings"
ON public.user_ratings FOR INSERT
WITH CHECK (auth.uid() = rater_user_id);

CREATE POLICY "Users can update their own ratings"
ON public.user_ratings FOR UPDATE
USING (auth.uid() = rater_user_id);

CREATE POLICY "Users can delete their own ratings"
ON public.user_ratings FOR DELETE
USING (auth.uid() = rater_user_id);

-- RLS policies for saved_properties
CREATE POLICY "Users can view their own saved properties"
ON public.saved_properties FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save properties"
ON public.saved_properties FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave properties"
ON public.saved_properties FOR DELETE
USING (auth.uid() = user_id);

-- Function to get user average rating
CREATE OR REPLACE FUNCTION public.get_user_avg_rating(p_user_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0)
  FROM public.user_ratings
  WHERE rated_user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to get user rating count
CREATE OR REPLACE FUNCTION public.get_user_rating_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_ratings
  WHERE rated_user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable realtime for messages (for online status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_properties;