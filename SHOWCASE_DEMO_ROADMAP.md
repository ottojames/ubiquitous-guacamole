# Showcase Demo Roadmap

**Presentation Target**: Next week
**Objective**: Create a compelling, self-contained demo showcasing 4 user segments with rich mock data

---

## Executive Summary

The Public Notice Portal is already feature-complete across all 4 user segments. The showcase demo requires:
1. **Data seeding** - Create compelling mock data across all notice types
2. **Demo accounts** - Pre-configured users for each segment
3. **Demo landing page** - Central hub with QR codes and quick navigation
4. **Polish** - Visual enhancements and guided walkthrough

**Estimated Time**: 8-12 hours of focused work

---

## The 4 User Segments

### Segment 1: General Public (Resident/Applicant)
**Persona**: Sarah Thompson, local resident applying for her first premises license

**Journey to Showcase**:
1. Landing on homepage with address search
2. Searching for notices in her area (postcode: SW1A 1AA)
3. Viewing notice details with map visualization
4. Submitting a representation (objection/support)
5. Receiving email confirmation
6. Tracking her submission status

**Current Features** (all exist):
- Polished homepage with search and filters
- Map view with clustering (MapLibre GL)
- Notice detail pages with full legal text
- Representation submission form with validation
- Email integration (opens mailto with pre-filled content)
- Representation tracking (REP-XXXXXX reference numbers)

**Demo Enhancements Needed**:
- [ ] Pre-seed 30-40 diverse notices across London postcodes
- [ ] Add 50+ sample representations to various notices
- [ ] Create "controversial" notices with 10+ representations
- [ ] Add notices with deadlines expiring "today" (amber warnings)
- [ ] Mock email confirmation flow (visual mockup)

---

### Segment 2: Legal Firm/Solicitor
**Persona**: James Wilson, solicitor at Wilson & Associates LLP

**Journey to Showcase**:
1. Login to firm portal
2. Dashboard showing active cases and billing
3. Click "Publish New Notice"
4. Multi-step wizard:
   - Select notice type (Premises License - New Application)
   - Upload method: OCR scan of client application
   - Review extracted details with validation
   - Real-time preview of published notice text
   - Payment and submission
5. View notice in "Recent Notices" list
6. Track client billing and outstanding payments

**Current Features** (all exist):
- Complete firm portal with dashboard
- 50+ notice types across 6 categories
- Multi-step publish wizard with draft persistence
- OCR integration for document scanning
- Structured form builder with Zod validation
- Real-time preview (OCR text vs. structured fields)
- Billing system with per-notice charging
- Client management

**Demo Enhancements Needed**:
- [ ] Create 2-3 sample firms (Wilson & Associates, Thames Legal Partners, City Solicitors)
- [ ] Pre-populate 5-10 notices per firm with mixed statuses
- [ ] Add sample client records (5-8 per firm)
- [ ] Show billing dashboard with:
  - Some paid invoices (£49.99/notice)
  - Some pending invoices
  - Outstanding balance tracker
- [ ] Pre-upload sample PDF applications for OCR demo
- [ ] Add firm branding/logos

---

### Segment 3: Council Officer (Licensing/Planning Officer)
**Persona**: Emma Martinez, Senior Licensing Officer at Bristol City Council

**Journey to Showcase**:
1. Login to council portal
2. Dashboard showing:
   - Department statistics (total/published/draft/expired)
   - Notices requiring attention
   - Representation counts with unread indicators
   - Deadline warnings
3. View incoming submissions from firms
4. Review notice awaiting approval
5. View representations on a controversial notice:
   - 12 objections from residents
   - 3 letters of support
   - Mark representations as read
6. Approve notice for publication
7. Use department templates for quick publishing
8. Monitor representation deadlines

**Current Features** (all exist):
- Council portal with department-specific views
- Dashboard with stats cards and quick actions
- Submissions workflow (firm → council review)
- Representation management with read/unread tracking
- Status workflow (draft → pending → published → expired)
- Template library with custom text support
- Team management with RBAC
- Department types (Licensing, Planning, Traffic, Probate)
- Deadline tracking with visual indicators

**Demo Enhancements Needed**:
- [ ] Create 2 councils (Bristol, Westminster) with 3 departments each:
  - Licensing
  - Planning
  - Traffic & Highways
- [ ] Pre-populate notices at various stages:
  - 10 published notices
  - 3 pending approval (from firms)
  - 5 drafts
  - 2 expired
- [ ] Add 20-30 representations across notices:
  - Mix of objections/support
  - Some marked "unread" (amber dot)
  - Various licensing objectives cited
- [ ] Create 5-8 sample templates per department
- [ ] Add team members (5-6 officers per department)
- [ ] Show submission review workflow with comments

---

### Segment 4: Council Manager/Head of Department
**Persona**: David Chen, Head of Regulatory Services at Westminster Council

**Journey to Showcase**:
1. Login to manager view
2. Analytics dashboard showing:
   - **KPIs**: Total notices, publication rate, representation engagement
   - **Charts**:
     - Notices by month (trend analysis)
     - Notices by type (breakdown)
     - Representations by status
     - Top venues by frequency
   - **Activity feed**: Recent team actions
3. Cost savings analysis:
   - Digital vs. newspaper publication costs
   - £12,450 saved this quarter
4. Department comparison view:
   - Compare Licensing vs Planning performance
   - Response times, engagement rates
5. Compliance dashboard:
   - % notices meeting statutory deadlines (98.5%)
   - Overdue representations (2)
6. Export reports (CSV, PDF)
7. Audit log review

**Current Features** (all exist):
- Analytics dashboard with:
  - KPI cards with % change indicators
  - Bar chart (notices by month)
  - Pie chart (notices by type)
  - Representations status breakdown
  - Top venues list
  - Activity feed
  - Date range filters (7/30/90/365 days)
  - CSV export
- Audit log with full change tracking
- Billing/subscription management
- Team analytics

**Demo Enhancements Needed**:
- [ ] Make analytics dynamic from seeded data
- [ ] Add department comparison view
- [ ] Create cost savings calculator:
  - Newspaper ad cost: £280/notice
  - Digital platform cost: £49.99/notice
  - Savings per notice: £230.01
  - Quarterly savings projection
- [ ] Add compliance metrics:
  - Statutory deadline adherence rate
  - Average response time to representations
  - Overdue notices count
- [ ] Geographic heat map of notices (by ward/postcode)
- [ ] Mock sentiment analysis (positive/negative/neutral representations)
- [ ] Executive summary report template
- [ ] Year-over-year comparison charts

---

## Demo Landing Page Design

Create a central **Conference/Showcase Landing Page** at `/showcase` with:

### Layout
```
+----------------------------------------------------------+
|                 PUBLIC NOTICE PORTAL DEMO                |
|                  Live Demonstration                      |
+----------------------------------------------------------+
|                                                          |
|  [QR CODE 1]     [QR CODE 2]     [QR CODE 3]  [QR CODE 4]|
|   General        Legal Firm       Council      Manager   |
|   Public         Portal          Officer       Analytics |
|                                                          |
|   Click to       Click to         Click to     Click to  |
|   Experience     Experience       Experience   Experience|
+----------------------------------------------------------+
|                                                          |
|  LIVE STATS                                              |
|  - 1,842 Notices Published                               |
|  - 12,455 Representations Submitted                      |
|  - 40+ Councils Using Platform                           |
|  - £2.3M Cost Savings (vs. newspaper)                    |
|                                                          |
+----------------------------------------------------------+
|  QUICK LINKS FOR PRESENTER:                              |
|  • Reset Demo Data                                       |
|  • Jump to Segment 1 | 2 | 3 | 4                         |
|  • Presentation Notes                                    |
+----------------------------------------------------------+
```

### Features
- **QR Codes**: Generate QR codes for each segment that audience can scan
- **Quick Navigation**: One-click access to each user journey
- **Live Stats**: Pull from actual seeded data
- **Presenter Controls**: Hidden controls for resetting demo state
- **Auto-login**: Click-to-login buttons that bypass authentication
- **Guided Tour**: Optional overlays explaining each feature

---

## Data Seeding Strategy

### Notice Types to Include (30-40 total)
**Licensing (15 notices)**:
- 8 Premises License (New Application)
- 3 Premises License (Variation)
- 2 Premises License (Review)
- 2 Gambling (Betting Shop, Bingo Hall)

**Planning (10 notices)**:
- 5 Major Applications (residential developments)
- 3 Listed Building Consent
- 2 Environmental Impact Assessment

**Traffic & Highways (8 notices)**:
- 4 Traffic Regulation Orders (permanent)
- 2 Temporary Traffic Regulation Orders
- 2 Experimental Traffic Orders

**Probate (3 notices)**:
- 3 Trustee Act s.27 notices

**GVOL (4 notices)**:
- 4 Goods Vehicle Operator License applications

### Geographic Distribution
- **Bristol**: 15 notices (Clifton, Harbourside, St Paul's)
- **Westminster**: 15 notices (Soho, Covent Garden, Pimlico)
- **Other London**: 10 notices (Camden, Islington, Southwark)

### Temporal Distribution
- **Published 3+ months ago**: 10 notices (showing history)
- **Published 1-3 months ago**: 15 notices (ongoing)
- **Published this month**: 10 notices (recent activity)
- **Deadline today/tomorrow**: 5 notices (urgency indicators)

### Representation Distribution
- **High engagement** (10+ reps): 3 controversial notices
- **Medium engagement** (4-9 reps): 8 notices
- **Low engagement** (1-3 reps): 12 notices
- **No representations**: 17 notices

### Sample Notice Scenarios

#### Controversial Notice Example
**Title**: "Late Night Alcohol Sales - Soho Wine Bar"
- Type: Premises License Variation
- Location: 42 Dean Street, Soho, W1D 4PZ
- Proposal: Extend hours to 3am Friday-Saturday
- Representations: 14 total
  - 11 objections (noise, crime, public nuisance)
  - 3 support (economic benefit)
- Status: Under review
- Deadline: Tomorrow (create urgency)

#### Planning Notice Example
**Title**: "Demolition and Redevelopment - 150 Residential Units"
- Type: Major Planning Application
- Location: Former Industrial Site, Bristol, BS1 6QA
- Proposal: 150 flats + retail
- Representations: 23 total
  - 15 objections (traffic, density, loss of character)
  - 8 support (regeneration, housing need)
- Status: Published
- Deadline: 21 days remaining

---

## Technical Implementation Plan

### Phase 1: Database Seeding (4 hours)
**File**: `showcase-demo/seed-demo-data.ts`

Tasks:
1. Create SQL migration with demo data
2. Insert councils (Bristol, Westminster)
3. Insert departments (3 per council)
4. Insert firms (Wilson & Associates, Thames Legal, City Solicitors)
5. Insert team members (5-6 per department, 3-4 per firm)
6. Insert clients (5-8 per firm)
7. Insert notices (30-40 across all types)
8. Insert representations (50+ with variety)
9. Insert submissions (10-15 firm → council)
10. Insert billing transactions
11. Insert audit logs
12. Set up sample templates per department

**Key Considerations**:
- Use realistic names, addresses (via Faker.js or manual)
- Ensure geographic accuracy (real postcodes)
- Create compelling scenarios (controversial applications)
- Mix of statuses for workflow demonstration
- Representation deadlines calibrated to demo date

### Phase 2: Landing Page (2 hours)
**File**: `src/pages/ShowcaseLanding.tsx`

Tasks:
1. Create route `/showcase`
2. Design 4-quadrant layout with QR codes
3. Add live stats pulling from database
4. Create auto-login buttons for each persona
5. Add presenter controls (reset data, jump links)
6. Generate QR codes (use `qrcode.react` or similar)
7. Add responsive design for projection

### Phase 3: Demo Accounts & Auth Bypass (1 hour)
**Files**: `src/lib/demoAuth.ts`, update auth flow

Tasks:
1. Create demo user accounts:
   - `public@demo.com` (no login needed)
   - `james.wilson@wilsonlaw.co.uk` (firm)
   - `emma.martinez@bristol.gov.uk` (council officer)
   - `david.chen@westminster.gov.uk` (manager)
2. Add auth bypass for demo mode
3. Create session persistence for presenter navigation

### Phase 4: Visual Polish (2 hours)

Tasks:
1. Add demo mode indicator (subtle ribbon/badge)
2. Create guided tour overlays (optional)
3. Add sample PDF uploads for OCR demo
4. Enhance analytics with:
   - Cost savings calculator
   - Department comparison view
   - Compliance dashboard
5. Add firm logos/branding
6. Create presentation notes (what to say at each step)

### Phase 5: Analytics Enhancements (2 hours)
**File**: `src/pages/council/Analytics.tsx`

Tasks:
1. Make all metrics dynamic from seeded data
2. Add department comparison cards
3. Create cost savings section:
   - Newspaper cost per notice: £280
   - Platform cost: £49.99
   - Net savings: £230.01/notice
   - Total quarterly savings
4. Add compliance metrics:
   - Deadline adherence rate (98.5%)
   - Avg response time (4.2 days)
   - Overdue notices (2)
5. Mock geographic heat map (if time permits)
6. Add export functionality demo

### Phase 6: Testing & Rehearsal (1 hour)

Tasks:
1. Test all 4 user journeys end-to-end
2. Verify data consistency
3. Check mobile responsiveness (in case of iPad demo)
4. Rehearse presentation flow
5. Create backup plan (screenshots if live demo fails)

---

## Demo Flow Script (Suggested Timing)

### Introduction (1 min)
"Good morning. Today I'm showcasing the Public Notice Portal - a platform revolutionizing how councils, law firms, and residents interact with statutory public notices. We'll walk through 4 user perspectives."

### Segment 1: General Public (3 min)
1. Start at homepage
2. "Sarah is a resident who's heard about a new bar opening on her street..."
3. Search by postcode: SW1A 1AA
4. Show map view with clustered notices
5. Click into controversial notice (Soho Wine Bar)
6. Show 14 representations already submitted
7. Submit objection citing "Prevention of Public Nuisance"
8. Show email confirmation
9. **Key Takeaway**: "Residents have accessible, transparent way to engage"

### Segment 2: Legal Firm (4 min)
1. Auto-login as James Wilson, solicitor
2. Show dashboard: 47 active notices, £2,450 outstanding billing
3. "James is submitting a premises license application for a new client..."
4. Click "Publish New Notice"
5. Select notice type: Premises License - New Application
6. Choose upload method: OCR Scan
7. Upload sample PDF application
8. Show AI extraction of key details
9. Review form with validation (highlight any errors)
10. Preview published notice text
11. Submit for publication
12. Show billing update
13. **Key Takeaway**: "Firms save 80% time vs. traditional newspaper ads"

### Segment 3: Council Officer (4 min)
1. Auto-login as Emma Martinez, Bristol Licensing Officer
2. Show dashboard: 38 published, 3 pending approval, 15 representations unread
3. Navigate to "Pending Submissions"
4. Review notice from Wilson & Associates
5. "Emma needs to verify the application meets statutory requirements..."
6. Approve notice for publication
7. Navigate to "Representations"
8. View controversial notice with 12 objections
9. Mark representations as read
10. Show deadline warning (expires tomorrow - amber dot)
11. **Key Takeaway**: "Officers have complete oversight and workflow automation"

### Segment 4: Council Manager (3 min)
1. Auto-login as David Chen, Westminster Head of Regulatory
2. Show analytics dashboard
3. Highlight KPIs: 245 notices, 189 published, 1,342 representations
4. Show cost savings: £12,450 saved this quarter vs. newspaper
5. "Westminster processes 60-80 notices per month..."
6. Show department comparison: Licensing vs. Planning
7. Point out compliance rate: 98.5% meeting statutory deadlines
8. Show audit log for governance
9. Export sample report
10. **Key Takeaway**: "Managers get real-time insights and demonstrate value"

### Conclusion (1 min)
"The Public Notice Portal delivers transparency for residents, efficiency for firms, workflow automation for officers, and strategic insights for managers. Questions?"

**Total Time**: 15 minutes (allows 5 min Q&A in 20 min slot)

---

## File Structure for Demo

```
showcase-demo/
├── seed-demo-data.ts           # Database seeding script
├── demo-accounts.ts            # User account creation
├── sample-pdfs/                # Sample application PDFs for OCR
│   ├── premises-license-1.pdf
│   ├── planning-application-1.pdf
│   └── tro-notice-1.pdf
├── demo-config.ts              # Demo-specific configuration
├── qr-codes/                   # Generated QR codes for landing
│   ├── public-journey.png
│   ├── firm-journey.png
│   ├── officer-journey.png
│   └── manager-journey.png
└── presentation-notes.md       # Speaker notes for each segment
```

---

## Risk Mitigation

### What Could Go Wrong?
1. **Database connection issues**
   - **Mitigation**: Pre-seed data 24 hours before, verify connectivity

2. **OCR service unavailable**
   - **Mitigation**: Have pre-processed notices ready, show cached results

3. **Map tiles fail to load**
   - **Mitigation**: Use fallback static map or skip map portion

4. **Auth issues during demo**
   - **Mitigation**: Implement auth bypass for demo accounts, pre-login

5. **Data looks stale/unrealistic**
   - **Mitigation**: Calibrate dates to demo day, use realistic scenarios

### Backup Plan
- Take screenshots of each key screen
- Create slide deck mirroring demo flow
- Record video walkthrough as fallback

---

## Success Metrics

The demo will be successful if audience can:
1. **Understand the value proposition** for each user type
2. **See the workflow automation** in action
3. **Grasp the cost savings** potential
4. **Appreciate the transparency** for residents
5. **Ask informed questions** about implementation

---

## Post-Demo Cleanup

After presentation:
- [ ] Option 1: Keep demo data (toggle demo mode on/off)
- [ ] Option 2: Create reset script to clear demo data
- [ ] Archive demo accounts
- [ ] Save QR codes and landing page for future use

---

## Next Steps

1. **Review this roadmap** and confirm approach
2. **Prioritize phases** based on available time
3. **Start with Phase 1** (database seeding) - highest impact
4. **Build incrementally** and test each segment
5. **Rehearse presentation** with seeded data
6. **Prepare backup slides** as insurance

**Questions to Confirm:**
- Do you want the demo data permanently available or reset after?
- Should demo accounts be accessible via QR codes for audience?
- Any specific notice types or scenarios you want highlighted?
- Presentation format: laptop screen share, projector, iPad?
- Time allocation: 15 min? 30 min? 45 min?

---

## Estimated Timeline

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Database seeding (councils, notices, reps) | 4h | CRITICAL |
| 2 | Landing page with QR codes | 2h | HIGH |
| 3 | Demo accounts & auth bypass | 1h | CRITICAL |
| 4 | Visual polish & branding | 2h | MEDIUM |
| 5 | Analytics enhancements | 2h | HIGH |
| 6 | Testing & rehearsal | 1h | CRITICAL |
| **TOTAL** | | **12h** | |

**Recommendation**: If time is tight, focus on Phases 1, 3, 6. The core data and seamless navigation matter most. Visual polish can be added incrementally.

---

**Ready to build? Let's start with Phase 1 (database seeding) and create those compelling demo scenarios!**
