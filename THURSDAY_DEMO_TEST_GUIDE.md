# Thursday Demo Test Guide - Public Notice Portal

**Critical for Bristol Council Demo**

## Pre-Demo Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Database accessible
- [ ] Browser testing complete
- [ ] All workflows validated

---

## Test Scenario 1: Solicitor Publishes Notice

### Setup
- **URL**: http://localhost:5173/login
- **Account**: Professional Portal
- **Credentials**: `solicitor@wilsonpartners.com` / `SolicitorTest123!`

### Steps

1. **Login as Solicitor**
   - Navigate to http://localhost:5173/login
   - Click "Professional Portal"
   - Enter credentials: `solicitor@wilsonpartners.com` / `SolicitorTest123!`
   - Click "Sign in"
   - **Expected**: Redirect to `/f/wilson-partners/dashboard`

2. **Navigate to Publish**
   - Click "Publish Notice" button on dashboard
   - **Expected**: Redirect to `/f/wilson-partners/publish/step-1`

3. **Step 1: Select Notice Type**
   - Select "Premises Licence - New Application"
   - Click "Continue"
   - **Expected**: Move to step 2

4. **Step 2: Choose Template Mode**
   - Click "Structured template" tab
   - **Expected**: Template form appears

5. **Step 2: Fill Basic Details**
   - **Applicant name**: "Test Licensing Ltd"
   - **Premises name**: "The Demo Arms"
   - **Premises address Line 1**: "123 High Street"
   - **Premises address City**: "Bristol"
   - **Premises address Postcode**: "BS1 3XX"

6. **Step 2: Fill Activities & Hours**
   - Check "Sale of alcohol - On the premises"
   - For Monday-Sunday: Set times 11:00 - 23:00
   - **DPS Name**: "John Smith"
   - **DPS Licensing Authority**: "Bristol City Council"

7. **Step 2: Fill Dates**
   - **Application Date**: Today's date
   - **Representation Deadline**: 28 days from today
   - **Expected**: Auto-calculated

8. **Step 2: Fill Inspection Details**
   - **Inspection Location**: "At the premises"
   - **Inspection Times**: "Monday-Friday 09:00-17:00"

9. **Step 3: Review & Confirm**
   - Review all details
   - Click "Continue to Payment"
   - **Expected**: Move to step 4

10. **Step 4: Complete Payment**
    - Select payment method
    - Click "Publish Notice"
    - **Expected**: Success modal appears with notice ID

11. **Verify Notice ID**
    - Note the notice ID (e.g., `notice-abc-123`)
    - This will be used in Test Scenario 3

---

## Test Scenario 2: Council Views Notice

### Setup
- **URL**: http://localhost:5173/login
- **Account**: Council Portal
- **Credentials**: `licensing@sample.gov.uk` / `sample123`

### Steps

1. **Logout from Solicitor Account**
   - Click profile/logout
   - Or use incognito/private window

2. **Login as Council Officer**
   - Navigate to http://localhost:5173/login
   - Click "Council Portal"
   - Enter credentials: `licensing@sample.gov.uk` / `sample123`
   - Click "Sign in"
   - **Expected**: Redirect to `/c/sample-borough/licensing/dashboard`

3. **View Notices List**
   - Click "Notices" in sidebar
   - **Expected**: List of published notices appears

4. **Find Published Notice**
   - Search or scroll to find "The Demo Arms" notice
   - **Expected**: Notice appears in list with status "published"

5. **View Notice Details**
   - Click on the notice
   - **Expected**: Full notice details displayed
   - Verify: Applicant name, premises, dates, activities

6. **Check Representations Tab**
   - Click "Representations" tab
   - **Expected**: "No representations yet" or empty list
   - This will be populated in Test Scenario 4

---

## Test Scenario 3: Resident Submits Representation

### Setup
- **URL**: http://localhost:5173/notices
- **Account**: Public (no login required)
- **Notice ID**: From Test Scenario 1

### Steps

1. **Access Public Search**
   - Navigate to http://localhost:5173/notices
   - Or click "Find notices" from homepage

2. **Find the Notice**
   - Search for "The Demo Arms" or use map
   - Click on the notice card
   - **Expected**: Notice detail page opens

3. **Start Representation**
   - Scroll to "Submit a Representation" section
   - Click "Submit Representation" or "Respond" button
   - **Expected**: Representation form appears

4. **Fill Representation Form**
   - **Your Name**: "Jane Resident"
   - **Email**: "jane@example.com"
   - **Address**: "124 High Street, Bristol, BS1 3XX"
   - **Type**: Select "Objection"
   - **Grounds**: Check relevant licensing objectives
   - **Comments**: "I am concerned about noise levels affecting my property..."

5. **Submit Representation**
   - Click "Submit Representation"
   - **Expected**: Success message appears
   - Note confirmation number if shown

---

## Test Scenario 4: Council Sees Representation

### Setup
- **URL**: `/c/sample-borough/licensing/dashboard`
- **Account**: Already logged in from Test Scenario 2

### Steps

1. **Return to Council Portal**
   - If logged out, login again as `licensing@sample.gov.uk` / `sample123`

2. **Navigate to Notice**
   - Go to Notices
   - Find "The Demo Arms" notice
   - Click to view details

3. **View Representations Tab**
   - Click "Representations" tab
   - **Expected**: Jane Resident's representation appears

4. **Review Representation Details**
   - Verify: Name, email, type (Objection), comments
   - Check: Submission timestamp
   - **Expected**: All details match what was submitted

---

## Known Issues & Workarounds

### Issue 1: Field Name Mismatch in Tests
- **Status**: Fixed in test helpers
- **Impact**: Automated tests were failing
- **Fix**: Updated test selectors to match actual DOM structure

### Issue 2: Activities Section Complexity
- **Status**: Known limitation
- **Impact**: Complex interactive component not easily testable
- **Workaround**: Use manual testing or OCR upload mode

---

## Demo Day Checklist

### Before Demo
- [ ] Server is running and responsive
- [ ] Test database has clean state or sample data
- [ ] All test accounts work
- [ ] Browser is ready (clear cache)

### During Demo
- [ ] Start with professional portal workflow
- [ ] Show council portal immediately after
- [ ] Demonstrate public representation
- [ ] End with council viewing representation

### Backup Plans
- [ ] Have test data pre-loaded if publish fails
- [ ] Have screenshots of working flows
- [ ] Know how to restart server quickly

---

## Critical URLs

- **Homepage**: http://localhost:5173
- **Login**: http://localhost:5173/login
- **Public Search**: http://localhost:5173/notices
- **Firm Dashboard**: http://localhost:5173/f/wilson-partners/dashboard
- **Council Dashboard**: http://localhost:5173/c/sample-borough/licensing/dashboard

---

## Test Credentials Reference

| Portal | Email | Password | Purpose |
|--------|-------|----------|---------|
| Professional | `solicitor@wilsonpartners.com` | `SolicitorTest123!` | Publish notices |
| Council | `licensing@sample.gov.uk` | `sample123` | View/manage notices |
| Council (Alt) | `demo@council.gov.uk` | `demo123` | Westminster Council |

---

## Quick Smoke Test (5 minutes)

1. Login as solicitor ✓
2. Start publish flow ✓
3. Get to step 2 ✓
4. Login as council (separate window) ✓
5. View notices list ✓
6. Access public search ✓
7. View a notice detail ✓

If all 7 steps work, core functionality is operational.
