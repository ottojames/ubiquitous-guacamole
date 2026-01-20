# Gambling Form Fix - Validation Report

## Executive Summary
**Status**: ✅ FIX IMPLEMENTED
**Date**: 2025-11-06
**Engineer**: CivicDev
**Severity**: CRITICAL (P0)

## Problem Statement
Gambling Act forms were missing required fields (LICENSABLE_ACTIVITIES, OPENING_HOURS) preventing users from completing the publish workflow.

## Root Cause Analysis

### Issue
Two hardcoded filters in `TemplateBuilderForm.tsx` were incorrectly applied to ALL notice types:

1. **Section-level filter** (lines 305-312): Filtered out fields across all sections
2. **Component-level filter** (lines 519-526): Redundantly blocked rendering

### Original Intent
These filters were designed ONLY for Licensing Act 2003 forms that use the special `ActivitiesHoursSection` component (an interactive UI with checkboxes and hour pickers for each activity).

### Why It Broke
The filters checked field token names globally, without checking the section context:
- Licensing Act forms: section ID = "activities-hours" → should use ActivitiesHoursSection
- Gambling Act forms: section ID = "application-details" → should use normal textareas

Because the filters didn't check `section.id`, they blocked fields in ALL sections.

## Solution Implemented

### Change 1: Scope the section filter to "activities-hours" only
**File**: `/Users/ottoclarke/projects/ubiquitous-guacamole/src/next/publish/flow/TemplateBuilderForm.tsx`
**Lines**: 305-312

```typescript
// OLD (broken):
if (field.token === "LICENSABLE_ACTIVITIES" || ...) {
  return false;
}

// NEW (fixed):
if (section.id === "activities-hours" &&
    (field.token === "LICENSABLE_ACTIVITIES" || ...)) {
  return false;
}
```

**Impact**: Fields now only skip when in the special "activities-hours" section used by Licensing Act forms.

### Change 2: Remove redundant component-level filter
**File**: Same file
**Lines**: 519-526 (REMOVED)

```typescript
// REMOVED (redundant - already filtered at section level):
if (field.token === "LICENSABLE_ACTIVITIES" || ...) {
  return null;
}
```

**Impact**: Eliminates duplicate logic and potential future bugs.

## Affected Notice Types

### ✅ FIXED (Now Showing Fields)
All Gambling Act 2005 NEW and VARIATION applications:
- gambling-betting-new
- gambling-betting-variation
- gambling-bingo-new
- gambling-bingo-variation
- gambling-agc-new
- gambling-agc-variation
- gambling-fec-new
- gambling-fec-variation

### ✅ WORKING CORRECTLY (Fields Correctly Hidden by showIf Logic)
Gambling Act REVIEW and TRANSFER applications:
- gambling-betting-review (no activities/hours fields needed)
- gambling-betting-transfer (no activities/hours fields needed)
- Similar for bingo, agc, fec variants

### ✅ UNAFFECTED (Regression Prevention)
Licensing Act 2003 forms continue to use ActivitiesHoursSection:
- licensing-premises-new
- licensing-premises-variation
- licensing-club-new
- licensing-club-variation

Other notice categories (Planning, GVOL, Probate) continue to work normally.

## Technical Validation

### Code Quality Checks
```bash
# TypeScript compilation
npm run typecheck
# Result: No new errors in TemplateBuilderForm.tsx ✅

# ESLint
npm run lint
# Result: No new warnings ✅

# Dev server startup
npm run dev
# Result: Both frontend and backend start successfully ✅
```

### Hot Module Reload
The fix is immediately visible in the running dev server at http://localhost:5173 without requiring a full restart.

## Field Visibility Matrix

| Notice Category | Section ID | Field Token | Component Type | Visible? |
|----------------|-----------|-------------|----------------|----------|
| Licensing Premises | activities-hours | LICENSABLE_ACTIVITIES | ActivitiesHoursSection | No (rendered by special component) |
| Licensing Premises | activities-hours | OPENING_HOURS | ActivitiesHoursSection | No (rendered by special component) |
| Licensing Premises | activities-hours | DPS_NAME | ActivitiesHoursSection | No (rendered by special component) |
| Gambling Betting NEW | application-details | LICENSABLE_ACTIVITIES | textarea | ✅ YES (FIXED) |
| Gambling Betting NEW | application-details | OPENING_HOURS | textarea | ✅ YES (FIXED) |
| Gambling Betting REVIEW | application-details | LICENSABLE_ACTIVITIES | - | No (showIf: false) |
| Gambling Betting REVIEW | application-details | OPENING_HOURS | - | No (showIf: false) |

## Blueprint Configuration Analysis

### Gambling Act Blueprint (lines 490-716)
```typescript
{
  id: "application-details",
  title: "Application details",
  fields: [
    field("LICENSABLE_ACTIVITIES", {
      label: "Licensed activities",
      type: "textarea",
      rows: 3,
      required: !isReview && !isTransfer,  // ✅ Correct
      showIf: () => !isReview && !isTransfer,  // ✅ Correct
    }),
    field("OPENING_HOURS", {
      label: "Proposed opening hours",
      type: "textarea",
      rows: 3,
      required: !isReview && !isTransfer,  // ✅ Correct
      showIf: () => !isReview && !isTransfer,  // ✅ Correct
    }),
  ]
}
```

**Analysis**: Blueprint configuration is correct. Fields are properly:
- Required for NEW and VARIATION types
- Optional/hidden for REVIEW and TRANSFER types
- Configured as normal textareas (not special ActivitiesHoursSection)

### Licensing Act Blueprint (lines 251-488)
```typescript
{
  id: "activities-hours",  // ⚠️ Special section ID
  title: "Activities & hours",
  fields: [
    field("LICENSABLE_ACTIVITIES", { ... }),
    field("ACTIVITY_SCHEDULE", { ... }),
    field("OPENING_HOURS", { ... }),
    field("DPS_NAME", { ... }),
    field("DPS_LICENSING_AUTHORITY", { ... }),
  ]
}
```

**Analysis**: Licensing Act correctly uses special section ID "activities-hours" which triggers:
1. Section-level rendering of ActivitiesHoursSection component (lines 283-298)
2. Field-level filtering to skip individual fields (lines 305-312, now scoped correctly)

## User Impact

### Before Fix
- User fills out entire Gambling Act form
- LICENSABLE_ACTIVITIES field missing → form incomplete
- Cannot proceed past Step 2
- Validation error: "Required field missing"
- **Result**: COMPLETE WORKFLOW BLOCKAGE ❌

### After Fix
- User fills out entire Gambling Act form
- LICENSABLE_ACTIVITIES textarea visible and editable
- OPENING_HOURS textarea visible and editable
- Can fill in required data
- Can proceed to Step 3 (Confirm Details)
- Can proceed to Step 4 (Review & Pay)
- **Result**: WORKFLOW UNBLOCKED ✅

## Testing Recommendations

### Priority 1 (Critical Path)
1. Gambling Betting - New application
2. Gambling Bingo - New application
3. Gambling AGC - New application
4. Gambling FEC - New application

### Priority 2 (Variations)
5. All 4 gambling types - Variation applications

### Priority 3 (Edge Cases)
6. Gambling Review (verify fields correctly hidden)
7. Gambling Transfer (verify fields correctly hidden)

### Priority 4 (Regression)
8. Licensing Premises - New (verify ActivitiesHoursSection still works)
9. Licensing Club - New (verify ActivitiesHoursSection still works)

### Priority 5 (Smoke Tests)
10. Planning notices (no impact expected)
11. GVOL notices (no impact expected)
12. Probate notices (no impact expected)

## Deployment Notes

### Pre-Deployment Checklist
- [x] Code change implemented
- [x] TypeScript compilation passes
- [x] No new lint warnings
- [x] Dev server starts successfully
- [x] Hot reload verified
- [ ] Manual testing (see test plan)
- [ ] Automated tests updated (if applicable)
- [ ] Stakeholder notification (licensing officer)

### Rollback Plan
If issues arise:
```bash
git revert <commit-hash>
```

The changes are isolated to a single file with no database migrations or config changes, making rollback trivial.

### Monitoring
After deployment, monitor:
- Form completion rates for gambling notices
- Validation error rates
- User support tickets related to "missing fields"
- Browser console errors on publish flow pages

## Lessons Learned

### What Went Wrong
1. **Overly broad filtering**: Filters were applied globally without context checking
2. **Redundant logic**: Two separate filters doing the same thing increased bug surface area
3. **Insufficient testing**: Gambling forms were not tested after ActivitiesHoursSection was introduced
4. **Missing type safety**: Field token constants were strings, not discriminated unions tied to section IDs

### Preventive Measures
1. **Add E2E tests**: Cover all 35+ notice types in automated test suite
2. **Section-aware typing**: Consider TypeScript discriminated unions for section blueprints
3. **Code review checklist**: Always check impact of filters on ALL notice types
4. **Smoke test matrix**: Test one example from each category (licensing, gambling, planning, gvol, probate) before deploying

### Technical Debt
Consider refactoring:
- Extract ActivitiesHoursSection logic into a dedicated section type
- Use TypeScript generics to type-check field tokens per section
- Add compile-time validation that special component sections don't leak into other notice types

## Sign-Off

**Developer**: CivicDev (Senior Full-Stack Developer)
**Date**: 2025-11-06
**Status**: Ready for Testing

**Next Steps**:
1. Run comprehensive manual testing (see GAMBLING_FORM_FIX_TEST_PLAN.md)
2. Update E2E tests to cover gambling forms
3. Notify stakeholders that the issue is resolved
4. Deploy to staging for UAT
5. Deploy to production after sign-off
