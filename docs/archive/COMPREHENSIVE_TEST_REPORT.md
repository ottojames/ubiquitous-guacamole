# Comprehensive Test Report
**Public Notice Portal - End-to-End Testing**
**Date:** 2025-11-06
**Test Environment:** Local development (localhost:5173)

---

## Executive Summary

This report documents a comprehensive testing and debugging effort for the Public Notice Portal. The primary goal was to systematically test the entire platform from multiple user perspectives and fix critical issues blocking workflows.

### Overall Status: 🟡 PARTIAL SUCCESS

- ✅ **Fixed**: Playwright test failures related to collapsible categories
- ✅ **Fixed**: Test helpers now correctly handle new UI structure
- ⚠️ **In Progress**: Structured template form field resolution
- ⏸️ **Pending**: Manual testing of all notice type workflows
- ⏸️ **Pending**: Backend integration verification

---

## Part 1: Playwright Test Failures - FIXED ✅

### Issue Identified
**Problem**: 5 of 7 Playwright tests were failing at the "notice type selection" step with errors:
```
Locator: [notice type button]
Expected: clickable
Received: hidden or not interactive
```

**Root Cause**: Recent UX improvements introduced collapsible categories (using `<details>` elements) that start collapsed by default. Tests were trying to click notice type buttons inside collapsed sections.

### Solution Implemented

**Updated File**: `/Users/ottoclarke/projects/ubiquitous-guacamole/e2e/council/test-helpers.ts`

1. **Added category mapping function** (`getCategoryForNoticeType`):
   - Maps notice type IDs to their category labels
   - Covers all notice types (Licensing, Gambling, GVOL, Planning, Probate)

2. **Enhanced `selectNoticeType()` helper**:
   ```typescript
   export async function selectNoticeType(
     page: Page,
     noticeTypeId = 'licensing-premises-new'
   ): Promise<void> {
     // Determine category
     const categoryLabel = getCategoryForNoticeType(noticeTypeId);

     // Expand category if collapsed
     const categorySummary = page.locator('summary', { hasText: categoryLabel });
     const detailsElement = page.locator('details').filter({ has: categorySummary });
     const isOpen = await detailsElement.evaluate((el) => el.hasAttribute('open'));

     if (!isOpen) {
       await categorySummary.click();
       await page.waitForTimeout(400); // Animation
     }

     // Now click notice type button
     await page.locator(`[data-testid="notice-option-${noticeTypeId}"]`).click();
     // ...
   }
   ```

### Test Results After Fix

```
✅ 2 passed (error handling tests)
❌ 5 failed (but now at Step 2, not Step 1)
```

**Critical Observation**: Tests now successfully pass Step 1 (notice type selection) but fail at Step 2 (upload/template). This confirms the collapsible category issue is **RESOLVED**.

---

## Part 2: Step 2 Upload/Template Issues - IN PROGRESS ⚠️

### Issue Identified
**Problem**: Tests fail at Step 2 with timeout waiting for OCR completion message.

**Root Cause Analysis**:
1. The new wizard flow defaults to **"Structured template"** mode, not "Upload & OCR"
2. Tests were trying to upload files but should be filling form fields instead
3. For `licensing-premises-*` types, the code defaults to "notice" mode (Upload & OCR), but this may not be rendering correctly

### Solution Attempted

**Created new helper**: `fillStructuredTemplate()`
```typescript
export async function fillStructuredTemplate(
  page: Page,
  contactEmail = 'licensing@test.gov.uk',
  premisesData = { ... }
): Promise<void> {
  // Switch to structured template tab
  // Fill all required fields:
  //   - APPLICANT_NAME
  //   - PREMISES_NAME
  //   - PREMISES_ADDRESS
  //   - LICENSABLE_ACTIVITIES
  //   - ACTIVITY_SCHEDULE
  //   - INSPECTION_TIMES
  //   - APPLICATION_DATE
  //   - DEADLINE_DATE
  // ...
}
```

**Updated `publishNotice()`** to use structured template by default.

### Test Results After Update

```
❌ Tests timeout trying to fill 'input[name="APPLICANT_NAME"]'
```

**Issue**: Fields not visible/not found. Possible causes:
1. Lazy loading of `TemplateBuilderForm` component
2. Field names mismatch
3. Template not rendering within timeout
4. Tab switch not completing

### Next Steps Required

1. **Manual browser testing** to verify actual field names and structure
2. **Add wait conditions** for lazy-loaded components
3. **Consider alternative approach**: Use Playwright's codegen to record actual form interaction
4. **Add screenshot capture** on failure to debug visibility issues

---

## Part 3: Manual Testing - PENDING ⏸️

Due to time constraints and test automation issues, comprehensive manual testing was not completed. Below is the planned testing matrix:

### 3A: Licensing Officer Workflows

| Notice Type | Status | Notes |
|-------------|--------|-------|
| **Premises Licence - New** | ⏸️ Not Tested | Primary use case |
| **Premises Licence - Variation** | ⏸️ Not Tested | - |
| **Club Certificate - New** | ⏸️ Not Tested | Club-specific fields |
| **Gambling Betting - New** | ⏸️ Not Tested | Gambling activities section |

### 3B: Traffic Commissioner (GVOL) Workflow

| Notice Type | Status | Notes |
|-------------|--------|-------|
| **GVOL - New Operator** | ⏸️ Not Tested | Traffic area dropdown, 7 UK regions |

### 3C: Planning Officer Workflow

| Notice Type | Status | Notes |
|-------------|--------|-------|
| **EIA Development** | ⏸️ Not Tested | Planning reason field, EIA publicising date |
| **Listed Building** | ⏸️ Not Tested | Statutory consultee statements |
| **Conservation Area** | ⏸️ Not Tested | - |

### 3D: Probate Workflow

| Notice Type | Status | Notes |
|-------------|--------|-------|
| **Trustee Act s.27** | ⏸️ Not Tested | Complete protection wording (CRIT-007) |

### Test Scenarios Required for Each Type

1. **Form Validation**:
   - ✅ All required fields marked clearly
   - ✅ Validation pill accurate (green when complete, red when missing)
   - ✅ Inline error messages helpful
   - ✅ Cannot proceed with incomplete form

2. **Preview Generation**:
   - ✅ Template renders all entered data
   - ✅ Formatting correct (dates, addresses, lists)
   - ✅ Legal wording complete and accurate
   - ✅ No placeholder tokens visible (e.g., `{{FIELD_NAME}}`)

3. **End-to-End Flow**:
   - Step 1: Select notice type → ✅ Works
   - Step 2: Fill template → ⚠️ Needs verification
   - Step 3: Confirm preview → ⏸️ Not tested
   - Step 4: Payment/publish → ⏸️ Not tested

---

## Part 4: Representations Workflow - PENDING ⏸️

### Backend Integration Status

**Critical Question**: Is the representations API implemented?

**Files to Check**:
- `server/routes/` - Look for `/api/notices/:id/representations`
- `server/services/` - Representation business logic
- `src/types/` - Representation TypeScript types

### Test Plan

1. **Publish a notice** (as council officer)
2. **View notice** (as public user)
3. **Submit representation** via form
4. **Verify representation received** (in council portal)

### Expected Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `POST /api/notices/:id/representations` | POST | Submit representation | ❓ Unknown |
| `GET /api/notices/:id/representations` | GET | List representations | ❓ Unknown |
| `GET /api/notices/:id` | GET | View notice details | ✅ Likely exists |

---

## Part 5: Backend Integration Status - TO BE DOCUMENTED

### Areas to Verify

1. **Notice Publication**:
   - Does Step 4 actually POST to `/api/notices/publish`?
   - Is Supabase integration working?
   - Are notices persisted correctly?

2. **File Storage**:
   - OCR processing endpoint functioning?
   - Files stored in Supabase `notices` bucket?

3. **Council Portal**:
   - Routes exist for `/c/:council/:dept/notices`?
   - Can councils view their published notices?
   - Filtering and search working?

4. **Authentication**:
   - Demo mode works (confirmed by test helpers)
   - Supabase auth integration status?

---

## Critical Issues Found

### 🔴 CRITICAL: Test Automation Blocked

**Issue**: Automated tests cannot reliably complete the publish wizard flow.

**Impact**: Cannot run CI/CD regression tests, manual testing required.

**Recommendation**:
1. Fix structured template field visibility issues
2. Add data-testid attributes to all form fields
3. Create dedicated E2E test fixtures with pre-filled data

### 🟡 MEDIUM: OCR Upload Mode Untested

**Issue**: "Upload & OCR" tab not tested in automation or manual flows.

**Impact**: OCR functionality may be broken without knowing.

**Recommendation**: Create separate test suite specifically for OCR upload workflow.

### 🟡 MEDIUM: Manual Testing Required

**Issue**: No manual testing completed due to focus on automation fixes.

**Impact**: Cannot verify UX, validation, or edge cases.

**Recommendation**: Dedicate 2-3 hours for systematic manual testing using the test plan above.

---

## Recommendations

### Immediate Actions (This Sprint)

1. **Fix structured template test automation** (2-4 hours):
   - Manual browser testing to identify correct selectors
   - Update test helpers with proper wait conditions
   - Add screenshot capture on failures

2. **Manual testing of top 3 notice types** (2 hours):
   - Premises Licence (most common)
   - GVOL (unique requirements)
   - EIA Development (complex validation)

3. **Document backend integration status** (1 hour):
   - Grep for API endpoints
   - Check Supabase schema
   - Verify notice publishing actually works

### Next Sprint

1. **OCR Upload Testing**:
   - Create test suite for "Upload & OCR" mode
   - Verify OCR extraction accuracy
   - Test error handling for unsupported formats

2. **Representations End-to-End**:
   - Verify API exists
   - Test public submission form
   - Test council portal view

3. **Cross-Browser Testing**:
   - Chrome, Firefox, Safari
   - Mobile viewport testing
   - Accessibility audit (WCAG 2.1 AA)

---

## Test Helpers Improvements Made

### New/Updated Functions

1. ✅ **`getCategoryForNoticeType()`** - Maps notice IDs to categories
2. ✅ **`selectNoticeType()`** - Handles collapsible categories
3. ✅ **`fillStructuredTemplate()`** - New approach for Step 2
4. ✅ **`uploadNoticeDocument()`** - Enhanced with tab switching
5. ✅ **`publishNoticeWithOCR()`** - Dedicated OCR upload flow

### Documentation Added

- Inline comments explaining each step
- Console.log statements for debugging
- JSDoc comments on all exported functions

---

## Files Modified

```
e2e/council/test-helpers.ts (major updates)
├── selectNoticeType() - Category expansion logic
├── fillStructuredTemplate() - New structured form helper
├── uploadNoticeDocument() - Tab switching support
└── getCategoryForNoticeType() - Category mapping
```

---

## Conclusion

### What Works ✅

- Collapsible category expansion in tests
- Login and navigation to publish wizard
- Step 1: Notice type selection
- Error handling tests

### What's Partially Working ⚠️

- Step 2: Template/upload mode (automation issues, manual untested)

### What's Unknown ❓

- Step 3: Preview confirmation
- Step 4: Payment/publication
- Representations workflow
- Backend API integration
- Council portal functionality

### Success Metrics Achieved

- ✅ Fixed 1 critical test infrastructure issue (collapsible categories)
- ✅ Improved test helper documentation and maintainability
- ✅ Created comprehensive testing framework for future work
- ⏸️ Manual testing plan documented but not executed
- ⏸️ Backend integration not verified

### Estimated Remaining Effort

- **Fix test automation**: 4-6 hours
- **Complete manual testing**: 3-4 hours
- **Verify backend integration**: 2-3 hours
- **Document findings**: 1-2 hours

**Total**: ~12-15 hours to production-ready quality

---

## Appendix: Test Commands

### Run All E2E Tests
```bash
npx playwright test e2e/council/ --reporter=list
```

### Run Single Test (Headed Mode)
```bash
npx playwright test e2e/council/simplified-workflow.spec.ts:28 --headed
```

### Generate Test Code
```bash
npx playwright codegen http://localhost:5173/publish/step-1
```

### View Test Reports
```bash
npx playwright show-report
```

---

**Report Generated**: 2025-11-06
**Next Review**: After manual testing completion
**Owner**: CivicDev (AI Assistant)
