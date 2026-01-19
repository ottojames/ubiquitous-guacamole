# FINAL TEST GUIDE - Comprehensive Testing
**Open alongside TESTING_LOG_FINAL.md**
**Server running at http://localhost:5173**

**Login Credentials:**
- Westminster: licensing@westminster.gov.uk / testpass123
- Wilson Partners: solicitor@wilsonpartners.com / testpass123
- Sampletonborough: licensing@sampletonborough.gov.uk / testpass123

---

## SECTION A: NEWLY FIXED ITEMS

### FIX-007: Council Auto-Population
1. Go to http://localhost:5173/publish/step-1
2. Select **"New Premises Licence"**
3. Navigate to Step 3
4. Under "Licensing Authority", type: **sample**
5. Click **"Sampletonborough Council"** from dropdown
6. **VERIFY:** Authority Address auto-fills: "1 Town Hall Square, Sampletonborough SB1 1AA"
7. **VERIFY:** Authority Email auto-fills: "info@sampletonborough.gov.uk"
8. **VERIFY:** Online Register URL auto-fills: "https://www.sampletonborough.gov.uk/licensing/register"

---

### FIX-011: Registration Wizard
1. Go to http://localhost:5173/login
2. Click **"Council Portal"**
3. Click **"Sign up for free"** or "don't have an account create one here"
4. **VERIFY:** Goes to /register/council
5. Complete all 6 steps
6. **VERIFY:** Registration completes without RLS error
7. **VERIFY:** Can log in with new account
8. Repeat for **"Professional Portal"** → /register/firm

---

### ENHANCEMENT-001: Distance Filter
1. Go to http://localhost:5173/notices
2. Type **SW1A 1AA** and select address
3. **VERIFY:** Notice cards show distance (e.g., "0.3 km away")
4. Look for sort dropdown above notice list
5. **VERIFY:** Can sort by "Nearest"
6. **VERIFY:** Notices reorder by distance

---

## SECTION B: COUNCIL PORTAL TESTING

### US-0002: Fix Council Notice Retrieval
1. Login as Westminster: licensing@westminster.gov.uk / testpass123
2. Navigate to **Notices** section
3. Click on any notice in the list
4. **VERIFY:** Notice detail opens (not "notice could not be retrieved")

---

### US-0003: Fix Council Representations Loading
1. Stay logged in as Westminster
2. Navigate to **Representations** section
3. **VERIFY:** Representations list loads (not "failed to load representations")
4. Click on a representation
5. **VERIFY:** Can view details

---

### US-0004: Fix Council Analytics Loading
1. Stay logged in as Westminster
2. Navigate to **Analytics** section
3. **VERIFY:** Analytics widgets load (not "failed to load analytics data")
4. **VERIFY:** Charts render properly

---

### US-0012: Improve Department Switching UX
1. Stay logged in as Westminster
2. Look for current department display (e.g., "Licensing Department")
3. Click **"Switch Department"** button
4. **VERIFY:** Can see both Licensing and Planning options
5. Select Planning
6. **VERIFY:** URL changes to /planning/dashboard
7. **VERIFY:** Dashboard shows Planning data

---

### US-0013: Research Department Dashboards
1. While in Licensing department
2. **VERIFY:** Dashboard shows licensing-specific KPIs:
   - Active applications
   - Consultation periods ending soon
   - Representation counts
3. Switch to Planning
4. **VERIFY:** Dashboard shows planning-specific KPIs

---

### US-0125: Licensing Dashboard Widgets
1. Login as Sampletonborough: licensing@sampletonborough.gov.uk / testpass123
2. **VERIFY:** Dashboard shows:
   - Active applications widget
   - Urgent deadlines (color coded)
   - Representation activity
   - Processing metrics

---

### US-0126: Assign Representation To Officer
1. Navigate to **Representations**
2. Find a representation with **"Assign"** button
3. Click Assign
4. **VERIFY:** Modal opens with team member list
5. Select an officer
6. **VERIFY:** Representation shows assigned officer name

---

### US-0127: Mark Representation Reviewed
1. Click on a representation to view details
2. Look for **"Mark as Reviewed"** button
3. Click it
4. **VERIFY:** Shows "Reviewed by [name] on [date]" badge
5. Go back to list
6. **VERIFY:** Can filter by "Reviewed" status

---

### US-0128: Internal Notes On Representations
1. Open a representation detail
2. Look for **"Internal Notes"** or **"Internal Comments"** section
3. Add a note: "Test internal comment"
4. **VERIFY:** Note appears with your name and timestamp
5. **VERIFY:** Note is only visible in council portal

---

### US-0129: Export Reps For Idox
1. Go to Representations list
2. Look for **"Export for Idox"** button
3. Click it
4. **VERIFY:** CSV file downloads
5. Open CSV
6. **VERIFY:** Has correct columns for Idox import

---

## SECTION C: FIRM PORTAL TESTING

### US-0005: Fix Firm Payment Button
1. Login as Wilson Partners: solicitor@wilsonpartners.com / testpass123
2. Navigate to Dashboard
3. Find **"Make Payment"** button
4. Click it
5. **VERIFY:** Payment page/modal opens (not nothing)

---

### US-0006: Fix Firm View Client Notices
1. Navigate to **Clients** page
2. Find a client with **"View Notices"** link
3. Click it
4. **VERIFY:** Shows client's notices (not redirect to homepage)

---

### US-0007: Implement Firm Notices Page
1. Navigate to **Notices** section
2. **VERIFY:** Shows list of firm's published notices (not "coming soon")
3. **VERIFY:** Can filter and search
4. Click a notice
5. **VERIFY:** Notice details open

---

### US-0008: Implement Firm Billing Page
1. Navigate to **Billing** section
2. **VERIFY:** Shows billing information (not "coming soon")
3. **VERIFY:** Shows subscription details
4. **VERIFY:** Shows invoices

---

### US-0009: Fix Firm Team Page Loading
1. Navigate to **Team** section
2. **VERIFY:** Page loads without infinite spinner
3. **VERIFY:** Shows team members or empty state

---

### US-0010: Fix Firm Settings Notice Filter
1. Navigate to **Settings**
2. Select only **"Licensing"** and **"Planning"** checkboxes
3. Save settings
4. Navigate to **Publish Notice** → Step 1
5. **VERIFY:** Only licensing and planning types show

---

### US-0148: Licensing Quick Publish
1. Go to firm Dashboard
2. Find **"Quick Publish"** widget
3. Select a repeat client from dropdown
4. Click proceed
5. **VERIFY:** Wizard pre-fills with client details

---

### US-0149: Client Management
1. Navigate to **Clients** page
2. Click **"Add Client"** button
3. Fill in test client details
4. Save
5. **VERIFY:** Client appears in list
6. Click client
7. **VERIFY:** Can view/edit details

---

### US-0150: Live Representation Feed
1. Go to Dashboard
2. Find **"Recent Representations"** widget
3. **VERIFY:** Shows recent representations (last 7 days)
4. **VERIFY:** Shows stance, date, preview
5. Click one
6. **VERIFY:** Opens full details

---

### US-0151: Consultation Countdown
1. Navigate to **Notices** page
2. Look at notice cards
3. **VERIFY:** Shows countdown (e.g., "5 days remaining")
4. **VERIFY:** Color coding: Red <7 days, Amber 7-14, Green >14
5. Check Dashboard for **"Upcoming Deadlines"** widget

---

## Testing Tips:
- Use Chrome browser for all tests
- Keep console open to note any errors
- Take screenshots of failures
- Be specific in comments about what failed

The servers are running - ready to test all 22 items!