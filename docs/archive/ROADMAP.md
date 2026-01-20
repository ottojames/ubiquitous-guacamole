# Public Notice Portal - Publishing Platform Roadmap

**Last Updated**: 22 October 2025 (v2.0 - Simplified Architecture)
**Current Status**: Phase 5 Backend Complete (Database + API) ✅
**Current Commit**: `040a23f` (Phases 1-4 Complete)
**Vision**: A professional multi-tenant publishing platform where solicitors and licensing consultants publish notices that automatically go live and route to the relevant council departments for representation management.

---

## 🎉 PROGRESS UPDATE - Phase 5 Backend (22 Oct 2025)

### ✅ Completed Today

**Database Layer (100% Complete):**
- ✅ Created migration `20251022000001_direct_publishing.sql`
  - Added firm tracking columns to notices table
  - Created notice_access_tokens table for magic links
  - Updated RLS policies for firm/council access
  - Added helper functions for token management
- ✅ Created migration `20251022000002_billing_system.sql`
  - Implemented billing_transactions table with auto-balance triggers
  - Created organization_account_balances view
  - Auto-billing trigger for notice publications
  - Helper functions for payments and overdue marking
- ✅ All migrations tested and applied successfully

**API Layer (100% Complete):**
- ✅ Created `/server/routes/publish.ts` with 4 new endpoints:
  - `POST /api/notices/publish` - Direct publishing (goes live immediately)
  - `GET /api/billing/account` - Account balance & transactions
  - `POST /api/billing/pay` - Payment processing (Stripe placeholder)
  - `GET /api/representations/:noticeId` - Get representations
- ✅ Registered routes in server/index.ts
- ✅ Server restarted and running successfully

**In Progress:**
- ⏳ Frontend integration (PublishSuccessModal, publish flow updates)
- ⏳ Playwright E2E testing

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Assessment](#current-state-assessment)
3. [Target Architecture](#target-architecture)
4. [Phase 5: Direct Publishing Flow](#phase-5-direct-publishing-flow-firm-to-live)
5. [Phase 6: Firm Portal](#phase-6-firm-portal-for-solicitors--consultants)
6. [Phase 7: Council Publication Dashboard](#phase-7-council-publication-dashboard)
7. [Phase 8: Billing & Payments](#phase-8-billing--payments)
8. [Phase 9: Enhanced Compliance & Audit](#phase-9-enhanced-compliance--audit)
9. [Phase 10: Advanced Features](#phase-10-advanced-features)
10. [Phase 11: Production Readiness](#phase-11-production-readiness)
11. [Compliance Considerations](#compliance-considerations)
12. [Technical Implementation Notes](#technical-implementation-notes)
13. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### The Vision

Transform the Public Notice Portal into a **professional publishing platform** where:

1. **Solicitors & Licensing Consultants** (Firms) can:
   - Log in to secure dashboards
   - Publish licensing notices directly (no approval needed)
   - Notices go live **immediately** on the public portal
   - Track all published notices
   - View representations (objections/support) on their notices
   - Manage client portfolios
   - Access billing dashboard (account-based, not per-transaction)

2. **Councils** (Licensing Authorities) can:
   - View all notices published for their department (auto-filtered)
   - See representations made on those notices
   - Manage representation workflow (mark as reviewed/actioned)
   - Track compliance and audit trails
   - No approval workflow needed - firms publish directly

3. **Public Citizens** can:
   - Browse published notices (no changes to current functionality)
   - Submit representations before deadlines
   - Trust that all notices are properly published

### Key Architecture Change

**SIMPLIFIED FLOW** (no approval bottleneck):

```
Firm User publishes notice
  ↓
Notice created in database (status: 'published')
  ↓ (automatic)
Visible on public portal immediately (/notices)
Council sees it in their department dashboard
Public can view and submit representations
  ↓
Council manages representations
Firm can view representations on their notices
```

### Key Principles

✅ **Direct publishing** - No approval bottleneck, notices go live immediately
✅ **Preserve all working code** - Build on, don't rebuild
✅ **Maintain current publish flow** - It works perfectly, just connect it
✅ **Account-based billing** - Ongoing accounts, not per-transaction payments
✅ **Compliance first** - Legal requirements guide architecture
✅ **Council-friendly** - Automatic department filtering, representation management
✅ **Audit everything** - Immutable trail for legal protection
✅ **Progressive enhancement** - Each phase adds value independently

---

## Current State Assessment

### ✅ What's Working (Don't Change)

**Authentication & Multi-Tenancy** (Phases 1-4):
- Magic link authentication (Supabase Auth OTP)
- Organizations table with `council` and `firm` types
- Departments table for council functional divisions
- Two-level RBAC (org + department memberships)
- Team invitations with expiring tokens
- Context switching for users in multiple departments

**Council Portal** (`/c/:orgSlug/:deptSlug/*`):
- Dashboard with stats (total/published/draft/pending/expired notices)
- Notice management (list, create, edit, publish)
- Team management (invite, roles, remove)
- Templates system (department-scoped)
- Settings per department
- Comprehensive audit logging (immutable)

**Public Portal** (`/notices`):
- Notice listing with search/filters
- Notice detail pages
- Representation submission (objections/support)
- Geospatial map view with clustering
- Distance-based sorting

**Database**:
- 9 migrations complete and working
- RLS policies for data isolation
- Audit triggers on all tables
- Auto-expiration logic for notices
- JSONB storage for flexible notice data

**Current Publish Flow** (`/publish/*`):
- Type selection → Upload/OCR → Confirm → Pay
- Address lookup integration
- Postcode validation and geocoding
- PDF/image upload support

### 🔧 What Needs Building

1. **Direct Publishing** - Firms publish notices that go live immediately
2. **Firm Portal** - Dashboard for solicitors/consultants
3. **Council Publication View** - See what's been published for their department
4. **Billing System** - Account-based billing, payment tracking
5. **Client Management** - Firm client portfolio (partially exists)
6. **Representation Access** - Firms can view representations on their notices
7. **Enhanced Notifications** - Email alerts after publishing, representation notifications
8. **Magic Link Access** - After publishing, firm gets link to view notice status

---

## Target Architecture

### User Roles & Workflows

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC CITIZENS                          │
│  • Browse published notices                                     │
│  • Submit representations (objections/support)                  │
│  • No login required                                            │
└─────────────────────────────────────────────────────────────────┘
                                ▲
                                │ (View published notices)
                                │
┌─────────────────────────────────────────────────────────────────┐
│                     COUNCILS (Licensing Authority)               │
│                                                                  │
│  Department Dashboard (/c/:orgSlug/:deptSlug/)                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. PUBLICATIONS VIEW (auto-filtered by department)         │ │
│  │    • All notices published for this department             │ │
│  │    • Licensing dept sees licensing notices only            │ │
│  │    • Planning dept sees planning notices only              │ │
│  │    • Filter by status, date, type                          │ │
│  │    • Search by premises, applicant                         │ │
│  │                                                              │ │
│  │ 2. REPRESENTATIONS MANAGEMENT                               │ │
│  │    • View all representations on department's notices      │ │
│  │    • Filter by notice, status (new/reviewed/actioned)      │ │
│  │    • Mark as reviewed/actioned                             │ │
│  │    • Export for licensing hearings                         │ │
│  │                                                              │ │
│  │ 3. ANALYTICS & REPORTS                                      │ │
│  │    • Publication trends                                     │ │
│  │    • Representation statistics                             │ │
│  │    • Compliance reports                                     │ │
│  │                                                              │ │
│  │ 4. TEAM & AUDIT                                             │ │
│  │    • Team management (invite licensing officers)           │ │
│  │    • Audit log (immutable compliance trail)                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                ▲
                                │ (Notices automatically appear)
                                │
┌─────────────────────────────────────────────────────────────────┐
│              FIRMS (Solicitors / Licensing Consultants)          │
│                                                                  │
│  Firm Dashboard (/f/:orgSlug/)                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. MY PUBLICATIONS                                          │ │
│  │    • All notices published by firm                         │ │
│  │    • Status: published/expired/archived                    │ │
│  │    • View representation count per notice                  │ │
│  │    • Access via magic link after publishing                │ │
│  │                                                              │ │
│  │ 2. NEW PUBLICATION                                          │ │
│  │    • Uses existing publish flow (/publish/*)               │ │
│  │    • Select target council and department                  │ │
│  │    • Fill notice details (existing form)                   │ │
│  │    • Publish immediately (goes live on public portal)      │ │
│  │                                                              │ │
│  │ 3. REPRESENTATIONS VIEW                                     │ │
│  │    • See all representations on firm's notices             │ │
│  │    • Filter by notice, type (objection/support/comment)    │ │
│  │    • Export for client reports                             │ │
│  │                                                              │ │
│  │ 4. CLIENT MANAGEMENT                                        │ │
│  │    • Client list (businesses/individuals)                  │ │
│  │    • Link publications to clients                          │ │
│  │    • Track client publication history                      │ │
│  │                                                              │ │
│  │ 5. BILLING & PAYMENTS                                       │ │
│  │    • Account balance (what's owed)                         │ │
│  │    • Publication history with costs                        │ │
│  │    • Payment history (what's been paid)                    │ │
│  │    • Make payments (Stripe integration)                    │ │
│  │    • Download invoices                                      │ │
│  │                                                              │ │
│  │ 6. TEAM                                                      │ │
│  │    • Team management (invite consultants)                  │ │
│  │    • Role-based permissions                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. Firm Publishes Notice:**
```
Firm User (solicitor)
  → /publish/* (existing flow)
  → Selects target council + department
  → Fills notice form
  → Clicks "Publish Notice"
  → Creates notice in notices table
      • status = 'published'
      • organization_id = firm's ID (new field)
      • department_id = target licensing dept
      • council_id = target council
      • published_by = user ID
      • published_at = NOW()
      • Auto-triggers set: expires_at, representation_deadline
  → Notice IMMEDIATELY visible on /notices (public portal)
  → Council sees it in their department dashboard
  → Firm receives magic link to view notice status
  → Creates billing record (firm's account charged)
```

**2. Public Views & Responds:**
```
Public Citizen
  → /notices (existing - no changes)
  → Sees newly published notice
  → Clicks notice to view details
  → Submits representation before deadline
  → Representation saved to representations table
      • Visible to council in their dashboard
      • Visible to firm in their portal
```

**3. Council Manages Publications:**
```
Council Officer (Licensing Dept)
  → /c/:orgSlug/:deptSlug/publications (new page)
  → Sees all notices published for licensing department
  → Filters by date, status, firm, notice type
  → Clicks notice to view details + representations
  → Can see:
      • Full notice details
      • Who published it (firm name)
      • All representations received
      • Representation timeline
  → Marks representations as reviewed/actioned
  → Uses in licensing decision process
```

**4. Firm Views Representations:**
```
Firm User
  → /f/:orgSlug/publications (new page)
  → Sees all notices they've published
  → Clicks notice to view details
  → Can see:
      • Full notice details
      • Representation count
      • All representations (objections/support)
      • Representation timeline
  → Advises client on objections received
```

---

## Phase 5: Direct Publishing Flow (Firm to Live)

**Goal**: Enable firms to publish notices that go live immediately and appear in council dashboards.

### Database Changes

**1. Modify `notices` table** (add firm tracking)

```sql
-- Add firm/organization tracking to notices table
ALTER TABLE notices ADD COLUMN IF NOT EXISTS published_by_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS published_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Add billing tracking
ALTER TABLE notices ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'pending' CHECK (billing_status IN ('pending', 'paid', 'overdue', 'waived'));
ALTER TABLE notices ADD COLUMN IF NOT EXISTS billing_amount DECIMAL(10,2);

-- Add indexes
CREATE INDEX idx_notices_published_by_org ON notices(published_by_organization_id) WHERE published_by_organization_id IS NOT NULL;
CREATE INDEX idx_notices_council_dept ON notices(organization_id, department_id);
CREATE INDEX idx_notices_billing_status ON notices(billing_status) WHERE billing_status = 'pending';

-- Comments for clarity
COMMENT ON COLUMN notices.published_by_organization_id IS 'Firm that published this notice (NULL if published by council directly)';
COMMENT ON COLUMN notices.organization_id IS 'Target council (licensing authority)';
COMMENT ON COLUMN notices.department_id IS 'Target department within council';
```

**2. Create `billing_transactions` table**

```sql
CREATE TABLE billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Firm account
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('charge', 'payment', 'refund', 'adjustment', 'credit')),
  amount DECIMAL(10,2) NOT NULL, -- Positive for charges, negative for payments
  balance_after DECIMAL(10,2) NOT NULL, -- Running balance

  -- Related records
  notice_id UUID REFERENCES notices(id) ON DELETE SET NULL,
  payment_intent_id TEXT, -- Stripe payment intent ID

  -- Description
  description TEXT NOT NULL,
  notes TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Status for payments
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  -- Invoice reference
  invoice_number TEXT
);

CREATE INDEX idx_billing_transactions_org ON billing_transactions(organization_id);
CREATE INDEX idx_billing_transactions_created_at ON billing_transactions(created_at);
CREATE INDEX idx_billing_transactions_type ON billing_transactions(type);
CREATE INDEX idx_billing_transactions_notice ON billing_transactions(notice_id) WHERE notice_id IS NOT NULL;

-- Trigger to maintain running balance
CREATE OR REPLACE FUNCTION update_billing_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Get current balance for organization
  SELECT COALESCE(SUM(amount), 0)
  INTO current_balance
  FROM billing_transactions
  WHERE organization_id = NEW.organization_id
    AND created_at < NEW.created_at;

  NEW.balance_after = current_balance + NEW.amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_billing_balance
  BEFORE INSERT ON billing_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_balance();

-- View for current account balances
CREATE OR REPLACE VIEW organization_account_balances AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  COALESCE(SUM(bt.amount), 0) AS current_balance,
  COUNT(CASE WHEN bt.type = 'charge' AND bt.status IS NULL THEN 1 END) AS unpaid_charges,
  MAX(bt.created_at) AS last_transaction_date
FROM organizations o
LEFT JOIN billing_transactions bt ON o.id = bt.organization_id
WHERE o.type = 'firm'
GROUP BY o.id, o.name;
```

**3. Update RLS Policies**

```sql
-- Firms can only see their own published notices
CREATE POLICY "Firms can view own published notices"
  ON notices FOR SELECT
  USING (
    published_by_organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Councils can see notices published to their departments
CREATE POLICY "Councils can view department notices"
  ON notices FOR SELECT
  USING (
    department_id IN (
      SELECT department_id FROM department_memberships
      WHERE user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'org_admin')
    )
  );

-- Firms can create notices (publish)
CREATE POLICY "Firms can publish notices"
  ON notices FOR INSERT
  WITH CHECK (
    published_by_organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Billing transactions - firms can view own
CREATE POLICY "Firms view own billing"
  ON billing_transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Firms can create payment transactions
CREATE POLICY "Firms can create payments"
  ON billing_transactions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
    AND type IN ('payment', 'credit')
  );
```

**4. Trigger for automatic billing**

```sql
-- Auto-create billing charge when notice published by firm
CREATE OR REPLACE FUNCTION auto_bill_notice_publication()
RETURNS TRIGGER AS $$
BEGIN
  -- Only bill if published by a firm (not by council directly)
  IF NEW.published_by_organization_id IS NOT NULL AND NEW.status = 'published' THEN
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
      COALESCE(NEW.billing_amount, 150.00), -- Default £150, configurable
      NEW.id,
      'Notice publication: ' || NEW.title,
      NEW.published_by_user_id
    );

    UPDATE notices
    SET billing_status = 'pending'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_bill_publication
  AFTER INSERT ON notices
  FOR EACH ROW
  EXECUTE FUNCTION auto_bill_notice_publication();
```

### Backend Changes

**New API Endpoints**

**1. `/api/notices/publish` (POST)** - Direct publish for firms

Location: `/server/routes/notices.ts`

```typescript
router.post('/notices/publish', async (req, res) => {
  const {
    target_council_id,
    target_department_id,
    notice_data,
    notice_type,
    title,
    client_id,
    billing_amount = 150.00 // Default cost
  } = req.body;

  // Validation
  if (!target_council_id || !target_department_id || !notice_data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get user's organization (must be firm)
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id, organization:organizations(type)')
    .eq('user_id', req.user.id)
    .single();

  if (!membership || membership.organization.type !== 'firm') {
    return res.status(403).json({ error: 'Only firms can publish via this endpoint' });
  }

  // Verify target council and department exist
  const { data: department } = await supabase
    .from('departments')
    .select('id, organization_id')
    .eq('id', target_department_id)
    .eq('organization_id', target_council_id)
    .single();

  if (!department) {
    return res.status(404).json({ error: 'Department not found' });
  }

  // Create published notice (goes live immediately)
  const { data: notice, error } = await supabase
    .from('notices')
    .insert({
      organization_id: target_council_id,
      department_id: target_department_id,
      published_by_organization_id: membership.organization_id,
      published_by_user_id: req.user.id,
      client_id,
      title,
      notice_type,
      status: 'published', // Goes live immediately
      description: notice_data.description || null,
      premises: notice_data.premises,
      applicant: notice_data.applicant,
      consultation: notice_data.consultation,
      licensing: notice_data.licensing,
      extras: notice_data.extras,
      billing_amount,
      billing_status: 'pending',
      // Auto-triggers will set: published_at, expires_at, representation_deadline
    })
    .select()
    .single();

  if (error) {
    console.error('[notice-publish] Error:', error);
    return res.status(500).json({ error: 'Failed to publish notice' });
  }

  // Generate magic link for firm to view their notice
  const magicToken = generateSecureToken();
  await supabase.from('notice_access_tokens').insert({
    notice_id: notice.id,
    token: magicToken,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    created_for: req.user.id
  });

  const magicLink = `${process.env.APP_URL}/notices/${notice.id}?token=${magicToken}`;

  // Send email notification to firm
  await sendPublicationConfirmationEmail({
    to: req.user.email,
    noticeName: title,
    councilName: department.organization.name,
    magicLink,
    noticeUrl: `${process.env.APP_URL}/notices/${notice.id}`
  });

  // Send notification to council department
  await sendCouncilNotificationEmail({
    departmentId: target_department_id,
    noticeName: title,
    firmName: membership.organization.name,
    noticeUrl: `${process.env.APP_URL}/c/[...]/publications/${notice.id}`
  });

  return res.json({
    notice,
    magicLink,
    message: 'Notice published successfully'
  });
});
```

**2. `/api/billing/account` (GET)** - Get account balance

```typescript
router.get('/billing/account', async (req, res) => {
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', req.user.id)
    .single();

  if (!membership) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  // Get account balance
  const { data: balance } = await supabase
    .from('organization_account_balances')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .single();

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('billing_transactions')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false })
    .limit(50);

  return res.json({
    balance: balance?.current_balance || 0,
    unpaid_charges: balance?.unpaid_charges || 0,
    transactions
  });
});
```

**3. `/api/billing/pay` (POST)** - Make payment via Stripe

```typescript
router.post('/billing/pay', async (req, res) => {
  const { amount, payment_method } = req.body;

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id, organization:organizations(name, contact_email)')
    .eq('user_id', req.user.id)
    .single();

  if (!membership) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to pence
    currency: 'gbp',
    payment_method,
    confirm: true,
    metadata: {
      organization_id: membership.organization_id,
      user_id: req.user.id
    }
  });

  if (paymentIntent.status === 'succeeded') {
    // Record payment in billing_transactions
    await supabase.from('billing_transactions').insert({
      organization_id: membership.organization_id,
      type: 'payment',
      amount: -amount, // Negative for payment (reduces balance)
      payment_intent_id: paymentIntent.id,
      description: `Payment received - Stripe`,
      status: 'succeeded',
      created_by: req.user.id
    });

    // Update any pending notices to paid
    await supabase
      .from('notices')
      .update({ billing_status: 'paid' })
      .eq('published_by_organization_id', membership.organization_id)
      .eq('billing_status', 'pending')
      .lte('billing_amount', amount);
  }

  return res.json({ paymentIntent });
});
```

**4. `/api/representations/:noticeId` (GET)** - Get representations for a notice

```typescript
router.get('/representations/:noticeId', async (req, res) => {
  const { noticeId } = req.params;

  // Check if user has access to this notice
  // (either published by their firm or they're in the target council)
  const { data: notice } = await supabase
    .from('notices')
    .select('published_by_organization_id, organization_id, department_id')
    .eq('id', noticeId)
    .single();

  if (!notice) {
    return res.status(404).json({ error: 'Notice not found' });
  }

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id, role')
    .eq('user_id', req.user.id);

  const userOrgIds = membership?.map(m => m.organization_id) || [];
  const hasAccess =
    userOrgIds.includes(notice.published_by_organization_id) || // Firm that published
    userOrgIds.includes(notice.organization_id); // Target council

  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get representations
  const { data: representations } = await supabase
    .from('representations')
    .select('*')
    .eq('notice_id', noticeId)
    .order('created_at', { ascending: false });

  return res.json({ representations });
});
```

### Frontend Changes

**1. Modify Publish Flow**

Update `/src/pages/PublishPage.tsx` (or final step of wizard) to:

1. Add council/department selector (if not already present)
2. Add client selector (optional)
3. On submit, call `/api/notices/publish` instead of old endpoint
4. Show success message with magic link
5. Redirect to firm dashboard

```typescript
// In publish flow final step
async function handlePublish() {
  const payload = {
    target_council_id: selectedCouncil,
    target_department_id: selectedDepartment,
    notice_data: {
      premises: formData.premises,
      applicant: formData.applicant,
      consultation: formData.consultation,
      licensing: formData.licensing,
      extras: formData.extras,
      description: formData.description
    },
    notice_type: formData.noticeType,
    title: formData.title,
    client_id: selectedClient,
    billing_amount: calculateCost(formData) // Based on notice type
  };

  const response = await fetch('/api/notices/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    const data = await response.json();

    // Show success message with magic link
    setPublishedNotice(data.notice);
    setMagicLink(data.magicLink);
    setShowSuccessModal(true);
  }
}
```

**2. Success Modal** (after publishing)

```typescript
function PublishSuccessModal({ notice, magicLink, onClose }) {
  const [copied, setCopied] = useState(false);

  function copyMagicLink() {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4">
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Notice Published!
            </h2>
            <p className="text-slate-600">
              Your notice is now live on the public portal
            </p>
          </div>

          {/* Notice Details */}
          <div className="bg-slate-50 rounded-xl p-6 text-left">
            <h3 className="font-semibold text-slate-900 mb-3">{notice.title}</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong>Council:</strong> {notice.council_name}</p>
              <p><strong>Department:</strong> {notice.department_name}</p>
              <p><strong>Published:</strong> {formatDate(notice.published_at)}</p>
              <p><strong>Representation Deadline:</strong> {formatDate(notice.representation_deadline)}</p>
            </div>
          </div>

          {/* Magic Link */}
          <div>
            <p className="text-sm text-slate-600 mb-3">
              <strong>Save this link to view your notice status and representations:</strong>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={magicLink}
                readOnly
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-white text-sm"
              />
              <button
                onClick={copyMagicLink}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              We've also emailed this link to you
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => window.open(`/notices/${notice.id}`, '_blank')}
              className="flex-1 px-6 py-3 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50"
            >
              View Public Notice
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 6: Firm Portal (for Solicitors & Consultants)

**Goal**: Create a dedicated portal for firms to manage publications, clients, and billing.

### Routing

Add to `/src/App.tsx`:

```typescript
<Route path="/f/:orgSlug" element={<FirmLayout />}>
  <Route path="dashboard" element={<FirmDashboard />} />
  <Route path="publications" element={<FirmPublications />} />
  <Route path="publications/:noticeId" element={<PublicationDetail />} />
  <Route path="new-publication" element={<NewPublication />} />
  <Route path="clients" element={<ClientManagement />} />
  <Route path="clients/:clientId" element={<ClientDetail />} />
  <Route path="billing" element={<BillingDashboard />} />
  <Route path="team" element={<Team />} /> {/* Reuse council Team component */}
  <Route path="settings" element={<Settings />} />
</Route>
```

### Components

**1. FirmLayout.tsx**

```typescript
export default function FirmLayout() {
  const { orgSlug } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [accountBalance, setAccountBalance] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      // Load organization
      const orgResponse = await fetch(`/api/organizations/${orgSlug}`);
      const orgData = await orgResponse.json();
      setOrganization(orgData);

      // Load account balance
      const balanceResponse = await fetch('/api/billing/account');
      const balanceData = await balanceResponse.json();
      setAccountBalance(balanceData.balance);
    }
    loadData();
  }, [orgSlug]);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200">
        <div className="p-6">
          <h1 className="text-xl font-bold text-slate-900">
            {organization?.name}
          </h1>
          <p className="text-sm text-slate-500">Law Firm</p>

          {/* Account Balance Alert */}
          {accountBalance > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs font-semibold text-orange-900">
                Account Balance
              </p>
              <p className="text-lg font-bold text-orange-900">
                £{accountBalance.toFixed(2)}
              </p>
              <Link
                to={`/f/${orgSlug}/billing`}
                className="text-xs text-orange-700 hover:text-orange-800 underline"
              >
                Make Payment →
              </Link>
            </div>
          )}
        </div>

        <nav className="space-y-1 px-3">
          <NavLink to={`/f/${orgSlug}/dashboard`}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </NavLink>
          <NavLink to={`/f/${orgSlug}/publications`}>
            <FileText className="w-5 h-5" />
            My Publications
          </NavLink>
          <NavLink to={`/f/${orgSlug}/new-publication`}>
            <Plus className="w-5 h-5" />
            Publish Notice
          </NavLink>
          <NavLink to={`/f/${orgSlug}/clients`}>
            <Users className="w-5 h-5" />
            Clients
          </NavLink>
          <NavLink to={`/f/${orgSlug}/billing`}>
            <CreditCard className="w-5 h-5" />
            Billing
            {accountBalance > 0 && (
              <span className="ml-auto bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded">
                £{accountBalance.toFixed(0)}
              </span>
            )}
          </NavLink>
          <NavLink to={`/f/${orgSlug}/team`}>
            <UserPlus className="w-5 h-5" />
            Team
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet context={{ organization, orgSlug, accountBalance }} />
      </main>
    </div>
  );
}
```

**2. FirmDashboard.tsx**

```typescript
export default function FirmDashboard() {
  const { orgSlug, accountBalance } = useOutletContext<{ orgSlug: string; accountBalance: number }>();
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    expired: 0,
    total_representations: 0
  });
  const [recentPublications, setRecentPublications] = useState([]);

  useEffect(() => {
    async function loadData() {
      // Load stats
      const statsResponse = await fetch('/api/notices/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Load recent publications
      const pubsResponse = await fetch('/api/notices?limit=5&published_by=firm');
      const pubsData = await pubsResponse.json();
      setRecentPublications(pubsData.notices);
    }
    loadData();
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Track your publications and account</p>
      </div>

      {/* Account Balance Alert (if overdue) */}
      {accountBalance > 500 && (
        <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-orange-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-1">
                Payment Required
              </h3>
              <p className="text-orange-800 mb-3">
                Your account balance is £{accountBalance.toFixed(2)}. Please make a payment to avoid service interruption.
              </p>
              <Link
                to={`/f/${orgSlug}/billing`}
                className="inline-block bg-orange-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-orange-700"
              >
                Make Payment
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          title="Total Publications"
          value={stats.total}
          icon={FileText}
          color="blue"
          linkTo={`/f/${orgSlug}/publications`}
        />
        <StatCard
          title="Published"
          value={stats.published}
          icon={CheckCircle}
          color="green"
          linkTo={`/f/${orgSlug}/publications?status=published`}
        />
        <StatCard
          title="Expired"
          value={stats.expired}
          icon={Clock}
          color="gray"
          linkTo={`/f/${orgSlug}/publications?status=expired`}
        />
        <StatCard
          title="Total Representations"
          value={stats.total_representations}
          icon={MessageSquare}
          color="purple"
          linkTo={`/f/${orgSlug}/publications?filter=has_representations`}
        />
      </div>

      {/* Recent Publications */}
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Recent Publications
          </h2>
          <Link
            to={`/f/${orgSlug}/publications`}
            className="text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
        </div>

        <div className="space-y-4">
          {recentPublications.map(notice => (
            <Link
              key={notice.id}
              to={`/f/${orgSlug}/publications/${notice.id}`}
              className="block p-4 border border-slate-200 rounded-xl hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{notice.title}</h3>
                  <p className="text-sm text-slate-600">
                    {notice.council_name} • {notice.notice_type}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Published {formatDate(notice.published_at)}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={notice.status} />
                  {notice.representation_count > 0 && (
                    <p className="text-sm text-slate-600 mt-2">
                      {notice.representation_count} representation{notice.representation_count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-6">
        <QuickActionCard
          title="Publish Notice"
          description="Submit a new licensing notice"
          icon={Plus}
          linkTo={`/f/${orgSlug}/new-publication`}
          color="blue"
        />
        <QuickActionCard
          title="Manage Clients"
          description="View and edit client information"
          icon={Users}
          linkTo={`/f/${orgSlug}/clients`}
          color="green"
        />
        <QuickActionCard
          title="View Billing"
          description="Account balance and payments"
          icon={CreditCard}
          linkTo={`/f/${orgSlug}/billing`}
          color="purple"
        />
      </div>
    </div>
  );
}
```

**3. FirmPublications.tsx**

Similar to previous roadmap but simpler (no submission statuses):

```typescript
export default function FirmPublications() {
  const { orgSlug } = useOutletContext<{ orgSlug: string }>();
  const [publications, setPublications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadPublications() {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('published_by', 'firm');

      const response = await fetch(`/api/notices?${params}`);
      const data = await response.json();
      setPublications(data.notices);
    }
    loadPublications();
  }, [statusFilter]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Publications</h1>
          <p className="text-slate-600">All notices published by your firm</p>
        </div>
        <Link
          to={`/f/${orgSlug}/new-publication`}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          Publish Notice
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search publications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="expired">Expired</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Publications Grid */}
      <div className="grid gap-4">
        {publications.map(notice => (
          <PublicationCard key={notice.id} notice={notice} orgSlug={orgSlug} />
        ))}
      </div>
    </div>
  );
}
```

**4. PublicationDetail.tsx** (with representations)

```typescript
export default function PublicationDetail() {
  const { orgSlug, noticeId } = useParams();
  const [notice, setNotice] = useState(null);
  const [representations, setRepresentations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Load notice
      const noticeResponse = await fetch(`/api/notices/${noticeId}`);
      const noticeData = await noticeResponse.json();
      setNotice(noticeData);

      // Load representations
      const repsResponse = await fetch(`/api/representations/${noticeId}`);
      const repsData = await repsResponse.json();
      setRepresentations(repsData.representations);

      setLoading(false);
    }
    loadData();
  }, [noticeId]);

  if (loading) return <LoadingSpinner />;
  if (!notice) return <NotFound />;

  const objectionsCount = representations.filter(r => r.type === 'objection').length;
  const supportCount = representations.filter(r => r.type === 'support').length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/f/${orgSlug}/publications`}
          className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
        >
          ← Back to publications
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">{notice.title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <StatusBadge status={notice.status} size="large" />
          <span className="text-slate-600">
            Published {formatDate(notice.published_at)}
          </span>
        </div>
      </div>

      {/* Publication Info */}
      <div className="grid grid-cols-2 gap-6">
        <InfoCard
          title="Licensing Authority"
          icon={Building2}
          items={[
            { label: "Council", value: notice.council_name },
            { label: "Department", value: notice.department_name }
          ]}
        />
        <InfoCard
          title="Publication Details"
          icon={FileText}
          items={[
            { label: "Type", value: notice.notice_type },
            { label: "Published", value: formatDate(notice.published_at) },
            { label: "Deadline", value: formatDate(notice.representation_deadline) },
            { label: "Expires", value: formatDate(notice.expires_at) }
          ]}
        />
      </div>

      {/* Notice Data */}
      <div className="bg-white rounded-3xl shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-semibold text-slate-900">Notice Details</h2>
        <NoticeDataDisplay data={notice} />
      </div>

      {/* Representations */}
      <div className="bg-white rounded-3xl shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Representations ({representations.length})
            </h2>
            <p className="text-sm text-slate-600">
              Public feedback on this notice
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
              {objectionsCount} Objection{objectionsCount !== 1 ? 's' : ''}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
              {supportCount} Support
            </span>
          </div>
        </div>

        {representations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No representations yet"
            description="No public feedback has been submitted for this notice"
          />
        ) : (
          <div className="space-y-4">
            {representations.map(rep => (
              <RepresentationCard key={rep.id} representation={rep} />
            ))}
          </div>
        )}

        {/* Export Button */}
        {representations.length > 0 && (
          <button
            onClick={() => exportRepresentations(noticeId)}
            className="w-full px-6 py-3 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50"
          >
            <Download className="w-5 h-5 inline mr-2" />
            Export Representations (CSV)
          </button>
        )}
      </div>

      {/* Public View Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExternalLink className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">
                Public Notice Page
              </h3>
              <p className="text-blue-700 text-sm">
                View how this appears to the public
              </p>
            </div>
          </div>
          <Link
            to={`/notices/${notice.id}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
            target="_blank"
          >
            View Public Notice →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**5. BillingDashboard.tsx**

```typescript
export default function BillingDashboard() {
  const { orgSlug, accountBalance } = useOutletContext<{ orgSlug: string; accountBalance: number }>();
  const [transactions, setTransactions] = useState([]);
  const [unpaidNotices, setUnpaidNotices] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBillingData() {
      const response = await fetch('/api/billing/account');
      const data = await response.json();

      setTransactions(data.transactions);
      setAccountBalance(data.balance);

      // Load unpaid notices
      const noticesResponse = await fetch('/api/notices?billing_status=pending');
      const noticesData = await noticesResponse.json();
      setUnpaidNotices(noticesData.notices);

      setLoading(false);
    }
    loadBillingData();
  }, []);

  async function handlePayment() {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Redirect to Stripe Checkout or use Payment Element
    const response = await fetch('/api/billing/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();

    if (data.paymentIntent) {
      // Handle successful payment
      alert('Payment successful!');
      window.location.reload();
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Billing & Payments</h1>
        <p className="text-slate-600">Manage your account balance and payments</p>
      </div>

      {/* Account Balance Card */}
      <div className={`rounded-3xl p-8 ${
        accountBalance > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-600 mb-2">Current Balance</h2>
            <p className={`text-5xl font-bold ${
              accountBalance > 0 ? 'text-orange-900' : 'text-green-900'
            }`}>
              £{accountBalance.toFixed(2)}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              {accountBalance > 0 ? 'Payment required' : 'Account in good standing'}
            </p>
          </div>

          {accountBalance > 0 && (
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Amount to pay"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-64 px-4 py-3 border border-slate-300 rounded-lg"
                min="0"
                step="0.01"
              />
              <button
                onClick={handlePayment}
                className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700"
              >
                Make Payment
              </button>
              <button
                onClick={() => setPaymentAmount(accountBalance.toFixed(2))}
                className="w-full text-sm text-orange-700 hover:text-orange-800"
              >
                Pay full balance
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unpaid Publications */}
      {unpaidNotices.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Unpaid Publications ({unpaidNotices.length})
          </h2>
          <div className="space-y-3">
            {unpaidNotices.map(notice => (
              <div key={notice.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                <div>
                  <h3 className="font-semibold text-slate-900">{notice.title}</h3>
                  <p className="text-sm text-slate-600">
                    Published {formatDate(notice.published_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    £{notice.billing_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">Pending</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Transaction History
          </h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            Download CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr className="text-left text-sm text-slate-600">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium text-right">Amount</th>
                <th className="pb-3 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map(tx => (
                <tr key={tx.id} className="text-sm">
                  <td className="py-3 text-slate-600">
                    {formatDate(tx.created_at)}
                  </td>
                  <td className="py-3 text-slate-900">
                    {tx.description}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      tx.type === 'charge' ? 'bg-orange-100 text-orange-800' :
                      tx.type === 'payment' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`py-3 text-right font-semibold ${
                    tx.amount > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}£{Math.abs(tx.amount).toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-slate-900">
                    £{tx.balance_after.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          Payment Information
        </h3>
        <p className="text-blue-800 text-sm mb-4">
          We accept all major credit and debit cards. Payments are processed securely via Stripe.
        </p>
        <div className="flex gap-4">
          <img src="/visa.svg" alt="Visa" className="h-8" />
          <img src="/mastercard.svg" alt="Mastercard" className="h-8" />
          <img src="/amex.svg" alt="Amex" className="h-8" />
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 7: Council Publication Dashboard

**Goal**: Enable councils to see publications for their department and manage representations.

### New Council Portal Pages

**1. Publications.tsx** (replaces old Submissions.tsx concept)

Location: `/src/pages/council/Publications.tsx`

```typescript
export default function Publications() {
  const { orgSlug, deptSlug } = useParams();
  const basePath = `/c/${orgSlug}/${deptSlug}`;

  const [publications, setPublications] = useState([]);
  const [statusFilter, setStatusFilter] = useState<string>('published');
  const [searchQuery, setSearchQuery] = useState('');

  const [stats, setStats] = useState({
    published: 0,
    total_representations: 0,
    new_representations: 0,
    expired: 0
  });

  useEffect(() => {
    async function loadPublications() {
      // Loads notices published to this department
      const params = new URLSearchParams();
      params.set('department_id', deptSlug); // Backend resolves to ID
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/notices?${params}`);
      const data = await response.json();
      setPublications(data.notices);
    }

    async function loadStats() {
      const response = await fetch(`/api/notices/stats?department=${deptSlug}`);
      const data = await response.json();
      setStats(data);
    }

    loadPublications();
    loadStats();
  }, [deptSlug, statusFilter]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Publications</h1>
        <p className="text-slate-600">
          Notices published for {deptSlug.replace('-', ' ')} department
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          title="Published Notices"
          value={stats.published}
          icon={FileText}
          color="green"
          onClick={() => setStatusFilter('published')}
          active={statusFilter === 'published'}
        />
        <StatCard
          title="Total Representations"
          value={stats.total_representations}
          icon={MessageSquare}
          color="purple"
          linkTo={`${basePath}/representations`}
        />
        <StatCard
          title="New Representations"
          value={stats.new_representations}
          icon={Inbox}
          color="blue"
          linkTo={`${basePath}/representations?status=new`}
        />
        <StatCard
          title="Expired Notices"
          value={stats.expired}
          icon={Clock}
          color="gray"
          onClick={() => setStatusFilter('expired')}
          active={statusFilter === 'expired'}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by title, premises, or applicant..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
        />
      </div>

      {/* Publications List */}
      <div className="space-y-4">
        {publications.map(notice => (
          <Link
            key={notice.id}
            to={`${basePath}/publications/${notice.id}`}
            className="block bg-white rounded-3xl shadow-sm p-6 hover:shadow-xl transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {notice.title}
                  </h3>
                  <StatusBadge status={notice.status} />
                  {notice.representation_count > 0 && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                      {notice.representation_count} representation{notice.representation_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                  <div>
                    <p className="font-medium text-slate-900">Published by</p>
                    <p>{notice.published_by_organization?.name || 'Direct'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Notice Type</p>
                    <p>{notice.notice_type}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Published</p>
                    <p>{formatDate(notice.published_at)} ({daysAgo(notice.published_at)})</p>
                  </div>
                </div>

                {notice.representation_deadline && (
                  <div className="mt-3 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Representation deadline: {formatDate(notice.representation_deadline)}
                    {new Date(notice.representation_deadline) > new Date() && (
                      <span className="ml-2 text-green-600 font-semibold">
                        ({daysRemaining(notice.representation_deadline)} days remaining)
                      </span>
                    )}
                  </div>
                )}
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>
        ))}
      </div>

      {publications.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No publications"
          description={`No ${statusFilter} publications for this department`}
        />
      )}
    </div>
  );
}
```

**2. PublicationViewer.tsx** (for councils to view notice + reps)

Location: `/src/pages/council/PublicationViewer.tsx`

```typescript
export default function PublicationViewer() {
  const { orgSlug, deptSlug, noticeId } = useParams();
  const basePath = `/c/${orgSlug}/${deptSlug}`;

  const [notice, setNotice] = useState(null);
  const [representations, setRepresentations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Load notice
      const noticeResponse = await fetch(`/api/notices/${noticeId}`);
      const noticeData = await noticeResponse.json();
      setNotice(noticeData);

      // Load representations
      const repsResponse = await fetch(`/api/representations/${noticeId}`);
      const repsData = await repsResponse.json();
      setRepresentations(repsData.representations);

      setLoading(false);
    }
    loadData();
  }, [noticeId]);

  if (loading) return <LoadingSpinner />;
  if (!notice) return <NotFound />;

  const objectionsCount = representations.filter(r => r.type === 'objection').length;
  const supportCount = representations.filter(r => r.type === 'support').length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`${basePath}/publications`}
          className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
        >
          ← Back to publications
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">{notice.title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <StatusBadge status={notice.status} size="large" />
          <span className="text-slate-600">
            Published {formatDate(notice.published_at)}
          </span>
        </div>
      </div>

      {/* Publisher Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
        <div className="flex items-start gap-4">
          <Building2 className="w-6 h-6 text-blue-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">
              Published by {notice.published_by_organization?.name || 'Direct Publication'}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium">Published</p>
                <p>{formatDate(notice.published_at)}</p>
              </div>
              <div>
                <p className="font-medium">Representation Deadline</p>
                <p>{formatDate(notice.representation_deadline)}</p>
              </div>
              <div>
                <p className="font-medium">Expires</p>
                <p>{formatDate(notice.expires_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Data */}
      <div className="bg-white rounded-3xl shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-semibold text-slate-900">Notice Details</h2>
        <NoticeDataDisplay data={notice} />
      </div>

      {/* Representations */}
      <div className="bg-white rounded-3xl shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Representations ({representations.length})
            </h2>
            <p className="text-sm text-slate-600">
              Public feedback on this notice
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
              {objectionsCount} Objection{objectionsCount !== 1 ? 's' : ''}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
              {supportCount} Support
            </span>
          </div>
        </div>

        {representations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No representations yet"
            description="No public feedback has been submitted for this notice"
          />
        ) : (
          <div className="space-y-4">
            {representations.map(rep => (
              <RepresentationCard
                key={rep.id}
                representation={rep}
                onMarkReviewed={() => markAsReviewed(rep.id)}
                onMarkActioned={() => markAsActioned(rep.id)}
              />
            ))}
          </div>
        )}

        {/* Export Button */}
        {representations.length > 0 && (
          <button
            onClick={() => exportRepresentations(noticeId)}
            className="w-full px-6 py-3 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50"
          >
            <Download className="w-5 h-5 inline mr-2" />
            Export Representations (CSV)
          </button>
        )}
      </div>

      {/* Public View Link */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExternalLink className="w-6 h-6 text-slate-600" />
            <div>
              <h3 className="font-semibold text-slate-900">
                Public Notice Page
              </h3>
              <p className="text-slate-600 text-sm">
                View how this appears to the public
              </p>
            </div>
          </div>
          <Link
            to={`/notices/${notice.id}`}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800"
            target="_blank"
          >
            View Public Notice →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**3. Representations.tsx** (enhanced from Phase 1)

Already exists from commit `80e372b`, enhance to add:
- Filter by notice
- Filter by status (new/reviewed/actioned)
- Search by respondent/email/comment
- Export functionality
- Mark as reviewed/actioned actions

### Update CouncilLayout Navigation

Replace "Notices" with "Publications" in sidebar:

```typescript
<NavLink to={`${basePath}/publications`}>
  <FileText className="w-5 h-5" />
  Publications
  {newRepresentationsCount > 0 && (
    <span className="ml-auto bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
      {newRepresentationsCount} new
    </span>
  )}
</NavLink>

<NavLink to={`${basePath}/representations`}>
  <MessageSquare className="w-5 h-5" />
  Representations
</NavLink>
```

### Add Routes

Update `/src/App.tsx`:

```typescript
<Route path="/c/:orgSlug/:deptSlug" element={<CouncilLayout />}>
  {/* ... existing routes ... */}
  <Route path="publications" element={<Publications />} />
  <Route path="publications/:noticeId" element={<PublicationViewer />} />
  <Route path="representations" element={<Representations />} />
</Route>
```

---

## Phase 8: Billing & Payments

**Goal**: Implement Stripe payment processing and invoice generation.

### Stripe Integration

**1. Setup Stripe**

```bash
npm install stripe @stripe/stripe-js
```

**2. Backend Payment Processing**

Already covered in Phase 5 with `/api/billing/pay` endpoint. Add:

**Invoice Generation** (`/server/services/invoicing.ts`):

```typescript
import PDFDocument from 'pdfkit';
import { supabase } from '../lib/supabase';

export async function generateInvoice(organizationId: string, month: string): Promise<Buffer> {
  // Get organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('name, contact_email, address')
    .eq('id', organizationId)
    .single();

  // Get transactions for month
  const { data: transactions } = await supabase
    .from('billing_transactions')
    .select('*, notice:notices(title)')
    .eq('organization_id', organizationId)
    .gte('created_at', `${month}-01`)
    .lt('created_at', new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)).toISOString());

  // Create PDF
  const doc = new PDFDocument();
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Header
  doc.fontSize(20).text('Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`For: ${org.name}`);
  doc.text(`Period: ${month}`);
  doc.moveDown();

  // Table
  doc.fontSize(10);
  transactions?.forEach(tx => {
    doc.text(`${tx.description}: £${tx.amount.toFixed(2)}`);
  });

  doc.moveDown();
  const total = transactions?.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) || 0;
  doc.fontSize(12).text(`Total: £${total.toFixed(2)}`, { align: 'right' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
```

**3. Invoice Download Endpoint**

```typescript
router.get('/billing/invoice/:month', async (req, res) => {
  const { month } = req.params; // Format: YYYY-MM

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', req.user.id)
    .single();

  if (!membership) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const invoicePDF = await generateInvoice(membership.organization_id, month);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${month}.pdf`);
  res.send(invoicePDF);
});
```

---

## Phase 9: Enhanced Compliance & Audit

**Goal**: Add compliance tools and enhanced audit features.

### Features

**1. Email Notifications**

- Publication confirmation (to firm)
- New publication notification (to council)
- Representation submitted (to council and firm)
- Deadline reminders (3 days before deadline)
- Payment receipts

**2. Data Export**

- Export publications (CSV)
- Export representations (CSV)
- Export audit logs (for compliance)
- GDPR-compliant data export per user

**3. Audit Log Export**

Enhance existing `/src/pages/council/AuditLog.tsx` with export button:

```typescript
async function exportAuditLog() {
  const response = await fetch('/api/audit/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_date: filters.startDate,
      end_date: filters.endDate,
      format: 'csv'
    })
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString()}.csv`;
  a.click();
}
```

---

## Phase 10: Advanced Features

**Goal**: Add productivity and power-user features.

### Features

**1. Analytics Dashboard** (Council)

Location: `/src/pages/council/Analytics.tsx`

```typescript
export default function Analytics() {
  const [publicationTrends, setPublicationTrends] = useState([]);
  const [representationStats, setRepresentationStats] = useState({});
  const [topFirms, setTopFirms] = useState([]);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>

      {/* Publication Trends Chart */}
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Publication Trends (Last 12 Months)
        </h2>
        <LineChart data={publicationTrends} />
      </div>

      {/* Representation Statistics */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Representation Breakdown
          </h3>
          <PieChart data={representationStats} />
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Top Publishing Firms
          </h3>
          <BarChart data={topFirms} />
        </div>
      </div>
    </div>
  );
}
```

**2. Templates Enhancement**

Add variable support to templates:

```typescript
// In template, use: "Application for {{premises_name}} at {{premises_address}}"
// When creating notice, replace: {{premises_name}} → "The King's Arms"

function applyTemplate(template: Template, noticeData: any): string {
  let text = template.content;

  // Replace all {{variable}} with actual values
  text = text.replace(/\{\{premises_name\}\}/g, noticeData.premises.name);
  text = text.replace(/\{\{premises_address\}\}/g, noticeData.premises.address.line1);
  text = text.replace(/\{\{applicant_name\}\}/g, noticeData.applicant.name);
  // ... etc

  return text;
}
```

**3. Advanced Search**

Add to public `/notices` page:

- Full-text search across all fields
- Postcode radius search (already exists)
- Date range filters
- Notice type filters
- Council filters

**4. Saved Searches** (for firms)

Allow firms to save search criteria and get email alerts:

```sql
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  search_criteria JSONB NOT NULL, -- Store filters
  email_alerts BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 11: Production Readiness

**Goal**: Prepare for live deployment.

### Infrastructure

**1. Performance Optimization**
- Database indexing (already done in migrations)
- Query optimization
- Caching strategy (Redis for API responses)
- CDN for static assets
- Image optimization

**2. Security Hardening**
- Rate limiting on all endpoints
- CSRF protection
- XSS sanitization
- SQL injection prevention (parameterized queries via Supabase)
- Dependency security scanning

**3. Monitoring & Logging**
- Application performance monitoring (APM)
- Error tracking (Sentry)
- Uptime monitoring
- Database query profiling
- Log aggregation

**4. Backup & Disaster Recovery**
- Automated database backups (daily)
- Point-in-time recovery testing
- Disaster recovery runbook
- Data retention policies

**5. Documentation**
- User guides (council, firm, public)
- API documentation
- Admin documentation
- Compliance documentation
- Deployment documentation

**6. Testing**
- E2E tests (Playwright) for critical paths
- Load testing (publication flow)
- Security testing (penetration test)
- Accessibility testing (WCAG 2.1 AA)
- Mobile responsiveness testing

### Deployment Checklist

- [ ] Database migrations tested on staging
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Email sending configured (SMTP)
- [ ] Stripe webhooks configured
- [ ] Backup strategy tested
- [ ] Monitoring dashboards created
- [ ] Error alerting configured
- [ ] Load balancer configured (if needed)
- [ ] CDN configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] GDPR compliance verified
- [ ] User acceptance testing completed
- [ ] Training materials prepared
- [ ] Support process defined

---

## Compliance Considerations

### UK Licensing Law Requirements

**1. Public Notice Requirements** (Licensing Act 2003, Section 25):
- ✅ Notice must be displayed at/near premises for 28 days
- ✅ Notice must be published in local newspaper
- ✅ Notice must specify consultation period (28 days minimum)
- ✅ Must include licensing authority contact details
- ✅ Must describe licensable activities

**Implementation**:
- Auto-calculate 28-day representation deadline
- Store publication date and newspaper name
- Generate compliant notice text from templates
- Ensure premises address is accurate

**2. Data Protection (UK GDPR)**:
- ✅ Lawful basis: Public task (licensing is statutory function)
- ✅ Privacy notices for all user types
- ✅ Data retention policies (7 years for licensing records)
- ✅ Right to access (export functionality)
- ✅ Data security (encryption at rest/transit)

**Implementation**:
- Privacy policy page
- Data retention triggers
- Export functionality in Phase 9
- Audit logging (already complete)
- Encryption via Supabase (built-in)

**3. Audit Trail Requirements** (Local Government Transparency Code 2015):
- ✅ All decisions must be recorded
- ✅ Audit trail must be immutable
- ✅ Records must be retained for minimum period
- ✅ Public access to licensing decisions

**Implementation**:
- Immutable audit_logs table (already complete)
- Trigger-based logging (already complete)
- Prevent UPDATE/DELETE on audit logs (already complete)
- Published notices visible on public portal (already complete)

**4. Accessibility (Public Sector Bodies Accessibility Regulations 2018)**:
- ⚠️ WCAG 2.1 AA compliance required
- ⚠️ Accessibility statement required
- ⚠️ Regular accessibility testing

**Implementation** (Phase 11):
- Accessibility audit with automated tools (axe, Pa11y)
- Manual testing with screen readers
- Keyboard navigation testing
- Color contrast verification
- Alt text for all images
- ARIA labels where needed
- Accessibility statement page

**5. Payment Processing**:
- ✅ PCI DSS compliance via Stripe
- ✅ Tokenization for saved cards
- ✅ Webhook handling for payment confirmation
- ✅ Never store card details

---

## Technical Implementation Notes

### Database Migration Strategy

**Order of execution**:

1. ✅ Multi-tenant foundation (`20251021000000_multi_tenant_foundation.sql`)
2. ✅ Memberships & RBAC (`20251021000001_memberships.sql`)
3. ✅ Notices enhancements (`20251021000002_notices_enhanced.sql`)
4. ✅ Templates & attachments (`20251021000003_templates_attachments.sql`)
5. ✅ Invitations & clients (`20251021000004_invitations_clients.sql`)
6. ✅ Representations (`20251021000005_submissions_representations.sql`)
7. ✅ Audit logs (`20251021000006_audit_logs.sql`)
8. ✅ RLS policies (`20251021000007_rls_policies.sql`)
9. ✅ Storage buckets (`20251021000008_storage_buckets.sql`)
10. 🔜 **NEW**: Direct publishing enhancements (`20251022000001_direct_publishing.sql`)
11. 🔜 **NEW**: Billing system (`20251022000002_billing_system.sql`)

### API Versioning

Use URL versioning for future-proofing:
- Current: `/api/notices/publish` → internally `/api/v1/notices/publish`
- Future: `/api/v2/notices/publish` (if breaking changes needed)

### Performance Considerations

**High-traffic endpoints**:
- `GET /api/notices` (public portal) - Add caching with 5min TTL
- `GET /api/notices/search` (public portal) - Add caching with 5min TTL
- `GET /api/councils` (used in publish flow) - Add caching with 1hr TTL
- `GET /api/billing/account` (firm portal) - Add caching with 60s TTL

**Optimization strategies**:
1. Database indexes (already added in migrations)
2. Materialized views for stats/analytics
3. Redis caching for read-heavy endpoints
4. Pagination for all list endpoints (already using limit/offset)
5. Connection pooling (Supabase built-in)

### Testing Strategy

**Critical paths requiring E2E tests**:
1. Firm publishes notice → Notice appears on public portal → Council sees it → Public submits representation → Firm views representation
2. Firm publishes multiple notices → Makes payment → Account balance updates
3. Council views publications → Clicks notice → Views representations → Marks as reviewed
4. Team member invitation flow (council and firm)

---

## Future Enhancements

Beyond Phase 11, consider:

### Mobile Applications
- Native iOS/Android apps for firms (publish on-the-go)
- Native apps for councils (review on-the-go)
- Push notifications for new representations

### AI/ML Features
- Auto-categorize notice types from uploaded documents
- OCR improvements for scanned documents
- Flag potentially incomplete notices
- Suggest similar notices for consistency

### Advanced Integrations
- IDOX (case management for councils)
- GOV.UK Notify (official notification service)
- Planning portals
- Land Registry data
- Companies House data

### Public Engagement
- SMS alerts for nearby notices
- Email subscriptions by postcode
- Mobile-friendly notice viewing
- Multi-language support

### Analytics & Insights
- Heatmap of notice density
- Trends in licensing applications
- Representation sentiment analysis
- SLA performance benchmarking across councils

---

## Implementation Timeline

### Phase 5: Direct Publishing (1 week)
- Database changes (firm tracking, billing tables)
- API endpoints (publish, billing)
- Modify publish flow to call new endpoint
- Testing

### Phase 6: Firm Portal (2 weeks)
- Week 1: Layout, dashboard, publications list
- Week 2: Publication detail with representations, client management

### Phase 7: Council Publications (1 week)
- Publications page (filtered by department)
- Publication viewer with representations
- Navigation updates

### Phase 8: Billing & Payments (1 week)
- Stripe integration
- Payment processing
- Invoice generation
- Testing

### Phase 9: Compliance (1 week)
- Email notifications
- Audit export
- Data exports
- Testing

### Phase 10: Advanced Features (2 weeks)
- Analytics dashboard
- Template enhancements
- Advanced search
- Saved searches

### Phase 11: Production (1-2 weeks)
- Performance testing
- Security audit
- Documentation
- Training materials
- Launch preparation

**Total estimated time**: 9-10 weeks for full implementation

---

## Success Metrics

**For Firms**:
- Time to publish notice: < 10 minutes
- Notice goes live: immediately
- Account satisfaction: > 4/5 stars
- Payment collection rate: > 95%

**For Councils**:
- Time to view publication: < 30 seconds
- Representation management: < 5 minutes per notice
- Data availability: 100% uptime
- Audit compliance: 100%

**For Public**:
- Notice availability: 100% of published notices
- Representation submission success: > 99%
- Page load time: < 2 seconds

---

## Risk Mitigation

**Risk**: Firms publish non-compliant notices

**Mitigation**:
- Validation rules in publish flow
- Required fields enforcement
- Template library with compliant formats
- Optional pre-publication review for new firms (first 5 notices)

**Risk**: Data loss or corruption

**Mitigation**:
- Automated daily backups
- Point-in-time recovery
- Immutable audit logs
- Regular backup restoration testing

**Risk**: Security breach

**Mitigation**:
- Regular security audits
- Penetration testing before launch
- Bug bounty program
- Incident response plan
- Insurance coverage

**Risk**: Performance degradation under load

**Mitigation**:
- Load testing before launch
- Scalable infrastructure (Supabase auto-scales)
- Caching strategy
- Database query optimization
- Monitoring and alerting

**Risk**: Payment fraud

**Mitigation**:
- Stripe fraud detection (built-in)
- Account verification for new firms
- Payment limits for new accounts
- Manual review of large payments

---

## Conclusion

This roadmap transforms the Public Notice Portal into a **simplified multi-tenant publishing platform** where:

1. **Firms** publish notices directly (no approval needed) and manage their account
2. **Councils** see publications for their department and manage representations
3. **Public** continues to access and respond to notices (no changes)

The approach is **incremental** - each phase adds standalone value without breaking existing features. The foundation (Phases 1-4) is already complete, and the simplified architecture removes approval bottlenecks.

**Key advantages**:
- ✅ **Simpler flow** - No approval bottleneck, notices go live immediately
- ✅ **Account-based billing** - Easier for firms, better cash flow
- ✅ **Preserves all working code** - Build on existing foundation
- ✅ **Compliance-first design** - UK licensing law requirements met
- ✅ **Council-friendly** - Automatic department filtering
- ✅ **Comprehensive audit trail** - Legal protection for all parties
- ✅ **Scalable architecture** - Ready for hundreds of councils and firms

**Next steps**:
1. Review and approve this roadmap
2. Begin Phase 5 (Direct publishing flow)
3. Pilot with 2-3 friendly councils and firms
4. Iterate based on feedback
5. Full rollout

---

**Document Version**: 2.0 (Simplified Architecture)
**Author**: Claude Code Assistant
**Date**: 22 October 2025
