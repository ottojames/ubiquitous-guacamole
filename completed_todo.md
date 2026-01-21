# Civic Notices - Feature TODO

## ✅ STATUS: ALL COMPLETE (2026-01-21)

All tasks in this file have been implemented. See [COMPLETED_PRD.md](./COMPLETED_PRD.md) for detailed implementation notes.

---

## Platform Core (Completed)
- [x] Fix authentication consolidation
- [x] Admin login working
- [x] Council portal functional
- [x] Firm portal functional
- [x] Publishing wizard with template linking
- [x] Remove all mock/demo data
- [x] All tests passing

---

## Firm Portal (£49/month subscription)

### Workflow Stages Per Notice Type (Researched)

**Premises Licence (Licensing Act 2003)** - [GOV.UK Guidance](https://www.gov.uk/government/publications/premises-licence-application-forms/premises-licence-guidance)
Default stages:
1. Draft - Preparing application & operating schedule
2. Pre-Application - Optional council advice
3. Submitted - Application sent to council + fee paid
4. Advertising - Blue notice displayed + newspaper ad (must complete within 10 working days)
5. Consultation - 28-day representation period (responsible authorities + public)
6. Awaiting Decision - Council reviewing (target: 40 days total)
7. Hearing Scheduled - If representations received (date to track)
8. Decision - Granted / Granted with Conditions / Refused
9. Appeal Period - 21 days to appeal to Magistrates (if refused)
10. Complete - Licence issued or appeal resolved

Key deadlines to track:
- 28-day consultation end date
- Hearing date (if applicable)
- 21-day appeal window
- Annual fee renewal date

**Probate Notice (Trustee Act 1925 s.27)** - [The Gazette Guide](https://www.thegazette.co.uk/wills-and-probate/content/299)
Default stages:
1. Draft - Preparing notice with deceased details
2. Published - Notice live in The Gazette + local newspaper
3. Waiting Period - 2-month creditor claim window
4. Claims Received - Any creditor claims to address (optional stage)
5. Period Expired - 2 months + 1 day passed
6. Estate Distributed - Executor protection complete

Key deadlines to track:
- Publication date
- 2-month expiry date (protection begins after this)
- Estate distribution date

**Planning Application** - [Planning Portal Guide](https://www.planningportal.co.uk/planning/planning-applications/the-decision-making-process/introduction/)
Default stages:
1. Pre-Application - Council advice (optional)
2. Submitted - Application via Planning Portal
3. Validation - Council checking completeness
4. Consultation - 21-28 day neighbour/consultee period
5. Site Visit - Officer assessment
6. Amendments - Negotiating changes (if needed, may restart consultation)
7. Officer Report - Recommendation prepared
8. Committee/Delegated - Decision route determined
9. Decision - Approved / Approved with Conditions / Refused
10. Discharge Conditions - If approved with conditions
11. Appeal - If refused (Planning Inspectorate)
12. Complete - Permission secured or appeal resolved

Key deadlines to track:
- Validation date
- Consultation end date
- Decision target (8 weeks minor / 13 weeks major)
- 3-year permission expiry (must start work)
- Condition discharge deadlines

**TRO - Traffic Regulation Order** - [House of Commons Briefing](https://commonslibrary.parliament.uk/research-briefings/sn06013/)
Default stages:
1. Investigation - Initial feasibility + councillor support
2. Design - Traffic scheme designed
3. Statutory Consultation - Emergency services + public bodies
4. Notice of Intention - Published in local press
5. Objection Period - 21 days for public objections
6. Objection Review - Council considers objections (delegated or committee)
7. Modifications - If changes needed (may re-advertise)
8. Notice of Making - Published confirming approval
9. Implementation - Signs and lines installed
10. In Force - TRO active

Key deadlines to track:
- 21-day objection period end
- Committee date (if objections)
- Implementation date
- 6-week High Court appeal window

**GVOL - Goods Vehicle Operator Licence** - [GOV.UK Guide](https://www.gov.uk/guidance/goods-vehicle-operator-licensing-guide)
Default stages:
1. Preparation - Operating centre secured, maintenance contract arranged
2. Application Submitted - Online via GOV.UK + fee (£257 + £401)
3. Newspaper Advertisement - Published in local newspaper (mandatory)
4. Traffic Commissioner Review - Application assessed
5. Objection Period - Public/local authority can object
6. Decision - Licence granted or refused (target: 40 days)
7. Interim Licence - If urgent (optional stage)
8. Licence Issued - Full O licence received
9. Renewal Due - Every 5 years

Key deadlines to track:
- Newspaper publication date
- 40-day decision target
- 5-year renewal date
- Annual compliance check dates

**Gambling Premises (Gambling Act 2005)** - [Westminster Council Guide](https://www.westminster.gov.uk/licensing/other-licence-and-business-permit-types/gambling-act-2005)
Default stages:
1. Operating Licence - Must obtain from Gambling Commission first
2. Application Submitted - Premises licence to council + fee
3. Notify Authorities - Must notify responsible authorities within 7 days
4. Advertisement - Notice displayed on premises
5. Consultation - 28-day representation period
6. Representations - Review any objections
7. Determination - Two-stage council consideration
8. Decision - Granted with conditions or refused
9. Appeal Period - 21 days to Magistrates
10. Complete - Licence issued

Key deadlines to track:
- 7-day authority notification deadline
- 28-day consultation end
- 21-day appeal window
- Annual fee due date

### Design Phase - Flexible Workflow System
- [x] Design: "Departments" concept within firm portal
  - Firm can have multiple departments (Licensing, Probate, Planning, etc.)
  - Each department has its own workflow/stages
  - User can switch between departments
  - Dashboard shows summary across all departments

- [x] Design: Customizable workflow stages per notice type
  - Default stages for each notice type (based on research)
  - Allow firms to add/rename/reorder stages if needed
  - Each stage can have: name, colour, description, typical duration

- [x] Design: Kanban board view
  - Columns = stages
  - Cards = individual notices
  - Drag-and-drop to move between stages
  - Card shows: client, premises, deadline, days remaining

- [x] Design: Calendar view
  - Show all deadlines on a calendar
  - Representation period end dates
  - Hearing dates
  - Expiry dates
  - Colour-coded by notice type or client

- [x] Design: List/table view
  - Sortable, filterable table
  - Bulk actions (export, archive, etc.)
  - Search across all notices

- [x] Design: Client view
  - Select a client, see all their notices
  - Timeline of activity for that client
  - Quick stats per client

### Core Features
- [x] Client database management
  - Add/edit clients
  - Link clients to notices
  - Client contact details
  - Client notes

- [x] Notice templates (save & reuse)
  - Template per notice type
  - Pre-fill common fields
  - Firm-specific templates

- [x] Draft & preview notices
  - Rich text editing
  - Preview exactly how it will appear
  - Save drafts

- [x] Bulk upload (CSV import)
  - Import multiple notices at once
  - Map CSV columns to fields
  - Validation before import

- [x] Team accounts (multiple staff per firm)
  - Invite team members
  - Role-based permissions (admin, publisher, viewer)
  - Activity log per user

### Deadline & Notification System
- [x] Deadline reminders
  - Email reminders X days before key dates
  - Configurable reminder schedule per firm
  - SMS option (premium?)

- [x] Representation alerts
  - Notify when representation submitted on their notice
  - Daily digest or instant notification option

- [x] Expiry warnings
  - Alert before representation period ends
  - Alert before licence expiry (for renewals)

### Analytics & Reporting
- [x] Analytics dashboard
  - Notices published this month/year
  - Success rates (granted vs refused)
  - Objection rates by area/premises type
  - Average time to decision

- [x] Export/reporting for client billing
  - Generate invoice-ready reports
  - Filter by client, date range
  - Export to CSV/PDF

- [x] Historical data insights
  - Which councils are slow/fast
  - Which premises types get objections
  - Seasonal patterns

---

## Council Portal Features (Free Access)
- [x] Department-based access control
- [x] View all notices in their area
- [x] Representation inbox
- [x] Mark representations as reviewed
- [x] Internal notes on representations
- [x] Template management per notice type
- [x] Export for IDOX compatibility
- [x] Team management & invitations
- [x] Audit log

---

## AI Features

### AI Compliance Checker
- [x] Validate statutory wording present
- [x] Check representation period correct
- [x] Verify required fields complete
- [x] Flag common errors before publishing

### AI Notice Drafting
- [x] Input basic details (premises, applicant, licence type)
- [x] Output complete legally-compliant notice text
- [x] Templates for all notice types
- [x] Learn from published notices to improve

### AI Representation Analysis (For Councils)
- [x] Summarize all representations on a notice
- [x] Categorize: objection/support/neutral
- [x] Extract key themes and concerns
- [x] Identify similar past cases
- [x] Suggest response framework

### AI Outcome Predictor
- [x] Predict likelihood of objections
- [x] Based on: notice type, location, premises type, historical data
- [x] Warn applicants of potential issues
- [x] Recommend mitigations

### Natural Language Search
- [x] Semantic search across notices and representations
- [x] Example: "refused pub licences in Westminster with noise objections"
- [x] Research tool for law firms

### AI Translation (Welsh)
- [x] Auto-translate notices to Welsh
- [x] Required for Welsh council compliance

### AI Representation Drafting (For Public)
- [x] Help public write effective objections/support
- [x] Guide through relevant grounds
- [x] Generate legally-relevant text

---

## Integrations
- [x] IDOX integration
- [x] Civica integration
- [x] Uniform integration
- [x] Firm case management system APIs
- [x] White-label options for large firms

---

## Payment & Billing
- [x] £50/notice payment flow (Stripe)
- [x] Receipt/invoice generation
- [x] Firm billing dashboard
- [x] Payment history

---

## UI Fixes (Priority)

### Admin Panel Overhaul (Critical)
- [x] Replace dark red theme with light professional theme (match public site)
- [x] Fix contrast failures (accessibility - WCAG compliance)
- [x] Replace browser `alert()` dialogs with proper modals
- [x] Fix broken edit/save buttons in Settings
- [x] Fix non-functional password reset
- [x] Remove hardcoded placeholder stats from Dashboard
- [x] Implement real data for all metrics
- [x] Fix broken sidebar navigation states

### Placeholder Content Removal
- [x] Fix broken council logo images (`_/logos/leeds.png` etc)
- [x] Remove hardcoded "1,842+" stats on homepage
- [x] Replace fake dashboard metrics with real queries
- [x] Remove all "Demo" and "Test" content

### Pricing Page Rewrite (Critical - Current page is wrong)

**Pricing Model (Three Tiers):**
- Public: No portal, £50 per notice (one-off, no account needed)
- Firms: £49/month subscription + £50 per notice (full management portal)
- Councils: Free receiving portal + £19.99 per notice when publishing

**Remove entirely:**
- [x] Remove "Professional" firm tier (£150/month with included notices)
- [x] Remove "Business" firm tier (£400/month with included notices)
- [x] Remove "Enterprise" firm tier (£1200/month with included notices)
- [x] Remove "Parish & Town" council tier (£49/month subscription)
- [x] Remove "District Council" tier (£199/month subscription)
- [x] Remove "Unitary & County" tier (£499/month subscription)
- [x] Remove complex comparison table
- [x] Remove "included notices" and "overage rate" concepts
- [x] Remove fake "Trusted by 40+ UK councils" claim

**Create three pricing cards:**

- [x] **Public card**: "One-Off Publishing"
  - £50 per notice
  - No account required
  - Instant publication
  - Legal compliance certificate
  - Audit trail & proof
  - Best for: individuals, occasional users

- [x] **Firms card**: "Professional Portal" (highlight as best value)
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

- [x] **Councils card**: "Council Portal"
  - FREE portal for receiving notices & representations
  - £19.99 per notice when publishing (60% discount)
  - Department-based access
  - Representation inbox
  - Internal notes & review tools
  - Audit log
  - Best for: local authorities publishing TROs, planning, environmental notices

**Update hero section:**
- [x] Change headline to "Simple, transparent pricing"
- [x] Update subheadline to explain the three tiers briefly

**Update comparison to newspapers:**
- [x] Keep "Old Way vs New Way" section
- [x] Show £50 vs £240-400 newspaper cost (85% savings)
- [x] Emphasise speed: instant vs 5-10 days

**Update FAQ section:**
- [x] Remove old subscription-related questions
- [x] Add "Why do councils get a discount?" (anchor tenants, high volume, bring legitimacy)
- [x] Add "What's included in the £49/month firm subscription?" (portal features)
- [x] Add "Can I publish without a subscription?" (Yes - £50 one-off, no account needed)
- [x] Add "What's included in the free council portal?" (receiving notices, representations, review tools)

**Update CTAs:**
- [x] Public CTA: "Publish Now - £50"
- [x] Firms CTA: "Start Free Trial" or "Get Started - £49/month"
- [x] Councils CTA: "Register Your Council - Free"

**Update final CTA section:**
- [x] Focus on the firm portal value proposition
- [x] Secondary CTA for councils

### Homepage Improvements
- [x] Replace hardcoded stats with real data from database
- [x] Sharpen hero messaging ("Publish legal notices digitally. £50 per notice.")
- [x] Make "Publish a Notice" CTA more prominent (firms are paying customers)
- [x] Replace placeholder council logos with real council logos
- [x] Add trust signals section
- [x] Review and fix mobile spacing on all sections

### Design Consistency
- [x] Unify admin and public colour palette
- [x] Consistent typography across all pages
- [x] Standardise button styles (primary, secondary, danger)
- [x] Consistent card/panel styling
- [x] Match form input styles between admin and public
- [x] Professional loading states (replace spinners with skeletons where appropriate)
