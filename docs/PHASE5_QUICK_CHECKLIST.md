# Phase 5 Authentication - Quick Testing Checklist

**Print this and check off as you test each item**

---

## Pre-Flight Check

- [ ] Both dev servers running (`npm run dev`)
  - Frontend: http://localhost:5173
  - Backend: http://localhost:5174

- [ ] Run verification script: `./scripts/verify-phase5.sh`
  - Should show "All critical checks passed"

---

## Database Migrations (Required First!)

### Apply in Supabase Dashboard SQL Editor:

- [ ] **Migration 1:** `20260122000001_unified_auth_system.sql`
  - Creates platform_admin_settings table
  - Creates helper functions (get_user_org_id, etc.)
  - Creates active_councils view

- [ ] **Migration 2:** `20260122000002_jwt_custom_claims.sql`
  - Creates custom_access_token_hook function

- [ ] **Migration 3:** `20260122000003_unified_rls_policies.sql`
  - Creates 4 new RLS policies
  - Enforces multi-tenancy

### Enable JWT Hook:

- [ ] Dashboard → Authentication → Hooks
- [ ] Enable "Custom Access Token"
- [ ] Select: `public.custom_access_token_hook`
- [ ] Save

---

## Core Authentication Tests

### Test 1: Sign In
- [ ] Navigate to: http://localhost:5173/auth/signin
- [ ] Sign in with test account
- [ ] No errors in console
- [ ] Redirects to correct portal

### Test 2: Auth Debug Page
- [ ] Navigate to: http://localhost:5173/auth-debug
- [ ] **Check Auth Context State:**
  - [ ] User: Shows email
  - [ ] Organization: Shows name & ID (NOT NULL)
  - [ ] Department: Shows name & ID (for council users)
  - [ ] Role: Shows correct role
- [ ] **Check JWT Claims:**
  - [ ] app_metadata.organization_id exists
  - [ ] app_metadata.organization_name exists
  - [ ] app_metadata.is_platform_admin exists
- [ ] **Problems Detected:** Should be 0

### Test 3: Session Persistence
- [ ] Sign in
- [ ] Reload page (F5)
- [ ] Still signed in (no redirect to login)
- [ ] Organization context still loaded

---

## Council Dropdown Tests

### Test 4: Firm User - See All Councils
- [ ] Sign in as firm user
- [ ] Navigate to: http://localhost:5173/publish/step-1
- [ ] Select any notice type → Next
- [ ] **Council dropdown should:**
  - [ ] Show at least 8 councils
  - [ ] Load from database (not hardcoded)
  - [ ] Be editable (not disabled)
  - [ ] Allow selection of any council

### Test 5: Council User - Auto-Select Own Council
- [ ] Sign in as council user (e.g., test@sampletonborough.gov.uk)
- [ ] Navigate to: http://localhost:5173/publish/step-1
- [ ] Select any notice type → Next
- [ ] **Council dropdown should:**
  - [ ] Show only user's council (Sampletonborough)
  - [ ] Be disabled (read-only)
  - [ ] Auto-selected (no manual selection needed)

---

## Notice Publishing Tests

### Test 6: Submit Notice with Organization Context
- [ ] Sign in as council user
- [ ] Navigate to: http://localhost:5173/publish/step-1
- [ ] Complete all 4 steps of wizard
- [ ] Submit notice
- [ ] **Should:**
  - [ ] Submit successfully (no errors)
  - [ ] Show confirmation page with notice ID
  - [ ] No "organization_id is null" errors

### Test 7: Verify Notice in Database
```sql
-- Run in Supabase SQL Editor:
SELECT id, title, organization_id, department_id, status
FROM notices
ORDER BY created_at DESC
LIMIT 5;
```
- [ ] New notice has organization_id (NOT NULL)
- [ ] New notice has department_id (for council users)
- [ ] Status is 'pending' or 'published'

---

## Multi-Tenancy (RLS) Tests

### Test 8: Users See Only Their Organization's Notices
- [ ] Sign in as User A (Organization A)
- [ ] Navigate to notices list
- [ ] Note notice IDs visible
- [ ] Sign out
- [ ] Sign in as User B (Organization B)
- [ ] Navigate to notices list
- [ ] **Should:**
  - [ ] See only Organization B notices
  - [ ] NOT see User A's notices
  - [ ] No cross-organization data leakage

### Test 9: Platform Admin Sees Everything
- [ ] Sign in as platform admin
- [ ] Navigate to: http://localhost:5173/admin/accounts
- [ ] **Should see:**
  - [ ] ALL councils in list
  - [ ] ALL firms in list
  - [ ] No RLS restrictions

---

## Department Context Tests

### Test 10: Department Context Loads
- [ ] Sign in as council user with department
- [ ] Check /auth-debug
- [ ] **Should show:**
  - [ ] Department: Name and ID (NOT NULL)
  - [ ] Organization: Name and ID (NOT NULL)

### Test 11: Department Switching (if multi-dept user)
- [ ] Sign in as user with multiple departments
- [ ] Navigate to council dashboard
- [ ] Switch department (if switcher visible)
- [ ] **Should:**
  - [ ] Dashboard updates with dept-specific data
  - [ ] Organization stays same
  - [ ] Department context updates
  - [ ] URL updates: /c/council/dept/department-name

---

## Performance Tests

### Test 12: Load Times
- [ ] Sign in: < 2 seconds
- [ ] Organization context loads: < 500ms
- [ ] Council dropdown loads: < 1 second
- [ ] Notice list loads: < 2 seconds
- [ ] No infinite loading spinners

### Test 13: No Console Errors
- [ ] Open browser DevTools → Console
- [ ] Sign in
- [ ] Navigate to 3 different pages
- [ ] **Should:**
  - [ ] No red errors in console
  - [ ] No authentication errors
  - [ ] No "organization undefined" errors

---

## API Tests (Optional but Recommended)

### Test 14: Health Check
```bash
curl http://localhost:5174/api/health
```
- [ ] Returns: `{"status":"ok"}`

### Test 15: Organization Query
```bash
curl http://localhost:5174/api/organizations \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns list of organizations
- [ ] Status: 200 OK

---

## Rollback Test (If Needed)

### Test 16: Rollback Procedure
- [ ] Document works: docs/PHASE5_AUTH_TESTING_GUIDE.md
- [ ] SQL rollback scripts present
- [ ] Can disable JWT hook in dashboard
- [ ] Can drop new policies if needed

---

## Final Verification

### All Systems Go ✓
- [ ] All 15 tests passed
- [ ] No critical errors found
- [ ] Organization context working
- [ ] Council dropdown dynamic
- [ ] Notices linked to organizations
- [ ] RLS policies enforcing isolation
- [ ] Platform admin access working

### Issues Found
If any tests failed, document:
1. Test number that failed
2. Exact error message
3. Screenshot if UI issue
4. Browser console output

---

## Next Steps After Testing

### If All Tests Pass:
- [ ] Update progress.txt with results
- [ ] Test with real user accounts
- [ ] Monitor for 24 hours
- [ ] Plan production migration

### If Tests Fail:
- [ ] Review troubleshooting guide
- [ ] Check Supabase logs
- [ ] Verify migrations applied
- [ ] Check JWT hook enabled
- [ ] Share findings with Ralph

---

## Quick Reference

**Auth Debug Page:** http://localhost:5173/auth-debug
**Verification Script:** `./scripts/verify-phase5.sh`
**Full Guide:** docs/PHASE5_AUTH_TESTING_GUIDE.md
**Troubleshooting:** See "Troubleshooting Guide" section in full guide

**Ralph's Commits:**
```
68e576b - Phase 5 completion
624a6ab - Task 5.10 (Auth Debug)
e5a3820 - Task 5.9 (Unified Auth)
74db3ba - Task 5.8 (Migrate Users)
1f7da6d - Task 5.7 (RLS Policies)
```

---

**Checklist Version:** 1.0
**Date:** January 20, 2026
**Estimated Time:** 30-45 minutes
**Difficulty:** Moderate (requires database access)
