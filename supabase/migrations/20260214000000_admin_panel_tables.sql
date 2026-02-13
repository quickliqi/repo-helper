-- Migration: Admin Control Panel Tables
-- Description: Adds tables for Feature Flags, Platform Settings (Governance), and Admin Audit Logs.

-- 1. Feature Flags Table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Platform Settings Table (Governance Parameters)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL, -- Flexible storage for numbers, strings, or complex objects
    type TEXT NOT NULL CHECK (type IN ('string', 'number', 'boolean', 'json')), 
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- e.g., 'toggle_flag', 'update_setting', 'impersonate_user'
    target_id TEXT, -- ID of the object being modified (if applicable)
    details JSONB, -- Previous value, new value, etc.
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Feature Flags
-- Everyone can read flags (needed for frontend logic)
CREATE POLICY "Everyone can read feature flags" ON public.feature_flags
    FOR SELECT USING (true);

-- Only Admins can insert/update/delete
CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policies for Platform Settings
-- authenticated users can read settings (needed for calculations)
CREATE POLICY "Authenticated users can read settings" ON public.platform_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only Admins can manage settings
CREATE POLICY "Admins can manage settings" ON public.platform_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policies for Admin Audit Logs
-- Only Admins can view logs
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Service role or Admin can insert logs
CREATE POLICY "Admins and Service Role can insert audit logs" ON public.admin_audit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
        OR auth.role() = 'service_role'
    );

-- Seed Initial Data
INSERT INTO public.feature_flags (key, is_enabled, description) VALUES
    ('maintenance_mode', false, 'Puts the site into maintenance mode'),
    ('ai_deal_analyzer', true, 'Enables the AI Deal Analyzer features'),
    ('beta_features', false, 'Enables beta features for testing')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.platform_settings (key, value, type, description) VALUES
    ('max_allowable_offer_factor', '0.70', 'number', 'Multiplier for MAO calculation (Standard 70% rule)'),
    ('default_closing_costs', '0.03', 'number', 'Default closing costs percentage (3%)'),
    ('default_holding_costs', '0.02', 'number', 'Default holding costs percentage (2%)'),
    ('high_roi_threshold', '15', 'number', 'ROI percentage to consider a deal valid')
ON CONFLICT (key) DO NOTHING;
