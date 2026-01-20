# Manual Test Checklist - Gambling Form Fix

## Quick Start
```bash
# Dev server should already be running at:
http://localhost:5173

# If not, start it:
npm run dev
```

---

## TEST 1: Gambling Betting - New Application (PRIMARY FIX VERIFICATION)

**Priority**: 🔴 CRITICAL

### Steps:
1. Open http://localhost:5173/publish/step-1
2. Click "Gambling Act 2005"
3. Click "Betting premises"
4. Click "Betting premises - New application"
5. Click "Continue"
6. Click "Structured template"
7. Click "Continue"

### Expected: Form Renders Correctly
- [ ] Page loads without console errors
- [ ] "Application details" section is visible
- [ ] "Premises type" dropdown is visible (required ⭐)
- [ ] "Licensed activities" textarea is visible (required ⭐)
- [ ] "Proposed opening hours" textarea is visible (required ⭐)

### Fill Form with Test Data:

**Applicant / Publisher**:
```
Applicant name: Test Betting Ltd ⭐
Applicant status: Limited company
Applicant address: 123 High Street, London, SW1A 1AA ⭐
```

**Premises / site**:
```
Premises name: Lucky Strike Betting Shop ⭐
Premises address: 456 Main Road, London, E1 6AN ⭐
```

**Application details**:
```
Premises type: Betting premises ⭐
Licensed activities: Fixed-odds betting terminals, over-the-counter betting on sporting events and horse racing ⭐
Proposed opening hours: Monday-Saturday: 09:00-22:00, Sunday: 10:00-18:00 ⭐
```

**Statutory dates**:
```
Application date: [Today's date] ⭐
Publication date: [Tomorrow's date] ⭐
Representation deadline: [Auto-calculated, 28 days from application] ⭐
```

**Authority contact**:
```
Licensing authority name: Westminster City Council ⭐
Authority address: 64 Victoria Street, London, SW1E 6QP ⭐
Representation address: Same as above
Representation email: licensing@westminster.gov.uk
```

### Expected: Can Proceed to Step 3
- [ ] All required fields accept input
- [ ] "Continue" button is enabled
- [ ] Clicking "Continue" proceeds to Step 3 (Confirm Details)
- [ ] No validation errors appear

### Expected: Step 3 Preview Shows Data
- [ ] Applicant name appears in preview
- [ ] Premises details appear in preview
- [ ] "Licensed activities" text appears in preview
- [ ] "Proposed opening hours" text appears in preview
- [ ] Preview is formatted correctly

### Expected: Can Proceed to Step 4
- [ ] Can click "Continue" from Step 3
- [ ] Step 4 (Review & Pay) loads correctly

---

## TEST 2: Gambling Variation (VERIFY SAME FIELDS VISIBLE)

**Priority**: 🟡 HIGH

### Quick Test:
1. Go to Step 1
2. Select "Gambling Act 2005" → "Betting premises" → "Betting premises - Variation"
3. Select "Structured template"

### Expected:
- [ ] "Licensed activities" textarea is visible
- [ ] "Proposed opening hours" textarea is visible
- [ ] "Nature of variation" textarea is visible and required
- [ ] Can fill all fields and proceed

---

## TEST 3: Gambling Review (VERIFY FIELDS CORRECTLY HIDDEN)

**Priority**: 🟡 HIGH

### Quick Test:
1. Go to Step 1
2. Select "Gambling Act 2005" → "Betting premises" → "Betting premises - Review"
3. Select "Structured template"

### Expected:
- [ ] "Licensed activities" textarea is NOT visible (correctly hidden by showIf logic)
- [ ] "Proposed opening hours" textarea is NOT visible (correctly hidden)
- [ ] "Review applicant name" field IS visible and required
- [ ] "Review grounds" textarea IS visible and required
- [ ] Can fill form and proceed

---

## TEST 4: Licensing Premises (REGRESSION TEST)

**Priority**: 🔴 CRITICAL (ensure fix didn't break existing functionality)

### Steps:
1. Go to Step 1
2. Select "Licensing Act 2003" → "Premises licence" → "Premises licence - New application"
3. Select "Structured template"

### Expected: Special Component Renders
- [ ] "Activities & hours" section is visible
- [ ] **ActivitiesHoursSection component** renders (interactive UI)
- [ ] Can see activity checkboxes (alcohol, live music, etc.)
- [ ] Can set hours per activity with time pickers
- [ ] Individual LICENSABLE_ACTIVITIES textarea does NOT appear
- [ ] Individual OPENING_HOURS textarea does NOT appear
- [ ] DPS fields appear when alcohol is selected

### Test Interaction:
- [ ] Check "Sale of alcohol (on premises)"
- [ ] Set hours: Mon-Sun 11:00-23:00
- [ ] DPS fields become visible
- [ ] Fill DPS name: "John Smith"
- [ ] Fill DPS licensing authority: "Westminster"
- [ ] Can proceed to Step 3
- [ ] Preview shows activities and hours correctly formatted

---

## TEST 5: Other Gambling Types (QUICK SMOKE TEST)

**Priority**: 🟢 MEDIUM

### For Each Type:
1. Bingo premises - New application
2. Adult Gaming Centre - New application
3. Family Entertainment Centre - New application

### Quick Check:
- [ ] Form loads
- [ ] "Licensed activities" textarea visible
- [ ] "Proposed opening hours" textarea visible
- [ ] Can fill and proceed

---

## TEST 6: Planning Notice (UNRELATED SMOKE TEST)

**Priority**: 🟢 LOW

### Steps:
1. Select "Planning" → "General planning application"
2. Select "Structured template"

### Expected:
- [ ] Form loads correctly
- [ ] No LICENSABLE_ACTIVITIES or OPENING_HOURS fields (as expected)
- [ ] Planning-specific fields render correctly
- [ ] Can complete and proceed

---

## Browser Console Check

Throughout all tests, monitor browser console (F12):
- [ ] No red error messages
- [ ] No yellow warnings related to TemplateBuilderForm
- [ ] Hot module reload works (make a change, see it update)

---

## Success Criteria

✅ **PASS**: All tests above pass without errors
❌ **FAIL**: Any test shows:
- Missing fields that should be visible
- Extra fields that should be hidden
- Validation errors preventing form submission
- Console errors
- Cannot proceed to next step

---

## If Tests Fail

1. Check browser console for errors
2. Verify dev server is running (http://localhost:5173)
3. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+F5)
4. Check `/tmp/dev-server.log` for server errors
5. Verify changes are in place:
   ```bash
   grep -A 5 "section.id === \"activities-hours\"" src/next/publish/flow/TemplateBuilderForm.tsx
   ```

---

## Time Estimate

- Test 1 (Critical): 5 minutes
- Test 2-3 (Quick tests): 3 minutes each
- Test 4 (Regression): 5 minutes
- Test 5 (Smoke tests): 5 minutes
- Test 6 (Unrelated): 2 minutes

**Total**: ~25 minutes for comprehensive validation

---

## After Testing

Update this document with results:
```
Date tested: _______________
Tested by: _______________
Result: PASS / FAIL
Notes: _______________
```

If PASS:
1. Commit changes:
   ```bash
   git add src/next/publish/flow/TemplateBuilderForm.tsx
   git commit -m "fix(forms): scope ActivitiesHoursSection filter to licensing forms only

   Gambling Act forms were missing LICENSABLE_ACTIVITIES and OPENING_HOURS
   fields due to hardcoded filters that incorrectly applied to all sections.

   Fixed by:
   - Adding section.id check to only skip fields in 'activities-hours' section
   - Removing redundant component-level filter

   Affected notice types: gambling-*-new, gambling-*-variation

   Fixes: CRIT-XXX"
   ```

2. Push to branch
3. Create PR
4. Notify stakeholders

If FAIL:
1. Document failures
2. Check if additional fixes needed
3. Re-test after fixes
