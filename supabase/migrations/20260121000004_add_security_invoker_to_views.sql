-- Migration: Add security_invoker = true to views
-- Purpose: Make views respect RLS policies of the invoking user (PostgreSQL 15+)
-- Security Finding: Views bypass RLS by default - they run with definer privileges
-- Reference: feat-firm-portal-implementation.md - Security Audit Findings #4

-- Note: security_invoker is a PostgreSQL 15+ feature
-- Supabase uses PostgreSQL 15+, so this is supported

-- =============================================================================
-- 1. firm_clients view (from 20260114000010_client_management.sql)
-- Aggregates client data - needs invoker security for RLS on client_relationships
-- =============================================================================
CREATE OR REPLACE VIEW firm_clients
WITH (security_invoker = true)
AS
SELECT
  cr.id as relationship_id,
  cr.firm_id,
  cr.status as relationship_status,
  cr.notes as relationship_notes,
  cr.created_at as relationship_created_at,
  c.id as client_id,
  c.name as client_name,
  c.slug as client_slug,
  c.type as client_type,
  c.contact_name,
  c.contact_email,
  c.contact_phone,
  c.address,
  c.created_at as client_created_at,
  COALESCE(
    (SELECT COUNT(*) FROM notices WHERE published_by_organization_id = c.id),
    0
  ) as notice_count,
  COALESCE(
    (SELECT COUNT(*) FROM notices WHERE published_by_organization_id = c.id AND status = 'published'),
    0
  ) as active_notice_count
FROM client_relationships cr
JOIN organizations c ON c.id = cr.client_id;

-- =============================================================================
-- 2. organization_subscription_details view (from 20251028000001_subscription_tiers.sql)
-- Shows subscription info - needs invoker security for org membership check
-- =============================================================================
CREATE OR REPLACE VIEW organization_subscription_details
WITH (security_invoker = true)
AS
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

COMMENT ON VIEW organization_subscription_details IS 'Complete subscription and usage information for all organizations (with security_invoker)';

-- =============================================================================
-- 3. organization_account_balances view (from 20251022000002_billing_system.sql)
-- Shows account balances - needs invoker security for billing transaction access
-- =============================================================================
CREATE OR REPLACE VIEW organization_account_balances
WITH (security_invoker = true)
AS
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

COMMENT ON VIEW organization_account_balances IS 'Current account balance summary for all firms (with security_invoker)';

-- =============================================================================
-- 4. active_councils view (from 20260122000001_unified_auth_system.sql)
-- Public view of active councils - safe to use invoker since it's public data
-- =============================================================================
CREATE OR REPLACE VIEW public.active_councils
WITH (security_invoker = true)
AS
SELECT
  o.id,
  o.name,
  o.slug,
  cs.authority_email as email,
  cs.authority_address as address,
  cs.authority_phone as phone,
  o.created_at
FROM organizations o
LEFT JOIN council_settings cs ON cs.organization_id = o.id
WHERE o.type = 'council'
  AND o.status = 'active'
ORDER BY o.name;

-- =============================================================================
-- 5. notice_approval_times view (from 20251122000001_showcase_features_schema.sql)
-- Analytics view - needs invoker security for notice access
-- =============================================================================
CREATE OR REPLACE VIEW notice_approval_times
WITH (security_invoker = true)
AS
SELECT
  n.department_id,
  d.name as department_name,
  COUNT(*) as total_notices,
  AVG(EXTRACT(EPOCH FROM (n.reviewed_at - n.submitted_at)) / 86400) as avg_approval_days,
  MIN(EXTRACT(EPOCH FROM (n.reviewed_at - n.submitted_at)) / 86400) as min_approval_days,
  MAX(EXTRACT(EPOCH FROM (n.reviewed_at - n.submitted_at)) / 86400) as max_approval_days
FROM notices n
LEFT JOIN departments d ON n.department_id = d.id
WHERE n.approval_status = 'approved'
  AND n.reviewed_at IS NOT NULL
  AND n.submitted_at IS NOT NULL
GROUP BY n.department_id, d.name;

-- =============================================================================
-- 6. deadline_adherence view (from 20251122000001_showcase_features_schema.sql)
-- Analytics view - needs invoker security for notice access
-- =============================================================================
CREATE OR REPLACE VIEW deadline_adherence
WITH (security_invoker = true)
AS
SELECT
  n.department_id,
  d.name as department_name,
  COUNT(*) as total_notices,
  COUNT(*) FILTER (WHERE n.published_at <= n.application_date + INTERVAL '28 days') as within_deadline,
  COUNT(*) FILTER (WHERE n.published_at > n.application_date + INTERVAL '28 days') as overdue,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE n.published_at <= n.application_date + INTERVAL '28 days') / NULLIF(COUNT(*), 0),
    1
  ) as adherence_percentage
FROM notices n
LEFT JOIN departments d ON n.department_id = d.id
WHERE n.status = 'published'
  AND n.published_at IS NOT NULL
  AND n.application_date IS NOT NULL
GROUP BY n.department_id, d.name;

-- =============================================================================
-- 7. engagement_rate view (from 20251122000001_showcase_features_schema.sql)
-- Analytics view - needs invoker security for notice/representation access
-- =============================================================================
CREATE OR REPLACE VIEW engagement_rate
WITH (security_invoker = true)
AS
SELECT
  n.council_id,
  c.name as council_name,
  COUNT(DISTINCT n.id) as total_notices,
  COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN n.id END) as notices_with_reps,
  COUNT(r.id) as total_representations,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN n.id END) / NULLIF(COUNT(DISTINCT n.id), 0),
    1
  ) as engagement_percentage
FROM notices n
LEFT JOIN councils c ON n.council_id = c.id
LEFT JOIN representations r ON r.notice_id = n.id
WHERE n.status = 'published'
GROUP BY n.council_id, c.name;

-- =============================================================================
-- Re-grant permissions (views may have lost grants on recreation)
-- =============================================================================
GRANT SELECT ON firm_clients TO authenticated;
GRANT SELECT ON organization_subscription_details TO authenticated;
GRANT SELECT ON organization_account_balances TO authenticated;
GRANT SELECT ON public.active_councils TO authenticated;
GRANT SELECT ON notice_approval_times TO authenticated;
GRANT SELECT ON deadline_adherence TO authenticated;
GRANT SELECT ON engagement_rate TO authenticated;
