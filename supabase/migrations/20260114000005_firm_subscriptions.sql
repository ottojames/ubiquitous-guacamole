-- Firm Subscription System Migration
-- Implements subscription tiers, allowance tracking, and monthly invoicing

-- ============================================================================
-- SUBSCRIPTION_TIERS TABLE
-- ============================================================================
-- Defines available subscription tiers with pricing and allowances

CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tier details
  name TEXT NOT NULL UNIQUE, -- 'Starter', 'Professional', 'Enterprise'
  slug TEXT NOT NULL UNIQUE, -- 'starter', 'professional', 'enterprise'
  description TEXT,

  -- Pricing
  monthly_price_gbp NUMERIC(10, 2) NOT NULL,
  annual_price_gbp NUMERIC(10, 2), -- Optional annual pricing

  -- Allowances
  notices_per_month INTEGER NOT NULL, -- How many notices included
  additional_notice_price_gbp NUMERIC(10, 2), -- Price per notice over allowance

  -- Features
  features JSONB, -- Array of feature descriptions
  max_users INTEGER, -- Maximum users allowed (NULL = unlimited)
  priority_support BOOLEAN DEFAULT FALSE,

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO public.subscription_tiers (name, slug, description, monthly_price_gbp, annual_price_gbp, notices_per_month, additional_notice_price_gbp, features, max_users, priority_support, display_order)
VALUES
  (
    'Starter',
    'starter',
    'Perfect for small firms getting started with digital notices',
    99.00,
    990.00, -- 2 months free on annual
    10,
    15.00,
    '["10 notices per month", "Standard support", "Up to 5 users", "Email notifications", "Basic analytics"]'::jsonb,
    5,
    FALSE,
    1
  ),
  (
    'Professional',
    'professional',
    'Ideal for growing firms with regular notice publication needs',
    299.00,
    2990.00,
    50,
    10.00,
    '["50 notices per month", "Priority support", "Up to 20 users", "Client management", "Advanced analytics", "CSV bulk upload"]'::jsonb,
    20,
    TRUE,
    2
  ),
  (
    'Enterprise',
    'enterprise',
    'Comprehensive solution for large firms and high-volume users',
    999.00,
    9990.00,
    200,
    8.00,
    '["200 notices per month", "Dedicated support", "Unlimited users", "Client management", "Advanced analytics", "CSV bulk upload", "API access", "Custom integrations"]'::jsonb,
    NULL, -- Unlimited
    TRUE,
    3
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_slug ON public.subscription_tiers(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_active ON public.subscription_tiers(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- FIRM_SUBSCRIPTIONS TABLE
-- ============================================================================
-- Tracks active subscriptions for firms

CREATE TABLE IF NOT EXISTS public.firm_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE RESTRICT,

  -- Subscription details
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'suspended', 'expired', 'trialing')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),

  -- Dates
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,

  -- Stripe integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id) -- One active subscription per organization
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_firm_subscriptions_org ON public.firm_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_firm_subscriptions_status ON public.firm_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_firm_subscriptions_stripe_sub ON public.firm_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_firm_subscriptions_period_end ON public.firm_subscriptions(current_period_end);

-- ============================================================================
-- NOTICE_ALLOWANCE_TRACKING TABLE
-- ============================================================================
-- Tracks notice usage against subscription allowances

CREATE TABLE IF NOT EXISTS public.notice_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.firm_subscriptions(id) ON DELETE CASCADE,
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,

  -- Usage details
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,

  -- Pricing (snapshot at time of use)
  counted_in_allowance BOOLEAN NOT NULL DEFAULT TRUE,
  overage_charge_gbp NUMERIC(10, 2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notice_usage_org ON public.notice_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_notice_usage_subscription ON public.notice_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_notice_usage_notice ON public.notice_usage(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_usage_period ON public.notice_usage(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_notice_usage_overage ON public.notice_usage(subscription_id, counted_in_allowance);

-- ============================================================================
-- MONTHLY_INVOICES TABLE
-- ============================================================================
-- Tracks monthly invoices for overage charges

CREATE TABLE IF NOT EXISTS public.monthly_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.firm_subscriptions(id) ON DELETE CASCADE,

  -- Invoice details
  invoice_number TEXT NOT NULL UNIQUE, -- INV-2026-01-12345
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,

  -- Amounts
  subscription_amount_gbp NUMERIC(10, 2) NOT NULL,
  notices_in_allowance INTEGER NOT NULL,
  notices_overage INTEGER NOT NULL DEFAULT 0,
  overage_amount_gbp NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount_gbp NUMERIC(10, 2) NOT NULL,

  -- Tax
  vat_rate NUMERIC(5, 2) DEFAULT 20.00,
  vat_amount_gbp NUMERIC(10, 2),
  total_inc_vat_gbp NUMERIC(10, 2),

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'void')),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,

  -- Payment
  stripe_invoice_id TEXT UNIQUE,
  payment_method TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_org ON public.monthly_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_subscription ON public.monthly_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_number ON public.monthly_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_status ON public.monthly_invoices(status);
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_period ON public.monthly_invoices(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_due ON public.monthly_invoices(due_date) WHERE status IN ('sent', 'overdue');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current usage for a subscription period
CREATE OR REPLACE FUNCTION get_subscription_usage(
  p_subscription_id UUID,
  p_period_start TIMESTAMPTZ DEFAULT NULL,
  p_period_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  total_notices INTEGER,
  notices_in_allowance INTEGER,
  notices_overage INTEGER,
  overage_amount_gbp NUMERIC
) AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Use provided period or get from subscription
  IF p_period_start IS NULL THEN
    SELECT current_period_start, current_period_end
    INTO v_period_start, v_period_end
    FROM public.firm_subscriptions
    WHERE id = p_subscription_id;
  ELSE
    v_period_start := p_period_start;
    v_period_end := p_period_end;
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_notices,
    COUNT(*) FILTER (WHERE counted_in_allowance = TRUE)::INTEGER AS notices_in_allowance,
    COUNT(*) FILTER (WHERE counted_in_allowance = FALSE)::INTEGER AS notices_overage,
    COALESCE(SUM(overage_charge_gbp), 0) AS overage_amount_gbp
  FROM public.notice_usage
  WHERE subscription_id = p_subscription_id
    AND used_at >= v_period_start
    AND used_at < v_period_end;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if organization can publish notice (has allowance remaining)
CREATE OR REPLACE FUNCTION can_publish_notice(p_organization_id UUID)
RETURNS TABLE(
  can_publish BOOLEAN,
  reason TEXT,
  notices_remaining INTEGER,
  overage_cost_gbp NUMERIC
) AS $$
DECLARE
  v_subscription RECORD;
  v_tier RECORD;
  v_usage RECORD;
BEGIN
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM public.firm_subscriptions
  WHERE organization_id = p_organization_id
    AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'No active subscription', 0, 0::NUMERIC;
    RETURN;
  END IF;

  -- Get tier details
  SELECT * INTO v_tier
  FROM public.subscription_tiers
  WHERE id = v_subscription.tier_id;

  -- Get current usage
  SELECT * INTO v_usage
  FROM get_subscription_usage(v_subscription.id);

  -- Check if within allowance
  IF v_usage.notices_in_allowance < v_tier.notices_per_month THEN
    RETURN QUERY SELECT
      TRUE,
      'Within allowance',
      v_tier.notices_per_month - v_usage.notices_in_allowance,
      0::NUMERIC;
  ELSE
    -- Can still publish but will incur overage charge
    RETURN QUERY SELECT
      TRUE,
      'Overage charge will apply',
      0,
      v_tier.additional_notice_price_gbp;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create firm subscription with trial
CREATE OR REPLACE FUNCTION create_firm_subscription(
  p_organization_id UUID,
  p_tier_id UUID,
  p_billing_cycle TEXT DEFAULT 'monthly',
  p_trial_days INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_trial_end TIMESTAMPTZ;
BEGIN
  -- Calculate period dates
  v_period_start := NOW();

  IF p_billing_cycle = 'monthly' THEN
    v_period_end := v_period_start + INTERVAL '1 month';
  ELSE
    v_period_end := v_period_start + INTERVAL '1 year';
  END IF;

  -- Calculate trial end if applicable
  IF p_trial_days > 0 THEN
    v_trial_end := v_period_start + (p_trial_days || ' days')::INTERVAL;
  END IF;

  -- Create subscription
  INSERT INTO public.firm_subscriptions (
    organization_id,
    tier_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    trial_ends_at
  ) VALUES (
    p_organization_id,
    p_tier_id,
    CASE WHEN p_trial_days > 0 THEN 'trialing' ELSE 'active' END,
    p_billing_cycle,
    v_period_start,
    v_period_end,
    v_trial_end
  ) RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record notice usage
CREATE OR REPLACE FUNCTION record_notice_usage(
  p_organization_id UUID,
  p_notice_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_subscription RECORD;
  v_tier RECORD;
  v_usage RECORD;
  v_usage_id UUID;
  v_counted_in_allowance BOOLEAN;
  v_overage_charge NUMERIC DEFAULT 0;
BEGIN
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM public.firm_subscriptions
  WHERE organization_id = p_organization_id
    AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active subscription found for organization %', p_organization_id;
  END IF;

  -- Get tier details
  SELECT * INTO v_tier
  FROM public.subscription_tiers
  WHERE id = v_subscription.tier_id;

  -- Get current usage
  SELECT * INTO v_usage
  FROM get_subscription_usage(v_subscription.id);

  -- Determine if within allowance
  IF v_usage.notices_in_allowance < v_tier.notices_per_month THEN
    v_counted_in_allowance := TRUE;
    v_overage_charge := 0;
  ELSE
    v_counted_in_allowance := FALSE;
    v_overage_charge := v_tier.additional_notice_price_gbp;
  END IF;

  -- Record usage
  INSERT INTO public.notice_usage (
    organization_id,
    subscription_id,
    notice_id,
    billing_period_start,
    billing_period_end,
    counted_in_allowance,
    overage_charge_gbp
  ) VALUES (
    p_organization_id,
    v_subscription.id,
    p_notice_id,
    v_subscription.current_period_start,
    v_subscription.current_period_end,
    v_counted_in_allowance,
    v_overage_charge
  ) RETURNING id INTO v_usage_id;

  RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_invoices ENABLE ROW LEVEL SECURITY;

-- Anyone can view available tiers
CREATE POLICY view_subscription_tiers ON public.subscription_tiers
  FOR SELECT
  USING (is_active = TRUE);

-- Organization members can view their subscription
CREATE POLICY view_own_subscription ON public.firm_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = firm_subscriptions.organization_id
      AND o.id IN (
        SELECT organization_id FROM public.department_memberships dm
        INNER JOIN public.departments d ON d.id = dm.department_id
        WHERE dm.user_id = auth.uid()
      )
    )
  );

-- Organization members can view their usage
CREATE POLICY view_own_usage ON public.notice_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = notice_usage.organization_id
      AND o.id IN (
        SELECT organization_id FROM public.department_memberships dm
        INNER JOIN public.departments d ON d.id = dm.department_id
        WHERE dm.user_id = auth.uid()
      )
    )
  );

-- Organization members can view their invoices
CREATE POLICY view_own_invoices ON public.monthly_invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = monthly_invoices.organization_id
      AND o.id IN (
        SELECT organization_id FROM public.department_memberships dm
        INNER JOIN public.departments d ON d.id = dm.department_id
        WHERE dm.user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.subscription_tiers IS 'Available subscription plans with pricing and allowances';
COMMENT ON TABLE public.firm_subscriptions IS 'Active subscriptions for professional firms';
COMMENT ON TABLE public.notice_usage IS 'Tracks notice publication against subscription allowances';
COMMENT ON TABLE public.monthly_invoices IS 'Monthly invoices for subscription fees and overage charges';

COMMENT ON FUNCTION get_subscription_usage IS 'Returns current usage statistics for a subscription period';
COMMENT ON FUNCTION can_publish_notice IS 'Checks if organization has allowance remaining or returns overage cost';
COMMENT ON FUNCTION create_firm_subscription IS 'Creates a new subscription for a firm with optional trial period';
COMMENT ON FUNCTION record_notice_usage IS 'Records notice publication and applies allowance or overage charge';
