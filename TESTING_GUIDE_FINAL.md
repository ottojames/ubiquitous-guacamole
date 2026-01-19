# FINAL TEST GUIDE - Ralph's Latest Fixes
**Open alongside TESTING_LOG_FINAL.md**
**Server running at http://localhost:5173**

**Demo Login Credentials:**
- Westminster: licensing@westminster.gov.uk / testpass123
- Wilson Partners: solicitor@wilsonpartners.com / testpass123
- Sampletonborough: licensing@sampletonborough.gov.uk / testpass123

---

## 🔴 SECTION A: CRITICAL FIXES - Test These First!

### CRITICAL-001: Password Validation Fix
**Ralph's Fix:** Demo accounts should now work with testpass123
1. Go to http://localhost:5173/login
2. Click **Council Portal**
3. Enter: licensing@westminster.gov.uk / testpass123
4. Click **Sign In**
5. **VERIFY:** Should login without "password must have uppercase, lowercase, etc." error
6. **ALSO CHECK:** "Don't have an account? Create one here" text should be WHITE

---

### FIX-007: Council Auto-Population
**Ralph's Fix:** Fixed array type error in form field
1. Go to http://localhost:5173/publish/step-1
2. Select **"New Premises Licence"**
3. Click **Next** to Step 2
4. Select **"Use structured template"** (should be default)
5. Click **Next** to Step 3
6. In "Licensing Authority" field, type: **sample**
7. Click **"Sampletonborough Council"** from dropdown
8. **VERIFY:** These fields auto-fill:
   - Authority Address: "1 Town Hall Square, Sampletonborough SB1 1AA"
   - Authority Email: "info@sampletonborough.gov.uk"
   - Online Register URL: "https://www.sampletonborough.gov.uk/licensing/register"

---

### FIX-011: Registration Wizard
**Ralph's Fix:** Fixed undefined error, added password confirmation
1. Go to http://localhost:5173/login
2. Click **Council Portal**
3. Click **"Sign up for free"**
4. Complete all steps:
   - Step 1: Welcome
   - Step 2: Council Info
   - Step 3: Departments
   - Step 4: Authority Details
   - Step 5: Admin Account (LOOK FOR: password confirmation field)
   - Step 6: Review & Complete
5. Click **Complete Registration**
6. **VERIFY:** No "Cannot read properties of undefined" error
7. **VERIFY:** Registration completes successfully

---

### ENHANCEMENT-001: Distance Filter UI
**Ralph's Fix:** Added sort dropdown INSIDE the right-hand list
1. Go to http://localhost:5173/notices
2. Type **SW1A 1AA** and select an address
3. Map view should load
4. Look at the right-hand notice list panel
5. **VERIFY:** "Sort by:" dropdown at TOP of the right-hand list
6. **VERIFY:** Options include: Nearest, Recently Added, Newly Added, Ending Soon
7. **VERIFY:** Notice cards show distance (e.g., "0.3 km away")

---

## 🟢 SECTION B: COUNCIL PORTAL TESTING

### Login First:
1. Go to http://localhost:5173/login
2. Click **Council Portal**
3. Login: licensing@westminster.gov.uk / testpass123

### US-0002: Council Notice Retrieval
1. Click **Notices** in sidebar
2. Look for **"The Crown Tavern"** notice
3. Click on it
4. **VERIFY:** Notice details open (not "notice could not be retrieved")

### US-0003: Representations Loading
1. Click **Representations** in sidebar
2. **VERIFY:** List loads with 6 test representations
3. **VERIFY:** No "failed to load representations" error

### US-0004: Analytics Loading
1. Click **Analytics** in sidebar
2. **VERIFY:** Widgets show data (52 notices, 11 representations)
3. **VERIFY:** Charts render properly

### US-0012: Department Switching
1. Look for current department (e.g., "Licensing Department")
2. Click **Switch Department**
3. Select **Planning**
4. **VERIFY:** URL changes to /planning/dashboard

### US-0013: Department Dashboards
1. In Licensing: Check for licensing-specific widgets
2. Switch to Planning: Check for different widgets
3. **VERIFY:** Dashboards are different

### US-0125: Licensing Widgets
1. Login as Sampletonborough: licensing@sampletonborough.gov.uk / testpass123
2. **VERIFY:** Shows licensing-specific widgets

### US-0126: Assign Representation
1. Go to Representations
2. Click **Assign** button on any representation
3. **VERIFY:** Modal opens with team members

### US-0127: Mark as Reviewed
1. Click on a representation
2. Click **Mark as Reviewed**
3. **VERIFY:** Shows "Reviewed by [name] on [date]"

### US-0128: Internal Notes
1. In representation detail
2. Find **Internal Notes** section
3. Add a test note
4. **VERIFY:** Note appears with timestamp

### US-0129: Export for Idox
1. In Representations list
2. Click **Export for Idox**
3. **VERIFY:** CSV downloads

---

## 🔵 SECTION C: FIRM PORTAL TESTING

### Login First:
1. Go to http://localhost:5173/login
2. Click **Professional Portal**
3. Login: solicitor@wilsonpartners.com / testpass123

### US-0005: Payment Button
1. On Dashboard, find **Make Payment** button
2. Click it
3. **VERIFY:** Payment page/modal opens

### US-0006: View Client Notices
1. Go to **Clients**
2. Click **View Notices** on a client
3. **VERIFY:** Shows filtered notices

### US-0007: Notices Page
1. Click **Notices** in sidebar
2. **VERIFY:** Shows firm's notices (not "coming soon")

### US-0008: Billing Page
1. Click **Billing** in sidebar
2. **VERIFY:** Shows billing info (not "coming soon")

### US-0009: Team Page
1. Click **Team** in sidebar
2. **VERIFY:** Loads without infinite spinner

### US-0010: Settings Filter
1. Go to **Settings**
2. Select only **Licensing** and **Planning**
3. Save
4. Go to **Publish Notice**
5. **VERIFY:** Only shows those notice types

### US-0148: Quick Publish
1. On Dashboard, find **Quick Publish** widget
2. Select a client
3. **VERIFY:** Pre-fills client details

### US-0149: Client Management
1. Go to **Clients**
2. Click **Add Client**
3. **VERIFY:** Can add/edit clients

### US-0150: Recent Representations
1. On Dashboard, find **Recent Representations** widget
2. **VERIFY:** Shows recent items

### US-0151: Consultation Countdown
1. Go to **Notices**
2. **VERIFY:** Cards show countdown (e.g., "5 days remaining")
3. **VERIFY:** Color coding (red <7, amber 7-14, green >14)

---

## Testing Priority:
1. **FIRST:** Test CRITICAL-001 (login) - if this fails, stop
2. **THEN:** Test other Section A items
3. **FINALLY:** Test Sections B and C

The server is running - ready to test!