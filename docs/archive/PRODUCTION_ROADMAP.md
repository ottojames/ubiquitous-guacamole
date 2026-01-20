# Production Roadmap: Demo → Live Customer Rollout

**Created**: 22 November 2025
**Status**: Planning
**Goal**: Transform showcase demo features into production-ready customer platform

---

## Executive Summary

The showcase demo has proven core functionality with manual data. To roll out to customers, we need to:
1. Automate data pipelines (currently manual seeding)
2. Implement missing backend features (notifications, billing, analytics)
3. Add production infrastructure (monitoring, backups, security)
4. Create customer onboarding workflows
5. Complete testing and compliance requirements

**Estimated Timeline**: 8-12 weeks to production launch
**Critical Path**: Phases 1-3 (automated notice generation, representation workflow, billing)

---

## Current State: What Works

### ✅ **Production-Ready Features**
- **Publishing Wizard**: Complete multi-step flow with OCR extraction
- **Notice Types**: 40+ statutory notice types configured
- **Map Display**: Interactive map with postcode search, zoom, and pin markers
- **Notice Detail Page**: Rich legal text, activities, operating hours display
- **Representation Display**: Formatted grounds with concerns/licensing objectives
- **Council Dashboard**: Department filtering, notice counts, representation tracking
- **API Endpoints**: RESTful API for notices, representations, councils
- **Template Engine**: Handlebars-based templates for all notice types

### 🔨 **Demo-Only (Manual) Features**
- **Rich Notice Text**: Manually added to `preview_text` field
- **Sample Data**: 7 diverse notices near SW1A 2AB (manual seed)
- **Representations**: 14 representations on Parliament View Wine Bar (manual seed)
- **Analytics Data**: Segment 4 figures (245 notices, 1,342 reps) are hypothetical

---

## Phase 1: Core Automation (Weeks 1-3)

### 1.1 Automated Notice Text Generation ⚠️ **CRITICAL**

**Current**: Rich legal text manually added to demo notice
**Needed**: Automatic template rendering on publish

**Tasks**:
- [ ] Hook template engine into `POST /api/publish` endpoint
- [ ] Generate `preview_text` using notice type templates
- [ ] Populate `extras.activities` and `extras.operating_hours` from form data
- [ ] Add database trigger to regenerate text when notice updated
- [ ] Backfill existing notices with rendered text

**Files to Modify**:
- `server/routes/publish.ts` (add template rendering)
- `src/next/publish/templates/engine.ts` (ensure server compatibility)
- `supabase/migrations/*_auto_render_notice_text.sql` (database trigger)

**Acceptance Criteria**:
- Solicitor publishes notice → rich legal text automatically generated
- All mandatory placeholders populated from form
- Text matches statutory requirements for each notice type

---

### 1.2 Operating Hours & Activities Form Inputs

**Current**: Data manually inserted into database
**Needed**: Form fields for solicitors to input this data

**Tasks**:
- [ ] Add activities selector to Step 3 (Confirm Details)
- [ ] Add operating hours table to Step 3
- [ ] Update schema validation to require these fields for licensing notices
- [ ] Save to `extras.activities` and `extras.operating_hours` in database
- [ ] Display validation errors if missing

**Files to Modify**:
- `src/next/publish/flow/steps/ConfirmStep.tsx`
- `src/components/publish/ActivitiesHoursSection.tsx` (already exists!)
- `src/next/publish/schema/licensing.ts`

**Acceptance Criteria**:
- Solicitor can select multiple activities (Sale of Alcohol, Live Music, etc.)
- Solicitor can enter hours for different days/times
- Data saves correctly and displays on notice detail page

---

### 1.3 Representation Email Notifications

**Current**: Councils must manually check dashboard for new representations
**Needed**: Email alerts when representation received

**Tasks**:
- [ ] Set up Resend or SendGrid integration
- [ ] Create email template for "New Representation Received"
- [ ] Send to all officers in relevant department
- [ ] Include: notice details, representor name, deadline, link to dashboard
- [ ] Add email preferences to council settings

**Files to Create**:
- `server/services/notifications.ts`
- `server/templates/emails/new-representation.html`

**Acceptance Criteria**:
- Public submits representation → email sent within 1 minute
- Email contains all key details
- Link goes directly to representation in dashboard

---

## Phase 2: Representation Workflow (Weeks 4-6)

### 2.1 Deadline Tracking & Reminders

**Tasks**:
- [ ] Daily CRON job to identify consultations closing in 7/3/1 days
- [ ] Email reminders to councils with unread representations
- [ ] Auto-close consultations after deadline
- [ ] Flag overdue representation reviews (red indicator)

**Files to Create**:
- `server/jobs/deadlineReminders.ts`
- `server/cron/daily-checks.ts`

---

### 2.2 Representation Export for Council Case Management

**Tasks**:
- [ ] Export all representations for a notice as CSV
- [ ] Export all representations for a notice as PDF report
- [ ] Include: representor details, grounds, timestamp, status
- [ ] Format suitable for licensing committee papers

**Files to Create**:
- `server/routes/exports.ts`
- `server/utils/generateRepresentationPdf.ts`

---

### 2.3 Representor Confirmation & Updates

**Tasks**:
- [ ] Send confirmation email to representor after submission
- [ ] Include unique reference number
- [ ] Allow representor to view/withdraw their representation (magic link)
- [ ] Email representor when consultation closes

---

## Phase 3: Billing & Payments (Weeks 5-7)

### 3.1 Stripe Integration

**Current**: Demo shows £49.99 but no actual payment
**Needed**: Live payment processing

**Tasks**:
- [ ] Set up Stripe account (production + test mode)
- [ ] Create Stripe Checkout session on Step 4 (Payment)
- [ ] Handle success/failure webhooks
- [ ] Update `payment_status` in database on success
- [ ] Generate invoice PDF after payment

**Files to Modify**:
- `src/next/publish/flow/steps/PaymentStep.tsx`
- `server/routes/stripe-webhooks.ts` (create)

---

### 3.2 Outstanding Balance Tracking

**Current**: Wilson & Partners shows £749.85 outstanding (manual)
**Needed**: Real-time calculation from billing_transactions

**Tasks**:
- [ ] Query `billing_transactions` table for pending/failed transactions
- [ ] Display on firm dashboard
- [ ] Allow firms to pay outstanding balances
- [ ] Send monthly statements

---

## Phase 4: Analytics Dashboard (Weeks 6-8)

**Current**: Segment 4 uses hypothetical data (245 notices, 1,342 reps)
**Needed**: Real analytics from database

### 4.1 Council Analytics Implementation

**Tasks**:
- [ ] Implement `GET /api/analytics/council/:councilId`
- [ ] Calculate: total notices, active notices, representations count
- [ ] Cost savings calculation: (traditional - digital) × notice count
- [ ] Department comparison: notices by department, avg approval time
- [ ] Compliance tracking: deadline adherence percentage
- [ ] Engagement rate: % of notices with representations

**Files to Create**:
- `server/routes/analytics.ts`

---

### 4.2 Visualization Components

**Tasks**:
- [ ] Monthly trends chart (Chart.js or Recharts)
- [ ] Department comparison cards
- [ ] Cost savings calculator widget
- [ ] Compliance dashboard with red/amber/green indicators

**Files to Modify**:
- `src/pages/council/Analytics.tsx` (enhance with real data)

---

## Phase 5: Production Infrastructure (Weeks 7-9)

### 5.1 Monitoring & Alerting

**Tasks**:
- [ ] Set up Sentry for error tracking
- [ ] Configure uptime monitoring (Pingdom or UptimeRobot)
- [ ] Alert on: API errors, payment failures, email delivery failures
- [ ] Dashboard for system health

---

### 5.2 Database Backups & Disaster Recovery

**Tasks**:
- [ ] Configure Supabase automatic backups (daily)
- [ ] Test restoration process
- [ ] Document recovery procedures
- [ ] Set up point-in-time recovery

---

### 5.3 Performance Optimization

**Tasks**:
- [ ] Add database indexes on frequently queried columns
- [ ] Implement Redis caching for council/notice lookups
- [ ] CDN for static assets
- [ ] Lazy load map markers (virtualization for 1000+ notices)

---

## Phase 6: Customer Onboarding (Weeks 8-10)

### 6.1 Council Onboarding Workflow

**Tasks**:
- [ ] Create onboarding wizard for new councils
- [ ] Import council structure (departments, users, permissions)
- [ ] Bulk import existing notices from council systems
- [ ] Training videos for council staff
- [ ] Help documentation

---

### 6.2 Legal Firm Onboarding

**Tasks**:
- [ ] Self-service signup for firms
- [ ] Organization setup wizard
- [ ] Payment method configuration
- [ ] First notice walkthrough
- [ ] Support documentation

---

### 6.3 Support Infrastructure

**Tasks**:
- [ ] In-app help widget (Intercom or Crisp)
- [ ] Knowledge base articles
- [ ] Email support queue
- [ ] SLA targets (response time, resolution time)

---

## Phase 7: Testing & Compliance (Weeks 9-11)

### 7.1 End-to-End Testing

**Tasks**:
- [ ] Complete E2E tests for all user journeys
- [ ] Load testing (simulate 100 concurrent users)
- [ ] Security penetration testing
- [ ] Browser compatibility testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness testing

---

### 7.2 Accessibility Audit

**Tasks**:
- [ ] WCAG 2.1 AA compliance audit
- [ ] Keyboard navigation testing
- [ ] Screen reader testing (NVDA, JAWS)
- [ ] Color contrast fixes
- [ ] ARIA labels and semantic HTML

---

### 7.3 Legal & Compliance

**Tasks**:
- [ ] Terms of Service (reviewed by solicitor)
- [ ] Privacy Policy (GDPR compliant)
- [ ] Cookie Policy
- [ ] Data Processing Agreement (for councils)
- [ ] Information Security Policy
- [ ] Data retention policy
- [ ] Subject Access Request (SAR) process

---

## Phase 8: Launch Preparation (Weeks 10-12)

### 8.1 Beta Program

**Tasks**:
- [ ] Recruit 2-3 beta councils
- [ ] Run 4-week beta with real notices
- [ ] Collect feedback and iterate
- [ ] Fix critical bugs
- [ ] Refine user journeys

---

### 8.2 Go-Live Checklist

**Tasks**:
- [ ] Production deployment pipeline tested
- [ ] DNS and SSL certificates configured
- [ ] Monitoring dashboards active
- [ ] Support team trained
- [ ] Incident response plan documented
- [ ] Press release and marketing materials ready
- [ ] Customer success team onboarding materials
- [ ] Pricing finalized

---

## Critical Decisions Needed

### 1. **Notice Review Applications**
**Issue**: We removed Review notice types from demo (Premises & Club)
**Question**: Should these be added back for production?
**Impact**: Reviews are statutory but less common. May defer to Phase 2?

### 2. **Pricing Model**
**Current Demo**: £49.99 per notice
**Questions**:
- Flat fee or tiered pricing?
- Subscription model for councils?
- Volume discounts for law firms?
- Different pricing for different notice types?

### 3. **OCR Quality**
**Current**: Works but occasionally misses fields
**Questions**:
- Fallback to manual entry acceptable?
- Invest in better OCR (Azure Document Intelligence)?
- AI-assisted validation?

### 4. **Multi-Council Notices**
**Current**: Demo has single-jurisdiction focus
**Feature in Narration**: "concurrently applied to multiple authorities"
**Question**: Is this Phase 1 or Phase 2?

---

## Resource Requirements

### Development Team
- **Backend Developer**: 1 FTE (API, database, jobs)
- **Frontend Developer**: 1 FTE (UI, forms, dashboards)
- **DevOps Engineer**: 0.5 FTE (deployment, monitoring)
- **QA Tester**: 0.5 FTE (testing, bug tracking)

### External Services
- **Stripe**: Payment processing (~2.9% + 30p per transaction)
- **Resend/SendGrid**: Email notifications (~$10-50/month)
- **Sentry**: Error tracking (~$29/month)
- **Hosting**: Supabase Pro (~$25/month + usage)

---

## Success Metrics

### Technical
- [ ] 99.5% uptime
- [ ] < 2s page load time
- [ ] Zero critical security vulnerabilities
- [ ] WCAG 2.1 AA compliant

### Business
- [ ] 5 councils onboarded in first 3 months
- [ ] 50+ notices published per month
- [ ] 90% customer satisfaction score
- [ ] < 5% payment failure rate

---

## Next Steps

1. **Week 1**: Implement automated notice text generation (Phase 1.1)
2. **Week 2**: Add activities/hours form inputs (Phase 1.2)
3. **Week 3**: Set up email notifications (Phase 1.3)
4. **Week 4**: Begin representation workflow features (Phase 2)

**Key Decision Points**:
- **End of Week 2**: Review progress, adjust timeline if needed
- **End of Week 6**: Go/No-Go for beta program
- **End of Week 10**: Production launch readiness review

---

## Questions for Stakeholders

1. What is the target launch date? (Determines if we can do all phases or need to prioritize)
2. Which councils are interested in beta participation?
3. What is the acceptable MVP feature set? (Can we defer analytics/exports?)
4. Budget for external services and infrastructure?
5. Regulatory approval process - do we need sign-off from any authorities?

