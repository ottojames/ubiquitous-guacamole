# Phase 5 Authentication Unification - Workflow Summary

**Quick visual guide to understanding and testing Ralph's implementation**

---

## 🎯 What Problem Does This Solve?

**BEFORE Phase 5:**
- ❌ Dual authentication systems conflicting
- ❌ Notices created WITHOUT organization_id (NULL)
- ❌ Council dropdown hardcoded in JSON file
- ❌ No proper multi-tenancy isolation
- ❌ Login failures and context errors

**AFTER Phase 5:**
- ✅ Single unified authentication system
- ✅ All notices linked to organizations
- ✅ Council dropdown loads from database
- ✅ RLS policies enforce proper isolation
- ✅ Seamless login with organization context

---

## 📋 The 4-Step Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP 1: DATABASE SETUP                    │
│                         (15 minutes)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Apply Migration 1: unified_auth_system.sql              │
│     → Creates platform_admin_settings table                 │
│     → Creates helper functions (get_user_org_id, etc.)      │
│     → Creates active_councils view                          │
│     → Makes organization_id required on notices             │
│                                                              │
│  2. Apply Migration 2: jwt_custom_claims.sql                │
│     → Creates custom_access_token_hook function             │
│     → Adds org context to JWT tokens                        │
│                                                              │
│  3. Apply Migration 3: unified_rls_policies.sql             │
│     → Creates 4 new RLS policies                            │
│     → Enforces multi-tenancy isolation                      │
│                                                              │
│  ✓ Verify: Run scripts/check-migrations.sql                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 STEP 2: ENABLE JWT HOOK                      │
│                         (2 minutes)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Supabase Dashboard → Authentication → Hooks                │
│                                                              │
│  1. Click "Enable" on Custom Access Token                   │
│  2. Select function: public.custom_access_token_hook        │
│  3. Save                                                     │
│                                                              │
│  ⚠️ CRITICAL: Without this, org context won't work!         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 STEP 3: START DEV SERVERS                    │
│                         (1 minute)                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Terminal:                                                   │
│  $ npm run dev                                               │
│                                                              │
│  Wait for:                                                   │
│  ✓ Vite dev server: http://localhost:5173                   │
│  ✓ Express API:     http://localhost:5174                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  STEP 4: TEST & VERIFY                       │
│                         (20 minutes)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Quick Verification Script:                                  │
│  $ ./scripts/verify-phase5.sh                                │
│                                                              │
│  Manual Tests:                                               │
│  1. Sign in → Check no errors                               │
│  2. Visit /auth-debug → Verify org context loaded           │
│  3. Publish notice → Check org_id not null                  │
│  4. Check council dropdown → Dynamic loading                │
│  5. Test multi-tenancy → Users see only own data            │
│                                                              │
│  ✓ Use: docs/PHASE5_QUICK_CHECKLIST.md                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 How It Works - Technical Flow

### 1. User Signs In
```
User enters email/password
        ↓
Supabase Auth validates credentials
        ↓
JWT token generated
        ↓
custom_access_token_hook fires
        ↓
Queries organization_memberships table
        ↓
Adds org context to JWT app_metadata:
  - organization_id
  - organization_name
  - organization_type
  - department_id (for councils)
  - role
  - is_platform_admin
        ↓
Returns enriched JWT to client
```

### 2. Context Loads on Client
```
UnifiedAuthContext receives JWT
        ↓
Extracts app_metadata from token
        ↓
Loads full organization from database
        ↓
Loads departments (if council user)
        ↓
Sets context state:
  - user
  - session
  - organization (NOT NULL)
  - department
  - role
  - isPlatformAdmin
        ↓
Context available throughout app
```

### 3. Notice Publishing Uses Context
```
User completes publish wizard
        ↓
PaymentStep accesses UnifiedAuthContext
        ↓
Extracts organization.id
        ↓
Includes in notice submission:
  {
    title: "...",
    organization_id: "uuid-from-context",
    department_id: "uuid-from-context",
    ...
  }
        ↓
Server receives with org context
        ↓
Notice saved with proper organization link
```

### 4. RLS Policies Enforce Access
```
User queries notices table
        ↓
Postgres checks RLS policies:
  1. Is user platform admin?
     → YES: Allow all access
     → NO: Check org membership

  2. Does user belong to this org?
     → YES: Allow access to org notices
     → NO: Deny access

  3. Is notice public + published?
     → YES: Allow read access
     → NO: Deny access
        ↓
Only authorized notices returned
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  UnifiedAuthContext.tsx (Single Source of Truth)            │
│  ├── Manages session state                                  │
│  ├── Loads organization context                             │
│  ├── Loads department context                               │
│  ├── Provides auth actions (signIn, signOut, switch)        │
│  └── Exposes permissions (hasPermission, canAccessAdmin)    │
│                                                              │
│  DynamicCouncilSelect.tsx                                   │
│  ├── Queries active_councils view                           │
│  ├── Auto-selects for council users                         │
│  └── Replaces static councils.json                          │
│                                                              │
│  AuthDebug.tsx (/auth-debug)                                │
│  ├── Shows complete auth state                              │
│  ├── Displays JWT claims                                    │
│  ├── Lists memberships                                      │
│  └── Detects common problems                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↕
                    JWT with Claims
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE AUTH                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  custom_access_token_hook (Function)                        │
│  ├── Fires on every JWT generation                          │
│  ├── Queries organization_memberships                       │
│  ├── Queries department_memberships                         │
│  ├── Queries platform_admin_settings                        │
│  └── Enriches JWT with organization context                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↕
                      Database Queries
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tables:                                                     │
│  ├── organizations (councils, firms)                        │
│  ├── departments (licensing, planning, etc.)                │
│  ├── organization_memberships (user → org)                  │
│  ├── department_memberships (user → dept)                   │
│  ├── platform_admin_settings (admin users)                  │
│  └── notices (with organization_id NOT NULL)                │
│                                                              │
│  Views:                                                      │
│  └── active_councils (replaces councils.json)               │
│                                                              │
│  Helper Functions:                                           │
│  ├── private.get_user_org_id()                              │
│  ├── private.get_user_dept_id()                             │
│  └── private.is_platform_admin()                            │
│                                                              │
│  RLS Policies:                                               │
│  ├── platform_admins_full_access                            │
│  ├── org_members_see_own_notices                            │
│  ├── dept_members_manage_notices                            │
│  └── public_notices_readable                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Scenario 1: Council User Publishes Notice
```
Given: Sarah is a council licensing officer
When:  She signs in and publishes a premises licence notice
Then:
  ✓ Her organization (Sampletonborough Council) auto-loads
  ✓ Her department (Licensing) auto-loads
  ✓ Council dropdown shows only Sampletonborough (read-only)
  ✓ Notice submits with organization_id = Sampletonborough's UUID
  ✓ Notice submits with department_id = Licensing's UUID
  ✓ Only Sampletonborough council users can see this notice
```

### Scenario 2: Firm User Publishes Notice
```
Given: Emma is a solicitor at Wilson & Partners
When:  She signs in and publishes a notice for a client
Then:
  ✓ Her organization (Wilson & Partners) auto-loads
  ✓ No department context (firms don't have departments)
  ✓ Council dropdown shows ALL councils (editable)
  ✓ She selects target council: Westminster
  ✓ Notice submits with organization_id = Wilson & Partners' UUID
  ✓ Notice submits with council = Westminster (target)
  ✓ Both Wilson & Partners AND Westminster council can see notice
```

### Scenario 3: Platform Admin Reviews All Data
```
Given: Admin user with platform admin privileges
When:  They sign in and view admin panel
Then:
  ✓ is_platform_admin = true in JWT
  ✓ Can access /admin routes
  ✓ Can view ALL councils (not just own org)
  ✓ Can view ALL firms
  ✓ Can view ALL notices (RLS bypassed)
  ✓ Can manage all organizations
```

### Scenario 4: Multi-Tenancy Isolation
```
Given: Two councils: Sampletonborough and Westminster
When:  User from Sampletonborough queries notices
Then:
  ✓ Sees only Sampletonborough notices
  ✓ Does NOT see Westminster notices
  ✓ RLS policy filters by organization_id
  ✓ Database query includes: WHERE organization_id = 'their-org-id'
```

---

## 🐛 Common Issues & Quick Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| **JWT Hook Not Working** | Organization context is null | Enable hook in Dashboard → Auth → Hooks |
| **Councils Don't Load** | Dropdown empty | Check active_councils view has data |
| **Notice Submit Fails** | "organization_id is null" error | Verify JWT hook enabled + sign out/in |
| **RLS Blocks Everything** | Empty lists everywhere | Check organization_memberships exist |
| **Can't See Other Orgs** | Expected (correct behavior) | RLS working - users isolated by design |

---

## 📚 Documentation Structure

```
docs/
├── PHASE5_AUTH_TESTING_GUIDE.md         ← Full detailed guide (15 pages)
├── PHASE5_QUICK_CHECKLIST.md            ← Print-friendly checklist (5 pages)
└── PHASE5_WORKFLOW_SUMMARY.md           ← This document (visual overview)

scripts/
├── verify-phase5.sh                     ← Automated verification script
└── check-migrations.sql                 ← SQL to verify migrations applied

supabase/migrations/
├── 20260122000001_unified_auth_system.sql
├── 20260122000002_jwt_custom_claims.sql
└── 20260122000003_unified_rls_policies.sql
```

---

## ⏱️ Time Estimates

| Task | Time | Difficulty |
|------|------|------------|
| Apply 3 migrations | 10 min | Easy |
| Enable JWT hook | 2 min | Easy |
| Start dev servers | 1 min | Easy |
| Run verification script | 2 min | Easy |
| Manual testing (full) | 30 min | Medium |
| Troubleshooting (if needed) | 15-60 min | Medium-Hard |
| **TOTAL** | **~1 hour** | **Medium** |

---

## ✅ Success Checklist

Your Phase 5 implementation is working when:

- [x] All 3 migrations applied (check with check-migrations.sql)
- [x] JWT hook enabled and active (Dashboard shows green "Active")
- [x] Both dev servers running (5173 + 5174)
- [x] Users can sign in without errors
- [x] /auth-debug shows organization context (NOT NULL)
- [x] JWT tokens include app_metadata.organization_id
- [x] Council dropdown loads dynamically from database
- [x] Notices submit with organization_id
- [x] Users see only their organization's notices
- [x] Platform admins see everything
- [x] No console errors on authentication
- [x] verify-phase5.sh shows "All critical checks passed"

---

## 🚀 Next Steps

### After Successful Testing:
1. Document any issues found (even minor)
2. Test with 2-3 real user accounts
3. Monitor application logs for 24 hours
4. Create staging environment
5. Plan production migration

### If Issues Found:
1. Document exact error messages
2. Capture screenshots/videos
3. Check troubleshooting section in full guide
4. Review Ralph's commits for implementation details
5. Share findings in progress.txt for Ralph

---

## 📞 Quick Reference

**Key URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5174
- Auth Debug: http://localhost:5173/auth-debug
- Admin Panel: http://localhost:5173/admin

**Key Commands:**
```bash
npm run dev                    # Start both servers
./scripts/verify-phase5.sh     # Verify setup
npm test                       # Run tests
```

**Key Files:**
- UnifiedAuthContext: `src/contexts/UnifiedAuthContext.tsx`
- DynamicCouncilSelect: `src/components/DynamicCouncilSelect.tsx`
- Auth Debug Page: `src/pages/AuthDebug.tsx`

**Ralph's Commits:**
```
68e576b - docs: Update PRD and progress for Phase 5 completion
624a6ab - feat: Task 5.10 - Create Auth Debug Page
e5a3820 - feat: Task 5.9 - Update App.tsx to Use Unified Auth
74db3ba - feat: Task 5.8 - Migrate Existing Admin Users
1f7da6d - feat: Task 5.7 - Update RLS Policies
```

---

**Document Version:** 1.0
**Created:** January 20, 2026
**For:** Otto (testing Ralph's Phase 5 implementation)
**Estimated Testing Time:** 1 hour
