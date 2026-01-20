# Civic Notices - Feature TODO

## Platform Core (Current - Ralph Working)
- [ ] Fix authentication consolidation
- [ ] Admin login working
- [ ] Council portal functional
- [ ] Firm portal functional
- [ ] Publishing wizard with template linking
- [ ] Remove all mock/demo data
- [ ] All tests passing

---

## Firm Portal Features (Free Access)
- [ ] Client database management
- [ ] Notice templates (save & reuse)
- [ ] Draft & preview notices
- [ ] Bulk upload (CSV import)
- [ ] Team accounts (multiple staff per firm)
- [ ] Notice tracking dashboard
- [ ] Representation alerts
- [ ] Deadline reminders
- [ ] Analytics (success rates, objection trends)
- [ ] Export/reporting for client billing

---

## Council Portal Features (Free Access)
- [ ] Department-based access control
- [ ] View all notices in their area
- [ ] Representation inbox
- [ ] Mark representations as reviewed
- [ ] Internal notes on representations
- [ ] Template management per notice type
- [ ] Export for IDOX compatibility
- [ ] Team management & invitations
- [ ] Audit log

---

## AI Features

### AI Compliance Checker
- [ ] Validate statutory wording present
- [ ] Check representation period correct
- [ ] Verify required fields complete
- [ ] Flag common errors before publishing

### AI Notice Drafting
- [ ] Input basic details (premises, applicant, licence type)
- [ ] Output complete legally-compliant notice text
- [ ] Templates for all notice types
- [ ] Learn from published notices to improve

### AI Representation Analysis (For Councils)
- [ ] Summarize all representations on a notice
- [ ] Categorize: objection/support/neutral
- [ ] Extract key themes and concerns
- [ ] Identify similar past cases
- [ ] Suggest response framework

### AI Outcome Predictor
- [ ] Predict likelihood of objections
- [ ] Based on: notice type, location, premises type, historical data
- [ ] Warn applicants of potential issues
- [ ] Recommend mitigations

### Natural Language Search
- [ ] Semantic search across notices and representations
- [ ] Example: "refused pub licences in Westminster with noise objections"
- [ ] Research tool for law firms

### AI Translation (Welsh)
- [ ] Auto-translate notices to Welsh
- [ ] Required for Welsh council compliance

### AI Representation Drafting (For Public)
- [ ] Help public write effective objections/support
- [ ] Guide through relevant grounds
- [ ] Generate legally-relevant text

---

## Integrations
- [ ] IDOX integration
- [ ] Civica integration
- [ ] Uniform integration
- [ ] Firm case management system APIs
- [ ] White-label options for large firms

---

## Payment & Billing
- [ ] £50/notice payment flow (Stripe)
- [ ] Receipt/invoice generation
- [ ] Firm billing dashboard
- [ ] Payment history

---

## UI Fixes (Priority)

### Admin Panel Overhaul (Critical)
- [ ] Replace dark red theme with light professional theme (match public site)
- [ ] Fix contrast failures (accessibility - WCAG compliance)
- [ ] Replace browser `alert()` dialogs with proper modals
- [ ] Fix broken edit/save buttons in Settings
- [ ] Fix non-functional password reset
- [ ] Remove hardcoded placeholder stats from Dashboard
- [ ] Implement real data for all metrics
- [ ] Fix broken sidebar navigation states

### Placeholder Content Removal
- [ ] Fix broken council logo images (`_/logos/leeds.png` etc)
- [ ] Remove hardcoded "1,842+" stats on homepage
- [ ] Replace fake dashboard metrics with real queries
- [ ] Remove all "Demo" and "Test" content

### Pricing Page Rewrite (Critical - Current page is wrong)

**Pricing Model (Three Tiers):**
- Public: No portal, £50 per notice (one-off, no account needed)
- Firms: £49/month subscription + £50 per notice (full management portal)
- Councils: Free receiving portal + £19.99 per notice when publishing

**Remove entirely:**
- [ ] Remove "Professional" firm tier (£150/month with included notices)
- [ ] Remove "Business" firm tier (£400/month with included notices)
- [ ] Remove "Enterprise" firm tier (£1200/month with included notices)
- [ ] Remove "Parish & Town" council tier (£49/month subscription)
- [ ] Remove "District Council" tier (£199/month subscription)
- [ ] Remove "Unitary & County" tier (£499/month subscription)
- [ ] Remove complex comparison table
- [ ] Remove "included notices" and "overage rate" concepts
- [ ] Remove fake "Trusted by 40+ UK councils" claim

**Create three pricing cards:**

- [ ] **Public card**: "One-Off Publishing"
  - £50 per notice
  - No account required
  - Instant publication
  - Legal compliance certificate
  - Audit trail & proof
  - Best for: individuals, occasional users

- [ ] **Firms card**: "Professional Portal" (highlight as best value)
  - £49/month subscription
  - £50 per notice
  - Full notice management dashboard
  - Client database & linking
  - Workflow tracking (Draft → Published → Complete)
  - Deadline reminders & alerts
  - Saved templates & addresses
  - Team accounts (multiple staff)
  - Analytics & reporting
  - Invoice generation for client billing
  - AI features (when built)
  - Best for: law firms, licensing consultants, businesses

- [ ] **Councils card**: "Council Portal"
  - FREE portal for receiving notices & representations
  - £19.99 per notice when publishing (60% discount)
  - Department-based access
  - Representation inbox
  - Internal notes & review tools
  - Audit log
  - Best for: local authorities publishing TROs, planning, environmental notices

**Update hero section:**
- [ ] Change headline to "Simple, transparent pricing"
- [ ] Update subheadline to explain the three tiers briefly

**Update comparison to newspapers:**
- [ ] Keep "Old Way vs New Way" section
- [ ] Show £50 vs £240-400 newspaper cost (85% savings)
- [ ] Emphasise speed: instant vs 5-10 days

**Update FAQ section:**
- [ ] Remove old subscription-related questions
- [ ] Add "Why do councils get a discount?" (anchor tenants, high volume, bring legitimacy)
- [ ] Add "What's included in the £49/month firm subscription?" (portal features)
- [ ] Add "Can I publish without a subscription?" (Yes - £50 one-off, no account needed)
- [ ] Add "What's included in the free council portal?" (receiving notices, representations, review tools)

**Update CTAs:**
- [ ] Public CTA: "Publish Now - £50"
- [ ] Firms CTA: "Start Free Trial" or "Get Started - £49/month"
- [ ] Councils CTA: "Register Your Council - Free"

**Update final CTA section:**
- [ ] Focus on the firm portal value proposition
- [ ] Secondary CTA for councils

### Homepage Improvements
- [ ] Replace hardcoded stats with real data from database
- [ ] Sharpen hero messaging ("Publish legal notices digitally. £50 per notice.")
- [ ] Make "Publish a Notice" CTA more prominent (firms are paying customers)
- [ ] Replace placeholder council logos with real council logos
- [ ] Add trust signals section
- [ ] Review and fix mobile spacing on all sections

### Design Consistency
- [ ] Unify admin and public colour palette
- [ ] Consistent typography across all pages
- [ ] Standardise button styles (primary, secondary, danger)
- [ ] Consistent card/panel styling
- [ ] Match form input styles between admin and public
- [ ] Professional loading states (replace spinners with skeletons where appropriate)
