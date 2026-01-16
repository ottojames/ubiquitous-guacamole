# FINAL TEST GUIDE - Ralph's Latest Fixes
**Open alongside TESTING_LOG_FINAL.md**
**Server running at http://localhost:5173**

---

## FIX-002: Address Search Single-Click

### Test Steps:
1. Go to http://localhost:5173/notices
2. Type: **SW1A 1AA**
3. Wait for dropdown to appear
4. Click **"Buckingham Palace Garden"** or any address ONCE
5. **Expected:** Map loads immediately with notices visible
6. **Write:** Does it work with single click? Are notices shown?

---

## FIX-003: Map View 70/30 Split

### Test Steps:
1. After address search (or go to http://localhost:5173/notices?view=map)
2. Look at the layout split
3. **Expected:** Map takes 70% width, list takes 30%
4. **Expected:** Cards are cleaner, better spacing
5. **Expected:** Scrolling works smoothly
6. **Write:** Does it look good? Not crowded anymore?

---

## FIX-004: DPS Field Removal

### Test Steps:
1. Go to http://localhost:5173/publish/step-1
2. Select **"New Premises Licence"**
3. Navigate to Step 3 (fill required fields to proceed)
4. Look at the activities section
5. **Expected:** NO "Designated Premises Supervisor" field anywhere
6. **Write:** Is DPS field completely gone?

---

## FIX-007: Council Auto-Population

### Test Steps:
1. Still in publish wizard Step 3
2. Under "Licensing Authority", type: **sample**
3. Click **"Sampletonborough Council"** from dropdown
4. **Expected:** Authority Address auto-fills: "1 Town Hall Square, Sampletonborough SB1 1AA"
5. **Expected:** Authority Email auto-fills: "info@sampletonborough.gov.uk"
6. **Expected:** Online Register URL auto-fills: "https://www.sampletonborough.gov.uk/licensing/register"
7. **Write:** Did all fields auto-populate?

---

## FIX-011: Registration Wizard

### Test Steps:
1. Go to http://localhost:5173/login
2. Click **"Council Portal"**
3. Click **"Sign up for free"**
4. **Expected:** Goes directly to /register/council (not generic /register)
5. Fill all steps:
   - Step 1: Welcome
   - Step 2: Council name, type, region
   - Step 3: Select departments
   - Step 4: Authority details
   - Step 5: Admin account (email/password)
   - Step 6: Review and complete
6. **Expected:** Registration completes successfully
7. **Expected:** Can log in with new account
8. **Write:** Did registration complete? Can you log in?

### Also Test Firm Registration:
1. Go to http://localhost:5173/login
2. Click **"Professional Portal"**
3. Click **"Sign up for free"**
4. **Expected:** Goes directly to /register/firm
5. Complete all 7 steps
6. **Write:** Does firm registration work too?

---

## QUICK VERIFICATION

✅ **All Working** = Ralph successfully fixed everything
❌ **Still Issues** = Note which items still fail

The servers are running - ready to test!