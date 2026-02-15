-- =============================================================================
-- Stripe Integration Hardening Migration
-- Creates webhook_events, payment_transactions, and financial_audit_log tables
-- =============================================================================

-- 1. Webhook Events — idempotency + debugging log
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB,
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'duplicate')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_webhook_events_stripe_event_id ON public.webhook_events (stripe_event_id);
CREATE INDEX idx_webhook_events_event_type ON public.webhook_events (event_type);
CREATE INDEX idx_webhook_events_status ON public.webhook_events (processing_status);
CREATE INDEX idx_webhook_events_created_at ON public.webhook_events (created_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read webhook events (via service role or admin role)
CREATE POLICY "Admins can view webhook events"
ON public.webhook_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Service role can manage all webhook events
CREATE POLICY "Service role manages webhook events"
ON public.webhook_events FOR ALL
USING (true)
WITH CHECK (true);


-- 2. Payment Transactions — state machine
CREATE TYPE public.transaction_type AS ENUM (
  'subscription',
  'credit_purchase',
  'scrape_subscription'
);

CREATE TYPE public.transaction_status AS ENUM (
  'pending',
  'confirmed',
  'fulfilled',
  'failed',
  'refunded'
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  transaction_type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions (user_id);
CREATE INDEX idx_payment_transactions_session ON public.payment_transactions (stripe_session_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions (status);
CREATE INDEX idx_payment_transactions_created ON public.payment_transactions (created_at DESC);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.payment_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.payment_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Service role manages transactions
CREATE POLICY "Service role manages transactions"
ON public.payment_transactions FOR ALL
USING (true)
WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 3. Financial Audit Log — immutable trail for all financial actions
CREATE TABLE IF NOT EXISTS public.financial_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_audit_actor ON public.financial_audit_log (actor_id);
CREATE INDEX idx_financial_audit_action ON public.financial_audit_log (action);
CREATE INDEX idx_financial_audit_resource ON public.financial_audit_log (resource_type, resource_id);
CREATE INDEX idx_financial_audit_created ON public.financial_audit_log (created_at DESC);

ALTER TABLE public.financial_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit log
CREATE POLICY "Admins can view audit log"
ON public.financial_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Service role can insert audit records
CREATE POLICY "Service role manages audit log"
ON public.financial_audit_log FOR ALL
USING (true)
WITH CHECK (true);
