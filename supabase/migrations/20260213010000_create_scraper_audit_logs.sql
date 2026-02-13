-- Create scraper_audit_logs table for the Scraper Audit Agent system
CREATE TABLE IF NOT EXISTS scraper_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES scrape_sessions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    audit_report JSONB NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    pass BOOLEAN NOT NULL DEFAULT FALSE,
    alerts_count INTEGER DEFAULT 0,
    integrity_score INTEGER DEFAULT 0,
    structural_score INTEGER DEFAULT 0,
    relevance_score INTEGER DEFAULT 0,
    crosscheck_score INTEGER DEFAULT 0,
    total_deals INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user and time
CREATE INDEX IF NOT EXISTS idx_scraper_audit_logs_user_id ON scraper_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraper_audit_logs_created_at ON scraper_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_audit_logs_session_id ON scraper_audit_logs(session_id);

-- Enable RLS
ALTER TABLE scraper_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own audit logs
CREATE POLICY "Users can read own audit logs"
    ON scraper_audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Admin can read all logs
CREATE POLICY "Admins can read all audit logs"
    ON scraper_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Service role can insert
CREATE POLICY "Service role can insert audit logs"
    ON scraper_audit_logs FOR INSERT
    WITH CHECK (true);
