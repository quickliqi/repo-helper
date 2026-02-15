-- ═══════════════════════════════════════════════════════════════════
-- Scraper Architecture Overhaul — Schema
-- ═══════════════════════════════════════════════════════════════════

-- 1. Scraper Config (admin-configurable thresholds)
CREATE TABLE IF NOT EXISTS scraper_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value NUMERIC NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    min_value NUMERIC DEFAULT 0,
    max_value NUMERIC DEFAULT 100,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO scraper_config (key, value, label, description, min_value, max_value) VALUES
    ('relevance_threshold', 30, 'Relevance Threshold', 'Minimum relevance score to accept a deal (0-100)', 0, 100),
    ('pass_threshold', 60, 'Pass Threshold', 'Minimum overall audit score to pass (0-100)', 0, 100),
    ('deviation_threshold', 5, 'Deviation Threshold', 'Max allowed % deviation in cross-check (0-50)', 0, 50),
    ('max_results', 10, 'Max Results', 'Maximum deals per scrape session (1-50)', 1, 50),
    ('crawl_depth', 1, 'Crawl Depth', 'Pages to crawl per source (1-5)', 1, 5),
    ('min_description_length', 20, 'Min Description Length', 'Reject deals with shorter descriptions', 0, 500),
    ('min_required_fields', 4, 'Min Required Fields', 'Reject deals missing more than this many critical fields', 0, 10),
    ('dedup_price_variance', 5, 'Dedup Price Variance %', 'Flag deals at same address within this % price variance', 0, 20)
ON CONFLICT (key) DO NOTHING;

-- 2. Domain Whitelist / Blacklist
CREATE TABLE IF NOT EXISTS scraper_domain_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('whitelist', 'blacklist')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(domain, rule_type)
);

-- Seed some default whitelist entries
INSERT INTO scraper_domain_rules (domain, rule_type, reason) VALUES
    ('realtor.com', 'whitelist', 'Primary MLS source'),
    ('zillow.com', 'whitelist', 'Major real estate portal'),
    ('redfin.com', 'whitelist', 'Trusted MLS aggregator'),
    ('craigslist.org', 'whitelist', 'FSBO source'),
    ('facebook.com', 'whitelist', 'Marketplace deals')
ON CONFLICT (domain, rule_type) DO NOTHING;

-- 3. Scraper Seeds (managed target locations)
CREATE TABLE IF NOT EXISTS scraper_seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    state TEXT NOT NULL CHECK (length(state) = 2),
    source_type TEXT NOT NULL DEFAULT 'all' CHECK (source_type IN ('mls', 'fsbo', 'all')),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    last_scraped_at TIMESTAMPTZ,
    total_runs INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(city, state, source_type)
);

-- 4. Rejected Items Log
CREATE TABLE IF NOT EXISTS scraper_rejected_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    raw_data JSONB NOT NULL,
    rejection_reason TEXT NOT NULL,
    rejection_agent TEXT NOT NULL,
    confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    title TEXT,
    source TEXT,
    can_override BOOLEAN DEFAULT true,
    overridden BOOLEAN DEFAULT false,
    overridden_by UUID REFERENCES auth.users(id),
    overridden_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rejected_items_created ON scraper_rejected_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rejected_items_agent ON scraper_rejected_items(rejection_agent);

-- 5. Dedup hash index for cross-session deduplication
CREATE TABLE IF NOT EXISTS scraper_dedup_hashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_hash TEXT NOT NULL,
    price NUMERIC,
    source TEXT,
    first_seen_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    seen_count INTEGER DEFAULT 1,
    property_id UUID,
    UNIQUE(address_hash)
);

CREATE INDEX IF NOT EXISTS idx_dedup_hashes_hash ON scraper_dedup_hashes(address_hash);

-- ═══════════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE scraper_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_domain_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_rejected_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_dedup_hashes ENABLE ROW LEVEL SECURITY;

-- Admin-only write, public read for config
CREATE POLICY "Anyone can read scraper config" ON scraper_config FOR SELECT USING (true);
CREATE POLICY "Admins can update scraper config" ON scraper_config FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- Admin-only for domain rules
CREATE POLICY "Anyone can read domain rules" ON scraper_domain_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage domain rules" ON scraper_domain_rules FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- Admin-only for seeds
CREATE POLICY "Anyone can read seeds" ON scraper_seeds FOR SELECT USING (true);
CREATE POLICY "Admins can manage seeds" ON scraper_seeds FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- Admin read for rejected items, service role insert
CREATE POLICY "Admins can read rejected items" ON scraper_rejected_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);
CREATE POLICY "Service can insert rejected items" ON scraper_rejected_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update rejected items" ON scraper_rejected_items FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- Dedup hashes: service role only
CREATE POLICY "Anyone can read dedup hashes" ON scraper_dedup_hashes FOR SELECT USING (true);
CREATE POLICY "Service can manage dedup hashes" ON scraper_dedup_hashes FOR ALL WITH CHECK (true);
