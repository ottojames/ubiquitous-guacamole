-- Migration: Billing System (Phase 5)
-- Description: Account-based billing with running balance for firms
-- Author: Claude Code Assistant
-- Date: 2025-10-22

-- =============================================================================
-- 1. Create billing_transactions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Firm account
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('charge', 'payment', 'refund', 'adjustment', 'credit')),
  amount DECIMAL(10,2) NOT NULL, -- Positive for charges, negative for payments/refunds
  balance_after DECIMAL(10,2) NOT NULL, -- Running balance after this transaction

  -- Related records
  notice_id UUID REFERENCES notices(id) ON DELETE SET NULL,
  payment_intent_id TEXT, -- Stripe payment intent ID

  -- Description
  description TEXT NOT NULL,
  notes TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Status for payments (succeeded, failed, pending, refunded)
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  -- Invoice reference
  invoice_number TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_transactions_org ON billing_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_created_at ON billing_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_type ON billing_transactions(type);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_notice ON billing_transactions(notice_id) WHERE notice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_transactions_payment_intent ON billing_transactions(payment_intent_id) WHERE payment_intent_id IS NOT NULL;

COMMENT ON TABLE billing_transactions IS 'Account-based billing transactions with running balance';
COMMENT ON COLUMN billing_transactions.amount IS 'Positive for charges, negative for payments/refunds';
COMMENT ON COLUMN billing_transactions.balance_after IS 'Running account balance after this transaction';

-- =============================================================================
-- 2. Create trigger to maintain running balance
-- =============================================================================

CREATE OR REPLACE FUNCTION update_billing_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Get current balance for organization (sum of all previous transactions)
  SELECT COALESCE(SUM(amount), 0)
  INTO current_balance
  FROM billing_transactions
  WHERE organization_id = NEW.organization_id
    AND created_at < NEW.created_at;

  -- Calculate new balance
  NEW.balance_after = current_balance + NEW.amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to billing_transactions
CREATE TRIGGER trigger_billing_balance
  BEFORE INSERT ON billing_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_balance();

COMMENT ON FUNCTION update_billing_balance IS 'Automatically calculate running balance for billing transactions';

-- =============================================================================
-- 3. Create view for current account balances
-- =============================================================================

CREATE OR REPLACE VIEW organization_account_balances AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  COALESCE(SUM(bt.amount), 0) AS current_balance,
  COUNT(CASE WHEN bt.type = 'charge' AND (bt.status IS NULL OR bt.status = 'pending') THEN 1 END) AS unpaid_charges,
  MAX(bt.created_at) AS last_transaction_date,
  COUNT(bt.id) AS total_transactions
FROM organizations o
LEFT JOIN billing_transactions bt ON o.id = bt.organization_id
WHERE o.type = 'firm' -- Only firms have billing accounts
GROUP BY o.id, o.name;

COMMENT ON VIEW organization_account_balances IS 'Current account balance summary for all firms';

-- =============================================================================
-- 4. Create function to auto-bill notice publications
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_bill_notice_publication()
RETURNS TRIGGER AS $$
BEGIN
  -- Only bill if published by a firm (not by council directly)
  IF NEW.published_by_organization_id IS NOT NULL
     AND NEW.status = 'published'
     AND OLD.status IS DISTINCT FROM 'published' -- Only on transition to published
  THEN
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
      COALESCE(NEW.billing_amount, 150.00), -- Default £150, configurable per notice
      NEW.id,
      'Notice publication: ' || NEW.title,
      NEW.published_by_user_id
    );

    -- Update notice billing status
    NEW.billing_status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to notices table
DROP TRIGGER IF EXISTS trigger_auto_bill_publication ON notices;
CREATE TRIGGER trigger_auto_bill_publication
  BEFORE INSERT OR UPDATE ON notices
  FOR EACH ROW
  EXECUTE FUNCTION auto_bill_notice_publication();

COMMENT ON FUNCTION auto_bill_notice_publication IS 'Automatically create billing charge when a firm publishes a notice';

-- =============================================================================
-- 5. RLS Policies for billing_transactions
-- =============================================================================

ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

-- Firms can view their own billing transactions
CREATE POLICY "Firms view own billing"
  ON billing_transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Firms can create payment/credit transactions (not charges - those are system-generated)
CREATE POLICY "Firms can create payments"
  ON billing_transactions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
    AND type IN ('payment', 'credit')
  );

-- Only system can create charges (via trigger)
-- Only system can update transactions (e.g., marking payment as succeeded)

-- =============================================================================
-- 6. Helper functions for billing
-- =============================================================================

-- Get account balance for an organization
CREATE OR REPLACE FUNCTION get_account_balance(p_organization_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_balance DECIMAL(10,2);
BEGIN
  SELECT current_balance INTO v_balance
  FROM organization_account_balances
  WHERE organization_id = p_organization_id;

  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_account_balance IS 'Get current account balance for a firm';

-- Record a payment
CREATE OR REPLACE FUNCTION record_payment(
  p_organization_id UUID,
  p_amount DECIMAL(10,2),
  p_payment_intent_id TEXT,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO billing_transactions (
    organization_id,
    type,
    amount,
    payment_intent_id,
    description,
    status,
    created_by
  ) VALUES (
    p_organization_id,
    'payment',
    -ABS(p_amount), -- Negative for payment (reduces balance)
    p_payment_intent_id,
    'Payment received via Stripe',
    'succeeded',
    p_user_id
  )
  RETURNING id INTO v_transaction_id;

  -- Update any pending notices to paid (oldest first)
  UPDATE notices
  SET billing_status = 'paid'
  WHERE published_by_organization_id = p_organization_id
    AND billing_status = 'pending'
    AND id IN (
      SELECT id FROM notices
      WHERE published_by_organization_id = p_organization_id
        AND billing_status = 'pending'
      ORDER BY published_at ASC
      LIMIT (
        SELECT COUNT(*)
        FROM notices
        WHERE published_by_organization_id = p_organization_id
          AND billing_status = 'pending'
          AND billing_amount <= ABS(p_amount)
      )
    );

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_payment IS 'Record a payment and update notice billing statuses';

-- Mark notices as overdue (can be run daily)
CREATE OR REPLACE FUNCTION mark_overdue_billing()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notices
  SET billing_status = 'overdue'
  WHERE billing_status = 'pending'
    AND published_at < NOW() - INTERVAL '30 days'; -- 30 days payment terms

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_overdue_billing IS 'Mark unpaid notices as overdue after 30 days';

-- =============================================================================
-- 7. Audit logging for billing
-- =============================================================================

-- Add billing transactions to audit log
CREATE OR REPLACE FUNCTION audit_billing_transaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    user_id
  ) VALUES (
    'billing_transactions',
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.created_by
      ELSE NEW.created_by
    END
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_billing_transactions
  AFTER INSERT OR UPDATE OR DELETE ON billing_transactions
  FOR EACH ROW
  EXECUTE FUNCTION audit_billing_transaction();

COMMENT ON FUNCTION audit_billing_transaction IS 'Audit all billing transaction changes';
