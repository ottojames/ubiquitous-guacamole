-- Migration: Subscription Tiers & Dynamic Pricing
-- Description: Volume-based pricing tiers for law firms and councils
-- Author: Claude Code Assistant
-- Date: 2025-10-28

-- =============================================================================
-- 1. Create subscription_tiers table (configuration)
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id TEXT PRIMARY KEY, -- 'individual', 'professional', 'business', 'enterprise', 'council'

  -- Display info
  name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL,
  price_annual DECIMAL(10,2), -- NULL for pay-as-you-go

  -- Usage limits
  included_notices INTEGER, -- NULL for unlimited (council) or pay-per (individual)
  overage_rate DECIMAL(10,2), -- Per-notice cost over included amount (NULL for unlimited)

  -- Metadata
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscription_tiers_active ON subscription_tiers(active);

COMMENT ON TABLE subscription_tiers IS 'Available subscription tiers with pricing and limits';
COMMENT ON COLUMN subscription_tiers.included_notices IS 'Notices included per month (NULL = unlimited or pay-per)';
COMMENT ON COLUMN subscription_tiers.overage_rate IS 'Per-notice charge over included amount';

-- =============================================================================
-- 2. Seed initial tiers
-- =============================================================================

INSERT INTO subscription_tiers (id, name, description, price_monthly, price_annual, included_notices, overage_rate) VALUES
  ('individual', 'Pay as you go', 'Perfect for solicitors, businesses, and individuals publishing occasional notices', 50, NULL, NULL, 50), -- No subscription, pay per notice
  ('professional', 'Professional', 'For small law firms publishing 3-7 notices per month', 150.00, 1440.00, 5, 45.00),
  ('business', 'Business', 'For mid-size firms publishing 10-20 notices per month', 400.00, 3840.00, 15, 40.00),
  ('enterprise', 'Enterprise', 'For large firms with dedicated licensing departments', 1200.00, 11520.00, 50, 35.00),
  ('council', 'Council', 'For local authorities publishing regular statutory notices', 299.00, 2999.00, NULL, NULL) -- Unlimited
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. Create organization_subscriptions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization link
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Tier and billing
  tier_id TEXT NOT NULL REFERENCES subscription_tiers(id),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual', 'none')), -- 'none' for pay-as-you-go

  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),

  -- Dates
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,

  -- Stripe integration
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure one active subscription per organization
  UNIQUE(organization_id, status) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_tier ON organization_subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_status ON organization_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_period_end ON organization_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_stripe ON organization_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON TABLE organization_subscriptions IS 'Active subscriptions for organizations';
COMMENT ON COLUMN organization_subscriptions.billing_cycle IS 'Monthly, annual, or none (pay-as-you-go)';

-- =============================================================================
-- 4. Create usage_tracking table
-- =============================================================================

CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to subscription
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES organization_subscriptions(id) ON DELETE SET NULL,

  -- Period tracking
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Usage counts
  notices_published INTEGER DEFAULT 0 NOT NULL,
  notices_included INTEGER, -- NULL for unlimited
  notices_overage INTEGER DEFAULT 0 NOT NULL,

  -- Billing amounts
  base_charge DECIMAL(10,2) NOT NULL, -- Subscription fee
  overage_charge DECIMAL(10,2) DEFAULT 0 NOT NULL, -- Additional charges
  total_charge DECIMAL(10,2) NOT NULL,

  -- Status
  status TEXT DEFAULT 'current' CHECK (status IN ('current', 'finalized', 'billed')),
  billed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraint on period per organization
  UNIQUE(organization_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_org ON usage_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_subscription ON usage_tracking(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_status ON usage_tracking(status);

COMMENT ON TABLE usage_tracking IS 'Monthly usage and billing calculation for subscriptions';
COMMENT ON COLUMN usage_tracking.notices_overage IS 'Count of notices beyond included amount';

-- =============================================================================
-- 5. Helper function: Get organization's current tier
-- =============================================================================

CREATE OR REPLACE FUNCTION get_organization_tier(p_organization_id UUID)
RETURNS TABLE (
  tier_id TEXT,
  tier_name TEXT,
  included_notices INTEGER,
  overage_rate DECIMAL(10,2),
  billing_cycle TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id,
    st.name,
    st.included_notices,
    st.overage_rate,
    os.billing_cycle,
    os.status
  FROM organization_subscriptions os
  JOIN subscription_tiers st ON os.tier_id = st.id
  WHERE os.organization_id = p_organization_id
    AND os.status = 'active'
  ORDER BY os.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_organization_tier IS 'Get current active subscription tier for an organization';

-- =============================================================================
-- 6. Helper function: Calculate billing for notice publication
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_notice_billing(
  p_organization_id UUID,
  p_notice_count INTEGER DEFAULT 1
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_tier_id TEXT;
  v_included_notices INTEGER;
  v_overage_rate DECIMAL(10,2);
  v_current_usage INTEGER;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_charge DECIMAL(10,2);
BEGIN
  -- Get organization's tier
  SELECT tier_id, included_notices, overage_rate
  INTO v_tier_id, v_included_notices, v_overage_rate
  FROM get_organization_tier(p_organization_id);

  -- If no subscription (direct publishing), use individual rate
  IF v_tier_id IS NULL THEN
    SELECT overage_rate INTO v_overage_rate
    FROM subscription_tiers
    WHERE id = 'individual';

    RETURN v_overage_rate * p_notice_count;
  END IF;

  -- If unlimited (council), no per-notice charge
  IF v_included_notices IS NULL THEN
    RETURN 0;
  END IF;

  -- Get current period usage
  SELECT period_start, period_end, notices_published
  INTO v_period_start, v_period_end, v_current_usage
  FROM usage_tracking
  WHERE organization_id = p_organization_id
    AND status = 'current'
  ORDER BY period_start DESC
  LIMIT 1;

  -- If no usage record exists, assume 0 usage
  IF v_current_usage IS NULL THEN
    v_current_usage := 0;
  END IF;

  -- Calculate charge based on overage
  IF v_current_usage < v_included_notices THEN
    -- Still have included notices left
    IF (v_current_usage + p_notice_count) <= v_included_notices THEN
      -- Fully covered by included notices
      v_charge := 0;
    ELSE
      -- Partially covered, charge for overage
      v_charge := v_overage_rate * ((v_current_usage + p_notice_count) - v_included_notices);
    END IF;
  ELSE
    -- Already over limit, charge full overage rate
    v_charge := v_overage_rate * p_notice_count;
  END IF;

  RETURN v_charge;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_notice_billing IS 'Calculate per-notice charge based on subscription tier and current usage';

-- =============================================================================
-- 7. Update auto_bill_notice_publication to use dynamic pricing
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_bill_notice_publication()
RETURNS TRIGGER AS $$
DECLARE
  v_charge DECIMAL(10,2);
BEGIN
  -- Only bill if published by a firm (not by council directly)
  IF NEW.published_by_organization_id IS NOT NULL
     AND NEW.status = 'published'
     AND OLD.status IS DISTINCT FROM 'published' -- Only on transition to published
  THEN
    -- Calculate dynamic charge based on subscription tier
    v_charge := calculate_notice_billing(NEW.published_by_organization_id, 1);

    -- Only create billing transaction if there's a charge
    IF v_charge > 0 THEN
      INSERT INTO billing_transactions (
        organization_id,
        type,
        amount,
        notice_id,
        description,
        created_by
      ) VALUES (
        NEW.published_by_organization_id,
        'charge',
        v_charge,
        NEW.id,
        'Notice publication: ' || NEW.title,
        NEW.published_by_user_id
      );

      NEW.billing_amount = v_charge;
      NEW.billing_status = 'pending';
    ELSE
      -- Covered by subscription, no charge
      NEW.billing_amount = 0;
      NEW.billing_status = 'paid'; -- Mark as paid since no charge
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_bill_notice_publication IS 'Automatically create billing charge with dynamic pricing based on subscription tier';

-- =============================================================================
-- 8. Function to track usage when notice is published
-- =============================================================================

CREATE OR REPLACE FUNCTION track_notice_publication()
RETURNS TRIGGER AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_subscription_id UUID;
  v_tier_id TEXT;
  v_included_notices INTEGER;
  v_base_charge DECIMAL(10,2);
BEGIN
  -- Only track if published by an organization
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN

    -- Get organization's subscription
    SELECT id, tier_id INTO v_subscription_id, v_tier_id
    FROM organization_subscriptions
    WHERE organization_id = NEW.published_by_organization_id
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    -- Calculate current period (monthly)
    v_period_start := date_trunc('month', NOW());
    v_period_end := v_period_start + INTERVAL '1 month';

    -- Get tier details
    SELECT included_notices,
           CASE
             WHEN billing_cycle = 'annual' THEN price_annual / 12
             ELSE price_monthly
           END
    INTO v_included_notices, v_base_charge
    FROM subscription_tiers st
    JOIN organization_subscriptions os ON st.id = os.tier_id
    WHERE os.id = v_subscription_id;

    -- Insert or update usage tracking
    INSERT INTO usage_tracking (
      organization_id,
      subscription_id,
      period_start,
      period_end,
      notices_published,
      notices_included,
      notices_overage,
      base_charge,
      overage_charge,
      total_charge,
      status
    ) VALUES (
      NEW.published_by_organization_id,
      v_subscription_id,
      v_period_start,
      v_period_end,
      1,
      v_included_notices,
      CASE WHEN v_included_notices IS NOT NULL AND 1 > v_included_notices THEN 1 ELSE 0 END,
      COALESCE(v_base_charge, 0),
      COALESCE(NEW.billing_amount, 0),
      COALESCE(v_base_charge, 0) + COALESCE(NEW.billing_amount, 0),
      'current'
    )
    ON CONFLICT (organization_id, period_start, period_end) DO UPDATE
    SET
      notices_published = usage_tracking.notices_published + 1,
      notices_overage = CASE
        WHEN usage_tracking.notices_included IS NOT NULL
          AND usage_tracking.notices_published + 1 > usage_tracking.notices_included
        THEN (usage_tracking.notices_published + 1) - usage_tracking.notices_included
        ELSE 0
      END,
      overage_charge = usage_tracking.overage_charge + COALESCE(NEW.billing_amount, 0),
      total_charge = usage_tracking.base_charge + usage_tracking.overage_charge + COALESCE(NEW.billing_amount, 0),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to notices table
DROP TRIGGER IF EXISTS trigger_track_notice_publication ON notices;
CREATE TRIGGER trigger_track_notice_publication
  AFTER INSERT OR UPDATE ON notices
  FOR EACH ROW
  EXECUTE FUNCTION track_notice_publication();

COMMENT ON FUNCTION track_notice_publication IS 'Track notice publication in usage_tracking table';

-- =============================================================================
-- 9. RLS Policies
-- =============================================================================

-- subscription_tiers (public read)
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active tiers"
  ON subscription_tiers FOR SELECT
  USING (active = TRUE);

-- organization_subscriptions
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view own subscription"
  ON organization_subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view own usage"
  ON usage_tracking FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 10. Create view for current subscription details
-- =============================================================================

CREATE OR REPLACE VIEW organization_subscription_details AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  o.type AS organization_type,
  st.id AS tier_id,
  st.name AS tier_name,
  st.description AS tier_description,
  st.price_monthly,
  st.price_annual,
  st.included_notices,
  st.overage_rate,
  os.billing_cycle,
  os.status AS subscription_status,
  os.current_period_start,
  os.current_period_end,
  os.trial_end,
  ut.notices_published AS current_period_usage,
  ut.notices_overage AS current_period_overage,
  ut.total_charge AS current_period_charge
FROM organizations o
LEFT JOIN organization_subscriptions os ON o.id = os.organization_id AND os.status = 'active'
LEFT JOIN subscription_tiers st ON os.tier_id = st.id
LEFT JOIN usage_tracking ut ON o.id = ut.organization_id AND ut.status = 'current'
WHERE o.type IN ('firm', 'council');

COMMENT ON VIEW organization_subscription_details IS 'Complete subscription and usage information for all organizations';
