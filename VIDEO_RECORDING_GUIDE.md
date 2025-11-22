# Video Recording Guide - 2-Minute Demos

**Status**: ✅ Ready to Record
**Database**: Clean - 64 showcase notices, 40 representations, 13 submissions, 15 clients
**Date**: 2025-11-20

---

## Quick Start

1. **Start the dev server**: `npm run dev`
2. **Navigate to**: http://localhost:5173/showcase
3. **Record each segment**: Follow the scripts below
4. **Each video**: ~2 minutes max

---

## Section 1: Resident Search (2 min)

**Start URL**: http://localhost:5173/showcase → Click "Resident Search"
**Lands on**: http://localhost:5173/notices?postcode=SW1A1AA

### Script (2 minutes)

**[0:00-0:15] Introduction**
> "This is the Resident Search experience. Any member of the public can find notices affecting their area without needing to log in."

**[0:15-0:30] Address Search**
- Show the search bar at top
- Type: "Buckingham Palace Road, SW1"
- Show autocomplete suggestions appearing
- Click suggestion
- URL updates to `?postcode=SW1A1AA`

> "Residents can search by address or postcode. The system automatically geocodes locations and shows nearby notices."

**[0:30-0:50] Map View & Clustering**
- Click "Map View" toggle (top right)
- Show clustered markers on Westminster map
- Click a cluster to zoom/expand
- Click individual marker to show popup

> "The map uses clustering technology to show notice density. Click any marker to see details."

**[0:50-1:10] Radius Filtering**
- Show radius dropdown (current: 5km)
- Change to 2km
- Watch results update
- Notice count decreases

> "You can filter by radius - 1km up to 50km. Let's narrow it to 2 kilometers."

**[1:10-1:30] Notice Type Filtering**
- Click "Notice Types" dropdown
- Select "Licensing Act 2003" only
- Results filter to licensing notices only
- Show ~8-10 results

> "Filter by notice type - we have Licensing, Planning, Traffic Orders, Gambling, and more."

**[1:30-1:50] View Notice Details**
- Click on notice card: "The Orange Public House"
- Scroll down to show full notice text
- Show sidebar with "Have Your Say" card
- Point out deadline warning

> "Each notice shows full legal text, location, and a clear deadline. Residents can submit representations directly."

**[1:50-2:00] Email Alerts CTA**
- Scroll to "Get Email Alerts" section
- Show "Subscribe to Weekly Alerts" button

> "Residents can subscribe to weekly email alerts for their area. No account needed - just enter your postcode."

---

## Section 2: Public Applicant - Submit Representation (2 min)

**Start URL**: http://localhost:5173/showcase → Click "Public Applicant"
**Lands on**: http://localhost:5173/ (homepage)

### Script (2 minutes)

**[0:00-0:15] Introduction**
> "This is how members of the public submit representations on notices affecting their community."

**[0:15-0:30] Homepage Navigation**
- Show the homepage hero with search
- Scroll down to "Latest Notices" section
- Show 5 most recent notices

> "The public homepage shows the latest published notices across all councils."

**[0:30-0:50] Select a Notice**
- Click on "The Vintage House" (Westminster licensing notice)
- Show notice detail page loads
- Point out:
  - Notice type badge (Licensing Act 2003)
  - Premises address
  - Deadline countdown (e.g., "7 days left")

> "Let's view this licensing application for The Vintage House in Soho. It's requesting extended alcohol sales until 3am."

**[0:50-1:20] Submit Representation**
- Scroll to sidebar → "Have Your Say" card
- Click "Submit Your Representation" button
- Form loads at `/notices/:id/respond`
- Fill in form quickly:
  - Name: "Michael Chen"
  - Email: "m.chen@example.com"
  - Address: "123 High Street, London"
  - Type: Select "Objection"
  - Licensing Objectives: Check "Prevention of Public Nuisance"
  - Comments: "Increased noise levels at 3am will significantly affect local residents..."

> "Anyone can submit a representation. You select whether it's an objection or support, choose relevant licensing objectives, and explain your concerns."

**[1:20-1:45] Submit & Email Client**
- Click "Submit Representation"
- Show email client opens (mailto link)
- Email pre-filled with:
  - To: licensing@westminster.gov.uk
  - Subject: "Representation: The Vintage House"
  - Body: Full representation text with reference number

> "The system generates a formal email to the licensing authority with your representation and a unique reference number."

**[1:45-2:00] Confirmation**
- Show confirmation message: "Your representation has been submitted. Reference: REP-789012"
- Point out "Track Your Submission" link

> "You receive a reference number to track your submission. The council will review all representations before making a decision."

---

## Section 3: Law Firm - Publish Notice (2 min)

**Start URL**: http://localhost:5173/showcase → Click "Legal Firm"
**Lands on**: http://localhost:5173/f/wilson-partners

### Script (2 minutes)

**[0:00-0:15] Introduction & Dashboard**
> "This is the Wilson & Partners firm portal. Solicitors can publish notices on behalf of clients."

- Show dashboard landing page
- Point out key metrics:
  - Active notices
  - Clients
  - Billing overview

**[0:15-0:40] Client Management**
- Navigate to "Clients" tab
- Show client list
- Click on a client
- Show client detail page with notice history

> "Firms manage multiple clients. Each client has their own dashboard showing all notices and billing."

**[0:40-1:10] Active Notices**
- Navigate back to "Notices" tab
- Show list of published notices
- Click on a notice
- Show notice detail with billing status

> "All published notices are tracked with billing status, deadlines, and any representations received."

**[1:10-1:40] Publish New Notice (Quick Demo)**
- Click "Publish New Notice" button
- Show wizard step 1: Select notice type
- Select "Premises License - New Application"
- Click Next → Upload method screen
- Show 3 options:
  - Upload PDF (OCR extraction)
  - Manual entry
  - Use template

> "The wizard guides you through publishing. You can upload a PDF for automatic extraction, enter details manually, or use a council's custom template."

**[1:40-2:00] Cost Savings**
- Navigate back to dashboard
- Point out cost comparison

> "Firms save 90% compared to traditional newspaper advertising. Notices are published instantly and reach a wider audience online."

---

## Section 4: Council Officer - Review & Approve (2 min)

**Start URL**: http://localhost:5173/showcase → Click "Council Officer"
**Lands on**: http://localhost:5173/c/bristol-council/licensing

### Script (2 minutes)

**[0:00-0:15] Introduction & Department Dashboard**
> "This is the Bristol Council Licensing Department. Officers manage the full notice lifecycle."

- Show department dashboard
- Point out key metrics (published, pending, drafts, representations)

**[0:15-0:45] Pending Submissions**
- Navigate to "Pending Submissions" or notices list
- Show pending notices
- Click on a pending notice
- Review submission details

> "Firms submit notices that require council approval. Officers review each application for completeness and statutory compliance."

**[0:45-1:10] Review Actions**
- Show review options (if available in UI)
- Demonstrate approval workflow
- Point out consultation deadline setting

> "Officers can approve, request changes, or reject. Once approved, the system automatically calculates the consultation deadline and publishes the notice."

**[1:10-1:40] Manage Representations**
- Navigate to representations section
- Show list of representations
- Filter or sort as available
- View individual representation

> "All public representations are centralized. Officers can filter, mark as read, and export for committee reports."

**[1:40-2:00] Deadline Warnings**
- Show notices with approaching deadlines
- Point out deadline countdown or warnings

> "The system provides proactive deadline warnings so no consultation periods are missed. This ensures statutory compliance."

---

## Section 5: Council Manager - Analytics & Insights (2 min)

**Start URL**: http://localhost:5173/showcase → Click "Council Manager"
**Lands on**: http://localhost:5173/c/westminster-city-of-council/licensing/analytics

### Script (2 minutes)

**[0:00-0:15] Introduction & Analytics Dashboard**
> "This is the Westminster Council analytics dashboard. Senior managers get strategic insights across all departments."

- Show analytics landing page
- Point out main KPI cards

**[0:15-0:45] Notice Volume Trends**
- Show charts/graphs if available
- Point out trends over time

> "Track notice volume trends over time. This shows seasonal patterns and department workload."

**[0:45-1:10] Cost Savings Analysis**
- Show cost comparison data
- Highlight savings percentage

> "Westminster has saved thousands of pounds by moving from newspaper advertising to the digital platform."

**[1:10-1:35] Public Engagement Metrics**
- Show representation statistics
- Breakdown by type (objection/support)
- Breakdown by notice type

> "Track public engagement. This shows how actively the community participates in consultations."

**[1:35-1:55] Compliance Monitoring**
- Show compliance metrics
- On-time publication rates
- Statutory deadline adherence

> "Compliance monitoring ensures statutory deadlines are met and the council maintains high standards."

**[1:55-2:00] Export & Reporting**
- Point out export/download options

> "All data can be exported for board meetings, FOI requests, or audit purposes."

---

## Pre-Recording Checklist

Before you start recording:

### General Setup
- [ ] `npm run dev` running
- [ ] Browser window at good resolution
- [ ] Browser zoom at 100%
- [ ] Clear browser cache
- [ ] Close unnecessary tabs

### Section-Specific Verification
- [ ] `/showcase` page loads correctly
- [ ] All 5 demo cards visible and clickable
- [ ] Stats show: 349 councils, 64 notices, 40 representations, 12 submissions

---

## Recording Tips

1. **Pacing**: Speak slowly and clearly
2. **Mouse Movement**: Move cursor smoothly
3. **Pauses**: Let pages load completely
4. **Highlight**: Use cursor to point out key features
5. **Retakes**: Re-record any mistakes

---

## Database Summary (Current State)

**Total Notices**: 64
- Published: 53
- Pending Approval: 3
- Draft: 8

**By Type**:
- Licensing: 23
- Planning: 20
- Gambling: 5
- GVOL: 4
- Traffic Orders: 8
- Other: 4

**Representations**: 40 (20 objections, 20 support)
**Submissions**: 13 (6 new, 3 under review, 2 changes requested, 2 accepted)
**Clients**: 15
**Firms**: 2
**Councils**: 349 total

---

## Quick Test

```bash
npm run dev

# Test URLs load:
# http://localhost:5173/showcase
# http://localhost:5173/notices?postcode=SW1A1AA
# http://localhost:5173/
# http://localhost:5173/f/wilson-partners
# http://localhost:5173/c/bristol-council/licensing
# http://localhost:5173/c/westminster-city-of-council/licensing/analytics
```

All good? You're ready to record! 🎬
