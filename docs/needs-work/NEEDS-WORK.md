# 🔧 NEEDS WORK - Failed & Partial Features
Last Updated: 2026-01-16
Identified By: Otto Clarke

---

## Priority Levels

- 🔴 **P0 - CRITICAL**: Blocks other features, security issue, or data loss
- 🟠 **P1 - HIGH**: Core functionality broken, affects many users
- 🟡 **P2 - MEDIUM**: Feature partially works, workaround exists
- 🟢 **P3 - LOW**: Minor issue, cosmetic, or edge case

---

## 🔴 P0 - CRITICAL FAILURES (Fix Immediately)

### Known Critical Issues from Ralph's Work:

#### 🔴 FIX-001: Demo Authentication (PARTIAL FAILURE)
**Status:** 1 of 3 accounts working
**Test Date:** [Awaiting test]
**Working:**
- ✅ licensing@sampletonborough.gov.uk / testpass123

**Broken:**
- ❌ licensing@westminster.gov.uk / testpass123 - "Invalid credentials"
- ❌ solicitor@wilsonpartners.com / testpass123 - "Database error querying schema"

**Impact:** Cannot test council or firm features without working logins

**Error Details:**
```javascript
// Add actual error from console when tested
```

**Fix Required:**
1. Check if users exist in Supabase Auth
2. Verify password hashes are correct
3. Check organization/profile relationships
4. Test with Supabase Admin API

**Ralph Ticket:**
```markdown
Fix Westminster and Wilson Partners authentication
- Create users if missing
- Reset passwords properly
- Verify organization links
- Test login flow end-to-end
```

---

## 🟠 P1 - HIGH PRIORITY (Core Features Broken)

### From Previous Ralph Iterations:

#### 🟠 US-0007: Firm Notices Page Runtime Error
**Status:** Page loads but crashes
**Error:** "Cannot read property 'id' of undefined at organization.id"
**Location:** src/pages/firm/Notices.tsx:234
**Impact:** Firm users cannot view their notices

**Fix Required:**
```javascript
// Add null check for organization
if (!organization?.id) {
  return <LoadingState />;
}
```

#### 🟠 US-0008: Firm Billing Page Runtime Error
**Status:** Similar organization context issue
**Impact:** Cannot access billing features

---

## 🟡 P2 - MEDIUM PRIORITY (Partial Functionality)

### [Add items discovered during testing]

#### Template: Medium Priority Issue
**Feature:** [Feature name]
**Status:** [What works vs what doesn't]
**Workaround:** [Temporary solution if any]
**Fix Required:** [What needs to be done]

---

## 🟢 P3 - LOW PRIORITY (Minor Issues)

### [Add cosmetic or edge case issues]

---

## 📋 Fix Tickets for Ralph/AI

### Batch 1 - Authentication Fixes
```markdown
## Task: Fix Demo Authentication for All Accounts
Priority: P0 - CRITICAL

### Requirements:
1. Fix Westminster Council login
   - Email: licensing@westminster.gov.uk
   - Password: testpass123
   - Should redirect to: /c/westminster/licensing/dashboard

2. Fix Wilson Partners login
   - Email: solicitor@wilsonpartners.com
   - Password: testpass123
   - Should redirect to: /f/wilson-partners/dashboard

### Test Steps:
1. Start servers: npm run dev
2. Navigate to /auth/signin
3. Test each account
4. Verify redirect works
5. Verify portal loads without errors

### Evidence Required:
- Screenshot of successful login
- Console showing no errors
- Database showing user exists
```

### Batch 2 - Organization Context Fixes
```markdown
## Task: Fix Organization Context in Firm Pages
Priority: P1 - HIGH

### Affected Files:
- src/pages/firm/Notices.tsx
- src/pages/firm/Billing.tsx
- src/pages/firm/Team.tsx

### Issue:
Organization is undefined when components mount

### Fix Required:
1. Add loading state while organization loads
2. Add null checks before accessing organization.id
3. Ensure FirmLayout provides organization context
4. Test with working firm login

### Test Evidence:
- No console errors
- Pages load completely
- Data displays correctly
```

---

## 🔄 Retest Schedule

| Feature | Last Test | Next Test | Assigned To |
|---------|-----------|-----------|-------------|
| FIX-001 | Pending | After fix | Otto |
| US-0007 | Pending | After fix | Otto |
| US-0008 | Pending | After fix | Otto |

---

## 📊 Issue Statistics

| Priority | Total | Fixed | Remaining | Fix Rate |
|----------|-------|-------|-----------|----------|
| P0 - Critical | 1 | 0 | 1 | 0% |
| P1 - High | 2 | 0 | 2 | 0% |
| P2 - Medium | 0 | 0 | 0 | - |
| P3 - Low | 0 | 0 | 0 | - |
| **TOTAL** | **3** | **0** | **3** | **0%** |

---

## Fix Verification Process

1. **Developer fixes issue** (Ralph or manual)
2. **Developer tests locally** and provides evidence
3. **Otto tests independently** in clean environment
4. **If pass:** Move to VERIFIED-COMPLETE.md
5. **If fail:** Stay here with updated notes

---

## Notes

**Remember:**
- An item stays here until it's 100% working
- "Mostly working" = NOT DONE
- "Works on my machine" = NOT DONE
- "Should work" = NOT DONE

Only moves to VERIFIED-COMPLETE.md after independent testing confirms it's production ready.

---