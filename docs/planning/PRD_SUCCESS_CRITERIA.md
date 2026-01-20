# PRD Success Criteria - MANDATORY RULES

**CRITICAL**: Ralph Loop was marking items as "passing" based on code existing, NOT actual functionality. This is WRONG.

## ✅ What "passes: true" ACTUALLY Means

An item can ONLY be marked `passes: true` when:

1. **Code is written** ✓
2. **Dev server runs without errors** ✓
3. **Feature tested MANUALLY in Chrome browser** ✓
4. **Feature ACTUALLY WORKS as described** ✓
5. **Evidence includes: "BROWSER TESTED: [what was tested]"** ✓

## ❌ What Does NOT Count as Passing

- ❌ "Component file exists"
- ❌ "Code implemented in X file"
- ❌ "API endpoint created"
- ❌ "Function added at line Y"

**These only prove code was written, NOT that it works!**

## 🧪 Browser Testing Requirements

### For Every PRD Item, Ralph Loop MUST:

1. **Start dev server**: `npm run dev`
2. **Open Chrome** to the relevant URL
3. **Follow test_steps** EXACTLY as written
4. **If ANY step fails**: Diagnose → Fix → Re-test
5. **Iterate until ALL steps pass**
6. **Only then** mark `passes: true`

### Evidence Format

```json
{
  "passes": true,
  "evidence": "BROWSER TESTED: Navigated to /notices, typed SW1A 1AA in search, dropdown appeared with 5 addresses, clicked first address, map loaded immediately with 12 notices within 2km. WORKING."
}
```

**NOT this:**
```json
{
  "passes": true,
  "evidence": "Implemented in AddressSearchBar.tsx lines 50-60"
}
```

## 🔄 Ralph Loop Iteration Rules

Ralph Loop should work like this:

```
Iteration 1:
  - Read: "one_click_address_select" requirements
  - Test: Navigate to /notices, type postcode
  - Result: ❌ No dropdown appears
  - Diagnose: Check AddressSearchBar component, postcodes.io API call
  - Fix: Fix API call
  - Re-test: ❌ Still fails

Iteration 2:
  - Diagnose deeper: Check network tab, API endpoint
  - Fix: Fix endpoint route
  - Re-test: ✅ Dropdown appears!
  - Test next step: Click address
  - Result: ❌ Nothing happens

Iteration 3:
  - Diagnose: Check onClick handler
  - Fix: Add missing handler
  - Re-test: ✅ Dropdown works, map loads!
  - Mark: passes: true
  - Evidence: "BROWSER TESTED: Full flow working"
```

**NOT this:**

```
Iteration 1:
  - Read requirements
  - Write AddressSearchBar component
  - Mark: passes: true
  - Evidence: "Component created"
  - Move to next item (WITHOUT TESTING!)
```

## 📋 Updated Test Steps Format

Every PRD item MUST have `test_steps` that are:

1. **Browser-executable** - Can be done by opening Chrome and clicking
2. **Specific** - Exact URLs, exact text to type, exact buttons to click
3. **Observable** - Clear pass/fail criteria ("dropdown appears" vs "code exists")
4. **Complete** - Cover the full user flow, not just "component exists"

### Example: GOOD Test Steps

```json
{
  "test_steps": [
    "Start dev server: npm run dev",
    "Open Chrome to http://localhost:5173/notices",
    "Type 'SW1A 1AA' in search box",
    "Verify: Dropdown appears with address list within 2 seconds",
    "Click first address in dropdown",
    "Verify: Map loads immediately (no confirm button needed)",
    "Verify: Notices appear on map within 2km radius",
    "Verify: Radius filter buttons (500m/1km/2km/5km) visible at top"
  ]
}
```

### Example: BAD Test Steps

```json
{
  "test_steps": [
    "Check AddressSearchBar.tsx exists",
    "Verify submitSearch function implemented",
    "Confirm oneClickSelect prop added"
  ]
}
```

## 🚨 Failures Found in Manual Testing

Based on your testing, these items FAILED and must be marked `passes: false`:

### Test 1: Public Search
- ❌ **one_click_address_select**: Dropdown doesn't appear when typing postcode
- ❌ **radius_filters_before_search**: Filters visible but search doesn't work

**Why it failed**: Address search dropdown not working, API connection issues

### Test 2: Blue Notice PDF
- ❌ **generate_blue_notice_pdf**: API connection failed (port 5174 error)

**Why it failed**: API server not running or wrong port

### Test 3: Council Portal
- ❌ **licensing_dashboard_widgets**: Can't test - no council in database
- ❌ **assign_representation_to_officer**: Can't access portal
- ❌ **mark_representation_reviewed**: Can't access portal
- ❌ **internal_notes_on_representations**: Can't access portal
- ❌ **export_reps_for_idox**: Can't access portal

**Why it failed**: No test data in database, can't login to test

### Test 4: Firm Registration
- ❌ **firm_registration_wizard**: Redirects to homepage instead of showing wizard
- ❌ **practice_area_selection**: Can't reach wizard
- ❌ **licensing_quick_publish**: Can't test without firm account
- ❌ **client_management**: Can't test without firm account
- ❌ **live_representation_feed**: Can't test without notice
- ❌ **consultation_countdown**: Can't test without notice

**Why it failed**: Registration route broken, no test data

### Publish Wizard Issues
- ❌ Form has unnecessary fields (trading name, company number, DPS)
- ❌ Field order wrong (sale of alcohol should be at top)
- ❌ No council in database to select

## 🔧 What Needs to Happen Now

Ralph Loop must:

1. **Mark all failed items as `passes: false`**
2. **Fix the actual issues found in testing**:
   - Fix postcode dropdown not appearing
   - Fix API server connection (port 5174)
   - Fix firm registration route
   - Remove unnecessary form fields
   - Add test data to database
3. **Re-test in browser**
4. **Only mark `passes: true` when ACTUALLY WORKING**

## 📝 SQL Test Data Needed

Create via Supabase SQL:

```sql
-- Test Council
INSERT INTO organizations (name, slug, type) VALUES
('Sampletonborough Council', 'sampletonborough-council', 'council');

INSERT INTO departments (organization_id, name, slug, type) VALUES
((SELECT id FROM organizations WHERE slug = 'sampletonborough-council'),
 'Licensing', 'licensing', 'licensing');

-- Test Firm
INSERT INTO organizations (name, slug, type) VALUES
('Test Law Firm LLP', 'test-law-firm', 'firm');

-- Test User for Council
INSERT INTO auth.users (email, email_confirmed_at) VALUES
('licensing@sampletonborough.gov.uk', NOW());

-- Test User for Firm
INSERT INTO auth.users (email, email_confirmed_at) VALUES
('solicitor@testlawfirm.com', NOW());
```

## 🎯 Ralph Loop Command - CORRECT Way

```bash
/ralph-loop "Fix ALL failed Priority 0 items from manual testing. For EACH item:

1. READ the failure reason from PRD_SUCCESS_CRITERIA.md
2. START dev server (npm run dev)
3. OPEN Chrome and follow test_steps EXACTLY
4. IF test fails:
   - Check browser console for errors
   - Check network tab for API failures
   - Diagnose the root cause
   - Fix the code
   - Re-test in browser until it WORKS
5. ONLY mark passes:true when ACTUALLY WORKING in browser
6. Evidence must say: 'BROWSER TESTED: [what you did and that it worked]'

Priority order:
1. Fix API server connection (port 5174 issue)
2. Fix postcode dropdown
3. Add test SQL data (Sampletonborough Council)
4. Fix firm registration route
5. Clean up publish wizard fields
6. Re-test all features in browser

Output <promise>ALL FEATURES BROWSER TESTED AND WORKING</promise> when you can manually test every feature and it works."
```

---

**Key Point**: Ralph Loop must use the **actual website in Chrome** to verify features work, not just assume code = working.
