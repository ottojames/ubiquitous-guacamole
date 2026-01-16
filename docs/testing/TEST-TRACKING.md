# Test Tracking Dashboard - Phase 1 Verification
Generated: 2026-01-16
Tester: Otto Clarke
Status: 0/49 Verified

---

## 🎯 Testing Protocol

### How to Test Like a Senior Developer:
1. **Start servers**: `npm run dev` (both frontend :5173 and API :5174 must be running)
2. **Test in Chrome**: Use incognito mode for auth testing
3. **Document everything**: Screenshot failures, copy error messages
4. **Test edge cases**: Try invalid inputs, refresh pages, use back button
5. **Verify database**: Check Supabase dashboard for actual data creation

### Test Status Legend:
- ⬜ Not Tested
- 🟨 Testing in Progress
- ✅ PASS - Works as specified
- ⚠️ PARTIAL - Some features work, some don't
- ❌ FAIL - Doesn't work or has errors
- 🔧 FIXED - Was broken, now fixed and retested

---

## 📋 PRIORITY: Critical Fixes to Test First (12 items)

### Authentication & Access
⬜ **3.1 FIX-001**: Demo Authentication for Council and Firm Portals
   - Test accounts:
     - [ ] licensing@sampletonborough.gov.uk / testpass123
     - [ ] licensing@westminster.gov.uk / testpass123
     - [ ] solicitor@wilsonpartners.com / testpass123
   - Evidence needed: Screenshot of successful login and redirect to correct portal
   - Ralph's claim: "PARTIAL SUCCESS - Sampletonborough working"

⬜ **3.10 FIX-010**: Email/Password Authentication (Replaced Magic Link)
   - [ ] Email/password login works
   - [ ] Password complexity requirements enforced (8 chars, upper, lower, number, special)
   - [ ] "Remember Me" checkbox works (30-day cookie)
   - [ ] Forgot Password flow works
   - Test URL: http://localhost:5173/auth/signin

### Search & Map UX
⬜ **3.2 FIX-002**: Address Search Single-Click
   - [ ] Type "SW1A 1AA" in search box
   - [ ] Dropdown appears within 500ms
   - [ ] Single click on address triggers search (not double-click)
   - [ ] Defaults to map view (not list view)
   - Test URL: http://localhost:5173/notices

⬜ **3.3 FIX-003**: Map View 70/30 Split Layout
   - [ ] Map takes exactly 70% width
   - [ ] Notice list takes exactly 30% width
   - [ ] Notice cards not "crowded and squeezed"
   - [ ] Smooth scrolling in notice list
   - [ ] Map zoom/pan not "trippy"

⬜ **3.9 FIX-009**: Remove Radius Circle from Notice Detail
   - [ ] Only single red pin shown (no radius circle)
   - [ ] Map remains interactive
   - [ ] Appropriate zoom level
   - Test URL: http://localhost:5173/notices/{any-notice-id}

### Publish Wizard
⬜ **3.4 FIX-004**: Remove Unnecessary Fields
   - Fields that should NOT appear:
     - [ ] Applicant status field - GONE
     - [ ] Trading name field - GONE
     - [ ] Applicant address (duplicate) - GONE
     - [ ] Company number - GONE
     - [ ] DPS field - GONE
     - [ ] Publication date - GONE
     - [ ] Authority phone - GONE
   - Test URL: http://localhost:5173/publish/step-1

⬜ **3.5 FIX-005**: Field Ordering - Sale of Alcohol
   - [ ] "Sale of Alcohol" appears at TOP of activities list
   - [ ] Positioned immediately below "Opening Hours"
   - Test: Create new premises licence application

⬜ **3.6 FIX-006**: Councils Dropdown Loading
   - [ ] Sampletonborough Council appears in dropdown
   - [ ] Westminster Council appears in dropdown
   - [ ] No "No councils in database" error
   - Test in: Publish wizard step 3

⬜ **3.12 FIX-012**: Default to Structured Template
   - [ ] Step 2 defaults to "Use structured template" (not "Upload")
   - Test URL: http://localhost:5173/publish/step-2

### Council Features
⬜ **3.7 FIX-007**: Council Settings Auto-Population
   - [ ] Council can set authority_address in settings
   - [ ] Council can set authority_email in settings
   - [ ] Council can set online_register_url in settings
   - [ ] These auto-populate in publish wizard when council selected
   - Test URL: http://localhost:5173/c/{org}/{dept}/settings

⬜ **3.8 FIX-008**: Representation Forms on ALL Notices
   - [ ] Every notice has "Submit Your Representation" button
   - [ ] Form shows appropriate grounds for notice type:
     - [ ] Licensing: 4 objectives
     - [ ] Planning: 11 material considerations
     - [ ] Traffic: 9 traffic concerns
   - [ ] Anonymous submission works
   - [ ] Mandatory fields enforced

### Registration
⬜ **3.11 FIX-011**: Registration Questionnaire Wizard
   - [ ] Council registration: 6-step wizard with progress bar
   - [ ] Firm registration: 7-step wizard with progress bar
   - [ ] Authority details MANDATORY for councils
   - [ ] Practice areas selection saves correctly
   - Test URLs:
     - http://localhost:5173/register
     - http://localhost:5173/register/council
     - http://localhost:5173/register/firm

---

## 📋 User Stories to Test (37 items)

### Public Portal
⬜ **2.1 US-0001**: Fix Public Notice Detail Page
   - [ ] Search postcode S325UY
   - [ ] Increase radius to 5km
   - [ ] Click "The Pilot Inn" notice
   - [ ] Click "View Notice"
   - [ ] Notice details load (not "notice not found")
   - [ ] Can submit representation

⬜ **2.21 US-0108**: One Click Address Select
   - [ ] Navigate to /notices
   - [ ] Type "SW1A 1AA"
   - [ ] Click address once (not twice)
   - [ ] Map loads immediately

⬜ **2.22 US-0109**: Radius Filters Before Search
   - [ ] Radius buttons visible before searching (500m, 1km, 2km, 5km)
   - [ ] Can select radius before typing postcode
   - [ ] Selected radius applies when address clicked

### Council Portal (Requires working council login)
⬜ **2.2 US-0002**: Fix Council Notice Retrieval
   - [ ] Login to council portal
   - [ ] Navigate to Notices
   - [ ] Click any notice
   - [ ] Notice detail opens successfully

⬜ **2.3 US-0003**: Fix Council Representations Loading
   - [ ] Navigate to Representations
   - [ ] List loads without error
   - [ ] Can view representation details
   - [ ] Can add internal comments

⬜ **2.4 US-0004**: Fix Council Analytics Loading
   - [ ] Navigate to Analytics
   - [ ] All widgets load
   - [ ] Charts render
   - [ ] Data is department-filtered

⬜ **2.12 US-0012**: Department Switching UX
   - [ ] Current department clearly displayed
   - [ ] Switch Department button works
   - [ ] Switching updates dashboard data
   - [ ] URL updates to new department

⬜ **2.13 US-0013**: Department-Specific Dashboards
   - [ ] Licensing dashboard shows licensing KPIs
   - [ ] Planning dashboard shows planning KPIs
   - [ ] Environmental dashboard shows environmental KPIs

⬜ **2.14 US-0014**: Template Matching System
   - [ ] Create template with {{placeholders}}
   - [ ] Submit notice via form
   - [ ] Placeholders replaced correctly
   - [ ] No {{}} syntax in final notice

⬜ **2.15 US-0015**: All Templates Created
   - [ ] Run seed script works
   - [ ] 17 templates in database
   - [ ] All notice types covered

⬜ **2.25 US-0125**: Licensing Dashboard Widgets
   - [ ] Shows active applications
   - [ ] Shows urgent deadlines (color coded)
   - [ ] Shows representation activity
   - [ ] Shows processing metrics

⬜ **2.26 US-0126**: Assign Representation to Officer
   - [ ] Can assign representation
   - [ ] Officer name shows in list
   - [ ] Can filter by "Assigned to me"

⬜ **2.27 US-0127**: Mark Representation Reviewed
   - [ ] "Mark as Reviewed" button works
   - [ ] Shows reviewer name and timestamp
   - [ ] Can filter by reviewed status

⬜ **2.28 US-0128**: Internal Notes on Representations
   - [ ] Can add internal notes
   - [ ] Notes show author and timestamp
   - [ ] Notes NOT visible on public page

⬜ **2.29 US-0129**: Export Representations for Idox
   - [ ] "Export for Idox" button present
   - [ ] CSV downloads with correct columns
   - [ ] Respects current filters

### Firm Portal (Requires working firm login)
⬜ **2.5 US-0005**: Fix Firm Payment Button
   - [ ] Login to firm portal
   - [ ] Click "Make Payment"
   - [ ] Navigates to billing page

⬜ **2.6 US-0006**: Fix Firm View Client Notices
   - [ ] Navigate to Clients
   - [ ] Click "View Notices" on client
   - [ ] Shows client's notices (not homepage)

⬜ **2.7 US-0007**: Firm Notices Page
   - [ ] Navigate to Notices
   - [ ] Shows firm's notices
   - [ ] Filters work
   - [ ] Search works

⬜ **2.8 US-0008**: Firm Billing Page
   - [ ] Shows subscription details
   - [ ] Shows invoices
   - [ ] Shows payment history

⬜ **2.9 US-0009**: Fix Firm Team Page
   - [ ] Page loads (no infinite spinner)
   - [ ] Shows team members
   - [ ] Can invite members

⬜ **2.10 US-0010**: Firm Settings Notice Filter
   - [ ] Select only Licensing + Planning in settings
   - [ ] Save settings
   - [ ] Publish page shows ONLY those types

⬜ **2.32 US-0145**: Firm Registration Wizard
   - [ ] /register/firm loads wizard
   - [ ] Practice areas selection works
   - [ ] Creates firm account

⬜ **2.33 US-0146**: Practice Area Selection
   - [ ] Can edit practice areas in settings
   - [ ] Changes update dashboard
   - [ ] Confirmation dialog when unchecking

⬜ **2.34 US-0148**: Quick Publish for Repeat Clients
   - [ ] Quick Publish button on dashboard
   - [ ] Client dropdown shows clients
   - [ ] Selecting client pre-populates form

⬜ **2.35 US-0149**: Client Management
   - [ ] Clients page loads
   - [ ] Can add new client
   - [ ] Can edit client details
   - [ ] Can view client notices

⬜ **2.36 US-0150**: Live Representation Feed
   - [ ] Recent Representations widget on dashboard
   - [ ] Shows last 7 days
   - [ ] Updates in real-time

⬜ **2.37 US-0151**: Consultation Countdown
   - [ ] Notice cards show countdown
   - [ ] Color coding works (<7 red, <14 amber, >14 green)
   - [ ] Upcoming Deadlines widget works

### Publish Wizard (Core Flow)
⬜ **2.11 US-0011**: Fix Wizard Step 4 Submit
   - [ ] Navigate through all 4 steps
   - [ ] Step 4 submit creates notice
   - [ ] Redirects to confirmation
   - [ ] Notice appears in database

⬜ **2.19 US-0028**: Fix Publish Wizard Submit Button
   - [ ] Submit button shows loading state
   - [ ] Shows clear error messages
   - [ ] Handles errors visibly

⬜ **2.20 US-0029**: Submit Error Handling
   - [ ] Missing fields show specific errors
   - [ ] API errors display clearly
   - [ ] Server logs errors

### Blue Notice PDFs
⬜ **2.23 US-0117**: Generate Blue Notice PDF
   - [ ] Download button on confirmation page
   - [ ] PDF downloads successfully
   - [ ] Has blue background
   - [ ] Has QR code
   - [ ] Has display instructions

⬜ **2.24 US-0118**: Blue Notice Templates
   - [ ] Different templates for each type
   - [ ] New premises: "NOTICE OF APPLICATION"
   - [ ] Variation: "NOTICE OF VARIATION"
   - [ ] Transfer: "NOTICE OF TRANSFER"

⬜ **2.25 US-0119**: Blue Notice QR Code
   - [ ] QR code at bottom-center
   - [ ] Links to /notices/{id}
   - [ ] Phone can scan successfully

⬜ **2.26 US-0120**: Blue Notice Display Instructions
   - [ ] Shows "Display for 28 days from X to Y"
   - [ ] Shows "Must be clearly visible"

### Demo Mode
⬜ **2.16 US-0025**: Remove Demo Logins from Council
   - [ ] No demo accounts on council login
   - [ ] Only shows support contact

⬜ **2.17 US-0026**: Remove Demo Logins from Firm
   - [ ] No demo accounts on firm login
   - [ ] Only shows support contact

⬜ **2.18 US-0027**: Safe Demo Access
   - [ ] With VITE_DEMO_MODE=true: shows demo accounts
   - [ ] Without VITE_DEMO_MODE: no demo accounts
   - [ ] Amber "Demo Mode" warning when enabled

---

## 📊 Testing Progress Summary

| Category | Total | Tested | Pass | Partial | Fail |
|----------|-------|--------|------|---------|------|
| Critical Fixes | 12 | 0 | 0 | 0 | 0 |
| User Stories | 37 | 0 | 0 | 0 | 0 |
| **TOTAL** | **49** | **0** | **0** | **0** | **0** |

**Completion: 0%**

---

## 🔍 How to Use This Document

1. **Start with Critical Fixes** - These affect everything else
2. **Test systematically** - One section at a time
3. **Update status immediately** - Change ⬜ to appropriate emoji
4. **Document failures** in TEST-RESULTS.md
5. **Move verified items** to VERIFIED-COMPLETE.md
6. **Track fixes needed** in NEEDS-WORK.md

## Next Steps After Testing

```bash
# When you find something that works:
echo "✅ FIX-002: Address search single-click - VERIFIED WORKING" >> docs/verified/VERIFIED-COMPLETE.md

# When you find something broken:
echo "❌ FIX-001: Westminster login - Returns 'Invalid credentials'" >> docs/needs-work/NEEDS-WORK.md

# Create new ticket for Ralph:
echo "- [ ] Fix Westminster authentication issue" >> RALPH-FIXES.md
```