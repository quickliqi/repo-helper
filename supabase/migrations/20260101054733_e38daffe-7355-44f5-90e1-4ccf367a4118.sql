-- Create scrape_credits table for investor scraping feature
CREATE TABLE public.scrape_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  subscription_active BOOLEAN NOT NULL DEFAULT false,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scrape_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own scrape credits
CREATE POLICY "Users can view own scrape credits"
ON public.scrape_credits
FOR SELECT
USING (auth.uid() = user_id);

-- Create scrape_results table to store analyzed deals
CREATE TABLE public.scrape_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scrape_session_id UUID NOT NULL,
  source_url TEXT NOT NULL,
  post_content TEXT,
  extracted_data JSONB,
  match_score INTEGER,
  confidence_score INTEGER,
  matched_buy_box_id UUID REFERENCES public.buy_boxes(id) ON DELETE SET NULL,
  analysis_notes TEXT,
  is_saved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scrape_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own scrape results
CREATE POLICY "Users can view own scrape results"
ON public.scrape_results
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own scrape results (for saving)
CREATE POLICY "Users can update own scrape results"
ON public.scrape_results
FOR UPDATE
USING (auth.uid() = user_id);

-- Create scrape_sessions table to track each scrape run
CREATE TABLE public.scrape_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  deals_found INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.scrape_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own scrape sessions
CREATE POLICY "Users can view own scrape sessions"
ON public.scrape_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Add trigger for updated_at on scrape_credits
CREATE TRIGGER update_scrape_credits_updated_at
BEFORE UPDATE ON public.scrape_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();