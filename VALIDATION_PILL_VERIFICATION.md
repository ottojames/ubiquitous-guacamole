# Validation Pill Verification Guide

This guide helps verify that the validation pill correctly tracks all required fields for gambling forms.

## Quick Visual Check

### Expected Behavior (After Fix)

When filling a **Gambling Act 2005 → Betting premises → New application** with structured template:

#### Step 2: Before filling activities/hours
```
┌─────────────────────────────────┐
│ Validation Status               │
├─────────────────────────────────┤
│ 🔴 Applicant name               │
│ 🔴 Premises address             │
│ 🔴 Gambling premises type       │
│ 🔴 Licensed activities          │ ← MUST SHOW (was missing before)
│ 🔴 Proposed opening hours       │ ← MUST SHOW (was missing before)
│ 🔴 Application date             │
│ 🔴 Publication date             │
│ 🔴 Representation deadline      │
│ 🔴 Licensing authority name     │
│ 🔴 Authority address            │
└─────────────────────────────────┘
```

#### Step 2: After filling activities/hours
```
┌─────────────────────────────────┐
│ Validation Status               │
├─────────────────────────────────┤
│ 🔴 Applicant name               │
│ 🔴 Premises address             │
│ 🔴 Gambling premises type       │
│ 🟢 Licensed activities          │ ← GREEN (filled)
│ 🟢 Proposed opening hours       │ ← GREEN (filled)
│ 🔴 Application date             │
│ 🔴 Publication date             │
│ 🔴 Representation deadline      │
│ 🔴 Licensing authority name     │
│ 🔴 Authority address            │
└─────────────────────────────────┘
```

## Manual Test Scenarios

### Scenario 1: Gambling Betting - New Application (PRIMARY TEST)

**Path**: Gambling Act 2005 → Betting premises → New application → Structured template

**Steps**:
1. Navigate to `/publish/step-1`
2. Select notice type as above
3. Choose "Structured template"
4. **CHECK**: Validation pill shows:
   - 🔴 "Licensed activities" (RED)
   - 🔴 "Proposed opening hours" (RED)
5. Fill in activities:
   - Check "Fixed-odds betting terminals"
   - Set machine count: 4
6. Fill in hours:
   - Mon-Sat: 09:00 - 23:00
   - Sun: 10:00 - 22:00
7. **CHECK**: Validation pill shows:
   - 🟢 "Licensed activities" (GREEN)
   - 🟢 "Proposed opening hours" (GREEN)
8. Continue to Step 3
9. **CHECK**: Template preview includes activities and hours

**Expected Result**: ✅ PASS if all checks succeed

---

### Scenario 2: Gambling Bingo - New Application

**Path**: Gambling Act 2005 → Bingo premises → New application → Structured template

**Steps**:
1. Same as Scenario 1, but select Bingo premises
2. Fill activities:
   - Check "Cash bingo"
   - Check "Gaming machines - Category B3/B4"
   - Set machine count: 8
3. Fill hours: Mon-Sun 09:00 - 23:00

**Expected Result**: ✅ Same validation pill behavior

---

### Scenario 3: Gambling Review (NEGATIVE TEST)

**Path**: Gambling Act 2005 → Betting premises → Review → Structured template

**Steps**:
1. Select review application
2. Choose structured template
3. **CHECK**: Validation pill does NOT show:
   - ❌ "Licensed activities" (should be absent)
   - ❌ "Proposed opening hours" (should be absent)
4. Should show:
   - 🔴 "Review applicant name"
   - 🔴 "Review grounds"

**Expected Result**: ✅ PASS if activities/hours NOT shown (correct behavior)

---

### Scenario 4: Gambling Transfer (NEGATIVE TEST)

**Path**: Gambling Act 2005 → Betting premises → Transfer → Structured template

**Steps**:
1. Select transfer application
2. Choose structured template
3. **CHECK**: Validation pill does NOT show:
   - ❌ "Licensed activities" (should be absent)
   - ❌ "Proposed opening hours" (should be absent)
4. Should show:
   - 🔴 "Current licence holder"
   - 🔴 "Proposed licence holder"

**Expected Result**: ✅ PASS if activities/hours NOT shown (correct behavior)

---

### Scenario 5: Licensing Act - Premises (COMPARISON TEST)

**Path**: Licensing Act 2003 → Premises Licence → New application → Structured template

**Steps**:
1. Select licensing premises application
2. Choose structured template
3. **CHECK**: Validation pill shows:
   - 🔴 "Licensable activities" (RED)
   - 🔴 "Opening hours" (RED)
4. Use ActivitiesHoursSection to fill:
   - Check "Sale of alcohol (on premises)"
   - Set hours: Mon-Sun 11:00 - 23:00
5. **CHECK**: Validation pill shows:
   - 🟢 "Licensable activities" (GREEN)
   - 🟢 "Opening hours" (GREEN)

**Expected Result**: ✅ PASS if validation works (this was already working)

---

## Browser Console Checks

Open DevTools Console and look for:

```
[NewPublishFlow] blueprintMissingCount: X for gambling-betting-new
```

**Before filling activities/hours**: X should include count for these 2 fields
**After filling activities/hours**: X should decrease by 2

## Automated Verification

```bash
# Run unit tests
npm test src/next/publish/config/__tests__/formBlueprints-gambling-validation.test.ts

# Expected output:
# ✓ should include LICENSABLE_ACTIVITIES in full blueprint
# ✓ should include OPENING_HOURS in full blueprint
# ✓ should include both fields in mandatory fields for OCR
# ✓ should NOT include these fields for review applications
# ✓ should NOT include these fields for transfer applications
# ✓ should work for all gambling premises types
#
# Test Files  1 passed (1)
# Tests  6 passed (6)
```

## Troubleshooting

### Issue: Fields don't appear in validation pill

**Check**:
1. Browser cache cleared?
2. Dev server restarted? (`npm run dev`)
3. Check console for `blueprintMissingCount` logs
4. Verify section ID is `gambling-activities-hours` not something else

**Debug**:
```javascript
// In browser console:
const draft = JSON.parse(sessionStorage.getItem('wizard-draft-publish') || '{}');
console.log('LICENSABLE_ACTIVITIES:', draft.LICENSABLE_ACTIVITIES);
console.log('OPENING_HOURS:', draft.OPENING_HOURS);
```

### Issue: Fields show as duplicate text inputs

**Check**:
1. TemplateBuilderForm.tsx lines 451-456 filtering correctly?
2. GamblingActivitiesSection rendering?

**Debug**:
```javascript
// Count how many times "Licensed activities" appears on page
document.querySelectorAll('label:contains("Licensed activities")').length
// Should be 1 (from GamblingActivitiesSection header)
```

### Issue: Fields stay RED even after filling

**Check**:
1. Are values being written to draft? (check sessionStorage)
2. Are field tokens matching exactly? (LICENSABLE_ACTIVITIES vs licensable_activities)
3. Check for validation errors in console

**Debug**:
```javascript
// Check template draft
const draft = JSON.parse(sessionStorage.getItem('wizard-draft-publish') || '{}');
console.log('Draft keys:', Object.keys(draft));
console.log('Activities:', draft.LICENSABLE_ACTIVITIES);
console.log('Hours:', draft.OPENING_HOURS);
```

## Regression Checks

### Other Notice Types (Spot Check)

After deploying, quickly verify these still work:

- [ ] GVOL (Goods Vehicle Operator Licence)
- [ ] Planning (EIA, Listed Building)
- [ ] Probate (Trustee Act s.27)
- [ ] Licensing Club (Club Premises Certificate)

**Expected**: No changes to validation pill behavior for these types.

## Sign-off Checklist

Before marking as complete:

- [ ] All 5 manual scenarios tested and passed
- [ ] Unit tests pass (6/6)
- [ ] No duplicate field rendering
- [ ] No console errors during flow
- [ ] Validation pill shows correct count
- [ ] Continue button enables/disables correctly
- [ ] Step 3 receives complete data
- [ ] Other notice types not affected

---

**Tested by**: _________________
**Date**: _________________
**Environment**: _________________
**Result**: PASS / FAIL
**Notes**: _________________
