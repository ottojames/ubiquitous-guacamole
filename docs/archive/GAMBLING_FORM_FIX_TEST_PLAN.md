# Gambling Form Fix - Test Plan

## Bug Summary
**Fixed**: LICENSABLE_ACTIVITIES and OPENING_HOURS fields were incorrectly hidden in Gambling Act forms due to hardcoded filters intended only for Licensing Act forms.

## Changes Made
**File**: `/Users/ottoclarke/projects/ubiquitous-guacamole/src/next/publish/flow/TemplateBuilderForm.tsx`

### Change 1: Section-level filter (lines 305-312)
**Before**:
```typescript
// Skip fields handled by ActivitiesHoursSection
if (field.token === "LICENSABLE_ACTIVITIES" ||
    field.token === "ACTIVITY_SCHEDULE" ||
    field.token === "OPENING_HOURS" ||
    field.token === "DPS_NAME" ||
    field.token === "DPS_LICENSING_AUTHORITY") {
  return false;
}
```

**After**:
```typescript
// Skip fields handled by ActivitiesHoursSection (only for the activities-hours section)
if (section.id === "activities-hours" &&
    (field.token === "LICENSABLE_ACTIVITIES" ||
     field.token === "ACTIVITY_SCHEDULE" ||
     field.token === "OPENING_HOURS" ||
     field.token === "DPS_NAME" ||
     field.token === "DPS_LICENSING_AUTHORITY")) {
  return false;
}
```

### Change 2: Component-level filter (lines 519-526)
**Before**:
```typescript
// These fields are now handled by ActivitiesHoursSection - don't render them individually
if (field.token === "LICENSABLE_ACTIVITIES" ||
    field.token === "ACTIVITY_SCHEDULE" ||
    field.token === "OPENING_HOURS" ||
    field.token === "DPS_NAME" ||
    field.token === "DPS_LICENSING_AUTHORITY") {
  return null;
}
```

**After**: (REMOVED - redundant)

## Test Plan

### Server Setup
```bash
# If not running already:
cd /Users/ottoclarke/projects/ubiquitous-guacamole
npm run dev
# Navigate to http://localhost:5173
```

---

## Test 1: Gambling Betting - New Application

### Steps:
1. Navigate to http://localhost:5173/publish/step-1
2. Select "Gambling Act 2005"
3. Select "Betting premises"
4. Select "Betting premises - New application"
5. Click "Continue"
6. On Upload Method screen, select "Structured template"
7. Click "Continue"

### Expected Results on Form:
- [ ] Form loads without errors
- [ ] "Application details" section is visible
- [ ] "Premises type" dropdown is visible and required (red asterisk)
- [ ] "Licensed activities" textarea is visible and required
- [ ] "Proposed opening hours" textarea is visible and required
- [ ] Fields are editable (not hidden or disabled)

### Test Data:
Fill in the form with:

**Applicant**:
- Applicant name: "Test Betting Ltd"
- Applicant status: "Limited company"
- Applicant address: "123 High Street, London, SW1A 1AA"

**Premises**:
- Premises name: "Lucky Strike Betting Shop"
- Premises address: "456 Main Road, London, E1 6AN"

**Application details**:
- Premises type: "Betting premises"
- Licensed activities: "Fixed-odds betting terminals, over-the-counter betting on sporting events and horse racing"
- Proposed opening hours: "Monday-Saturday: 09:00-22:00, Sunday: 10:00-18:00"

**Dates**:
- Application date: (today)
- Publication date: (today + 1)
- Deadline: (auto-calculated to 28 days from application)

**Authority**:
- Licensing authority: "Westminster City Council"
- Authority address: "64 Victoria Street, London, SW1E 6QP"
- Authority email: "licensing@westminster.gov.uk"
- Representation address: "Same as above"
- Representation email: "licensing@westminster.gov.uk"

### Validation:
- [ ] All fields accept input without errors
- [ ] Can click "Continue" without validation errors
- [ ] Step 3 (Confirm Details) shows all entered data correctly
- [ ] "Licensed activities" text appears in the preview
- [ ] "Proposed opening hours" text appears in the preview

---

## Test 2: Gambling Betting - Variation

### Steps:
1. Navigate to http://localhost:5173/publish/step-1
2. Select "Gambling Act 2005" → "Betting premises" → "Betting premises - Variation"
3. Select "Structured template" method

### Expected Results:
- [ ] "Licensed activities" field is VISIBLE and required
- [ ] "Proposed opening hours" field is VISIBLE and required
- [ ] "Nature of variation" field is VISIBLE and required
- [ ] Can fill all fields and proceed to Step 3

### Test Data:
Use same data as Test 1, plus:
- Nature of variation: "Increase in number of fixed-odds betting terminals from 4 to 5"

---

## Test 3: Gambling Betting - Review

### Steps:
1. Navigate to http://localhost:5173/publish/step-1
2. Select "Gambling Act 2005" → "Betting premises" → "Betting premises - Review"
3. Select "Structured template" method

### Expected Results:
- [ ] "Licensed activities" field is HIDDEN (showIf logic correctly applies)
- [ ] "Proposed opening hours" field is HIDDEN
- [ ] "Review applicant name" field is VISIBLE and required
- [ ] "Review grounds" field is VISIBLE and required
- [ ] Can fill all fields and proceed to Step 3

### Test Data:
- Review applicant name: "Metropolitan Police"
- Review grounds: "Concerns regarding crime prevention and public safety"

---

## Test 4: Gambling Betting - Transfer

### Steps:
1. Select "Gambling Act 2005" → "Betting premises" → "Betting premises - Transfer"
2. Select "Structured template" method

### Expected Results:
- [ ] "Licensed activities" field is HIDDEN
- [ ] "Proposed opening hours" field is HIDDEN
- [ ] "Current licence holder" field is VISIBLE and required
- [ ] "Proposed licence holder" field is VISIBLE and required
- [ ] "Transfer date" field is VISIBLE and required

---

## Test 5: Other Gambling Premises Types

Repeat Tests 1-4 for:
- [ ] Bingo premises (gambling-bingo-new, variation, review, transfer)
- [ ] Adult Gaming Centre (gambling-agc-new, variation, review, transfer)
- [ ] Family Entertainment Centre (gambling-fec-new, variation, review, transfer)

**Quick verification**: For each NEW and VARIATION type, confirm "Licensed activities" and "Proposed opening hours" are visible and required.

---

## Test 6: Licensing Act Forms (Regression Test)

### Purpose: Ensure the fix didn't break Licensing Act forms that use ActivitiesHoursSection

### Steps:
1. Navigate to http://localhost:5173/publish/step-1
2. Select "Licensing Act 2003"
3. Select "Premises licence"
4. Select "Premises licence - New application"
5. Select "Structured template" method

### Expected Results:
- [ ] Form loads without errors
- [ ] "Activities & hours" section is visible
- [ ] **ActivitiesHoursSection component** is rendered (not individual textareas)
- [ ] Can select activities (alcohol, live music, etc.) with checkboxes
- [ ] Can set hours per activity using the interactive UI
- [ ] DPS fields appear when alcohol is selected
- [ ] Individual LICENSABLE_ACTIVITIES, ACTIVITY_SCHEDULE, OPENING_HOURS textareas are NOT visible
- [ ] Can fill form and proceed to Step 3
- [ ] Preview correctly shows selected activities and hours

### Test Data:
**Activities**:
- Select: "Sale of alcohol (on premises)"
- Hours: Mon-Sun 11:00-23:00
- DPS Name: "John Smith"
- DPS Licensing Authority: "Westminster"

---

## Test 7: Club Certificate (Regression Test)

### Steps:
1. Select "Licensing Act 2003" → "Club premises certificate" → "Club premises certificate - New application"
2. Select "Structured template" method

### Expected Results:
- [ ] ActivitiesHoursSection shows club-specific activities
- [ ] Can select club activities (supply to members, supply to guests)
- [ ] No DPS fields shown (clubs don't have DPS)
- [ ] Can proceed without errors

---

## Test 8: Planning Notices (Smoke Test)

### Purpose: Ensure no unintended side effects on unrelated notice types

### Steps:
1. Select "Planning" → "General planning application"
2. Select "Structured template" method

### Expected Results:
- [ ] Form loads correctly
- [ ] No LICENSABLE_ACTIVITIES or OPENING_HOURS fields appear (as expected)
- [ ] All planning-specific fields render correctly
- [ ] Can complete and proceed

---

## Test 9: GVOL Notices (Smoke Test)

### Steps:
1. Select "Goods Vehicle Operator Licence" → "New operator licence"
2. Select "Structured template" method

### Expected Results:
- [ ] Form loads correctly
- [ ] Traffic area and vehicle fields render correctly
- [ ] Can complete and proceed

---

## Test 10: Cross-Notice Type Validation

### Purpose: Verify the fix is scoped correctly

### Verification Checklist:
- [ ] ONLY Licensing Act "activities-hours" section uses ActivitiesHoursSection
- [ ] ALL Gambling Act "application-details" sections show normal textareas
- [ ] No other notice categories are affected
- [ ] Field visibility rules (showIf) still work correctly

---

## Success Criteria

All tests must pass with:
1. No console errors
2. Fields visible when expected
3. Fields hidden when expected (per showIf logic)
4. Form validation works correctly
5. Can proceed to Step 3 and Step 4
6. Notice preview shows all data correctly
7. Hot module reload works (changes reflect immediately)

---

## Regression Testing Matrix

| Notice Type | Variant | LICENSABLE_ACTIVITIES | OPENING_HOURS | Component Type |
|-------------|---------|----------------------|---------------|----------------|
| Licensing Premises | New | Hidden | Hidden | ActivitiesHoursSection |
| Licensing Premises | Variation | Hidden | Hidden | ActivitiesHoursSection |
| Licensing Club | New | Hidden | Hidden | ActivitiesHoursSection |
| Gambling Betting | New | ✅ Visible | ✅ Visible | Textarea |
| Gambling Betting | Variation | ✅ Visible | ✅ Visible | Textarea |
| Gambling Betting | Review | Hidden (showIf) | Hidden (showIf) | - |
| Gambling Betting | Transfer | Hidden (showIf) | Hidden (showIf) | - |
| Gambling Bingo | New | ✅ Visible | ✅ Visible | Textarea |
| Gambling AGC | New | ✅ Visible | ✅ Visible | Textarea |
| Gambling FEC | New | ✅ Visible | ✅ Visible | Textarea |
| Planning | All | N/A | N/A | - |
| GVOL | All | N/A | N/A | - |
| Probate | All | N/A | N/A | - |

✅ = Fixed by this change
Hidden (showIf) = Correctly hidden by blueprint logic (not by the bug)

---

## Performance Testing

After manual testing:
- [ ] Run full test suite: `npm test`
- [ ] Run type checking: `npm run typecheck` (expect pre-existing errors only)
- [ ] Check for warnings in browser console
- [ ] Verify no memory leaks (fill multiple forms in succession)

---

## Known Pre-Existing Issues
These errors are NOT related to this fix:
- Cypress type definition errors
- debug-fields.ts SVGElement offsetParent errors
- E2E address-detailed.spec.ts null checks

The fix only touches TemplateBuilderForm.tsx and should have zero type errors in that file.
