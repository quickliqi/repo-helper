-- ═══════════════════════════════════════════════════════════
-- CORE TABLES FOR QUICKLIQI
-- Applied to project: olhppxldsbnxanpgkurt
-- Date: 2026-02-21
-- ═══════════════════════════════════════════════════════════

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'investor',
    bio TEXT,
    phone TEXT,
    company TEXT,
    experience_level TEXT DEFAULT 'beginner',
    push_subscription JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'investor',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 3. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Listing Credits
CREATE TABLE IF NOT EXISTS public.listing_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_remaining INT DEFAULT 3,
    credits_used INT DEFAULT 0,
    plan_type TEXT DEFAULT 'free',
    reset_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. Scrape Credits
CREATE TABLE IF NOT EXISTS public.scrape_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_remaining INT DEFAULT 5,
    credits_used INT DEFAULT 0,
    plan_type TEXT DEFAULT 'free',
    reset_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 6. Buy Boxes
CREATE TABLE IF NOT EXISTS public.buy_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Buy Box',
    property_types TEXT[] DEFAULT '{"single_family"}',
    deal_types TEXT[] DEFAULT '{"wholesale"}',
    min_price NUMERIC,
    max_price NUMERIC,
    min_arv NUMERIC,
    max_arv NUMERIC,
    min_equity_percentage NUMERIC,
    target_cities TEXT[] DEFAULT '{}',
    target_states TEXT[] DEFAULT '{}',
    target_zip_codes TEXT[] DEFAULT '{}',
    preferred_conditions TEXT[] DEFAULT '{"fair","good"}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Properties
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    price NUMERIC,
    arv NUMERIC,
    property_type TEXT DEFAULT 'single_family',
    deal_type TEXT DEFAULT 'wholesale',
    condition TEXT DEFAULT 'fair',
    bedrooms INT,
    bathrooms NUMERIC,
    sqft INT,
    description TEXT,
    link TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Scraper Config
CREATE TABLE IF NOT EXISTS public.scraper_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Scraper Domain Rules
CREATE TABLE IF NOT EXISTS public.scraper_domain_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    rule_type TEXT NOT NULL DEFAULT 'blacklist',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Scraper Dedup Hashes
CREATE TABLE IF NOT EXISTS public.scraper_dedup_hashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_hash TEXT NOT NULL UNIQUE,
    price NUMERIC,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Scraper Audit Logs
CREATE TABLE IF NOT EXISTS public.scraper_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    report JSONB,
    overall_score INT,
    pass BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Scraper Rejected Items
CREATE TABLE IF NOT EXISTS public.scraper_rejected_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    deal_data JSONB,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id),
    seller_id UUID REFERENCES auth.users(id),
    last_message TEXT,
    unread_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Saved Properties
CREATE TABLE IF NOT EXISTS public.saved_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- 17. JV Agreements
CREATE TABLE IF NOT EXISTS public.jv_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id),
    investor_id UUID REFERENCES auth.users(id),
    partner_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending',
    terms JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Calculation Audit Logs
CREATE TABLE IF NOT EXISTS public.calculation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    context TEXT,
    input_data JSONB,
    output_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Payment History
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    amount NUMERIC,
    currency TEXT DEFAULT 'usd',
    status TEXT,
    stripe_payment_id TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Payment Transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    stripe_payment_intent_id TEXT,
    amount NUMERIC,
    currency TEXT DEFAULT 'usd',
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Financial Audit Log
CREATE TABLE IF NOT EXISTS public.financial_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT,
    amount NUMERIC,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. User Contract Credits
CREATE TABLE IF NOT EXISTS public.user_contract_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_remaining INT DEFAULT 0,
    credits_used INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 24. Webhook Events
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT,
    stripe_event_id TEXT UNIQUE,
    payload JSONB,
    status TEXT DEFAULT 'received',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Scrape Results
CREATE TABLE IF NOT EXISTS public.scrape_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    deal_data JSONB,
    ai_score NUMERIC,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Matches
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id),
    investor_id UUID REFERENCES auth.users(id),
    match_score NUMERIC,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- DEFAULT CONFIG
-- ═══════════════════════════════════════════════════════════
INSERT INTO public.scraper_config (key, value) VALUES
    ('max_results', '10'),
    ('pass_threshold', '70')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- ENABLE RLS
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buy_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_insert_service" ON public.user_roles FOR INSERT WITH CHECK (true);

CREATE POLICY "subs_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subs_insert_service" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "subs_update_service" ON public.subscriptions FOR UPDATE USING (true);

CREATE POLICY "listing_credits_select" ON public.listing_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "listing_credits_insert" ON public.listing_credits FOR INSERT WITH CHECK (true);
CREATE POLICY "listing_credits_update" ON public.listing_credits FOR UPDATE USING (true);

CREATE POLICY "scrape_credits_select" ON public.scrape_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scrape_credits_insert" ON public.scrape_credits FOR INSERT WITH CHECK (true);
CREATE POLICY "scrape_credits_update" ON public.scrape_credits FOR UPDATE USING (true);

CREATE POLICY "buy_boxes_select_own" ON public.buy_boxes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "buy_boxes_insert_own" ON public.buy_boxes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "buy_boxes_update_own" ON public.buy_boxes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "buy_boxes_delete_own" ON public.buy_boxes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "properties_select_all" ON public.properties FOR SELECT USING (true);
CREATE POLICY "properties_insert_own" ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "properties_update_own" ON public.properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "properties_delete_own" ON public.properties FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "saved_select_own" ON public.saved_properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_insert_own" ON public.saved_properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_delete_own" ON public.saved_properties FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "conv_select_own" ON public.conversations FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "conv_insert" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "conv_update" ON public.conversations FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "msg_select_conv" ON public.messages FOR SELECT USING (true);
CREATE POLICY "msg_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ═══════════════════════════════════════════════════════════
-- AUTO-SIGNUP TRIGGER
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'investor'));

    INSERT INTO public.listing_credits (user_id, credits_remaining, plan_type)
    VALUES (NEW.id, 3, 'free');

    INSERT INTO public.scrape_credits (user_id, credits_remaining, plan_type)
    VALUES (NEW.id, 5, 'free');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
