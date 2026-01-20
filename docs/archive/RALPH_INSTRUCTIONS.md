# CRITICAL INSTRUCTIONS FOR RALPH

**Date:** 2026-01-17
**Priority:** EXTREMELY URGENT - All testing is blocked

Otto is extremely frustrated. These issues have been ongoing and need PERFECT fixes immediately. You must approach this with the expertise of a senior engineer with 20 years of experience.

---

## 🚨 CRITICAL ISSUE #1: Password Validation Blocking ALL Logins

**ERROR:** Cannot login with demo accounts (testpass123)
**BLOCKING:** ALL council and firm portal testing

### What's happening:
- Login form rejects testpass123 saying it needs uppercase, lowercase, number, special character
- This is preventing ALL testing of council and firm features
- Otto said: "This is very, very easy" - he's frustrated this keeps breaking

### FIX REQUIRED:
1. When VITE_DEMO_MODE=true, BYPASS password complexity validation for demo accounts
2. Demo emails: licensing@westminster.gov.uk, solicitor@wilsonpartners.com, licensing@sampletonborough.gov.uk
3. These MUST work with testpass123
4. Also fix UI: "don't have an account? Create one here" text should be WHITE

---

## 🔴 CRITICAL ISSUE #2: Council Auto-Population (FIX-007)

**ERROR:** "invalid input in red, expected string, received array"
**LOCATION:** Publish wizard Step 3, when selecting council

### What's happening:
- Type mismatch: form expects string but getting array
- Likely the council selection is returning an array instead of a string ID
- This completely breaks auto-population

### FIX REQUIRED:
1. Debug CouncilDepartmentSelect component - check what it returns on selection
2. Ensure it returns a STRING organization ID, not an array
3. Test with Sampletonborough Council - fields MUST auto-populate

---

## 🔴 CRITICAL ISSUE #3: Registration Wizard (FIX-011)

**ERROR:** "cannot read properties of undefined (reading '0')"
**LOCATION:** Final step when clicking "Complete Registration"

### What's happening:
- Null reference error - trying to access index 0 of undefined
- Likely trying to access array[0] when array is undefined
- Registration cannot complete at all

### FIX REQUIRED:
1. Find where code is accessing [0] in registration completion
2. Add null checks before array access
3. Also ADD: Password confirmation field (enter password twice)
4. Test both council AND firm registration

---

## 🟡 UI IMPROVEMENT: Distance Filter (ENHANCEMENT-001)

**STATUS:** Partially working but needs UI improvement

### What's happening:
- Distance display works ✓
- Can sort by nearest ✓
- But filter is at top of page, not inside right-hand rail

### FIX REQUIRED:
1. Move sort/filter controls INSIDE the right-hand notice list panel
2. Add dropdown with: "Newly Added", "Recently Added", "Nearest"
3. Look at publicnoticeportals.co.uk for reference
4. Apply UI/UX best practices (15+ years experience level)

---

## TESTING APPROACH

Ralph, you have DIRECT browser access. Use it to:
1. Test login with demo accounts
2. Test council selection and auto-population
3. Test registration completion
4. Verify fixes in real Chrome browser

## QUALITY REQUIREMENTS

Otto wants:
- **PERFECT, CLEAN CODE**
- **20 years experience level coding**
- **No more failures - this needs to work**
- **Complete understanding of the problems**

## PRIORITY ORDER

1. **FIRST:** Fix CRITICAL-001 (password validation) - this blocks everything
2. **SECOND:** Fix FIX-007 (array error in council selection)
3. **THIRD:** Fix FIX-011 (registration undefined error)
4. **FOURTH:** Improve ENHANCEMENT-001 (distance filter UI)

---

Ralph, Otto is counting on you to fix these once and for all. Use your most advanced capabilities and ensure these fixes are production-quality.