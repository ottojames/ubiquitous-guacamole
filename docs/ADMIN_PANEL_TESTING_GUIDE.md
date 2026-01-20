# Admin Panel Testing Guide

**Version:** 1.0
**Date:** January 20, 2026
**Purpose:** Comprehensive testing guide for the Civic Notices Admin Panel

---

## 🎯 Testing Overview

This guide provides step-by-step instructions for thoroughly testing the Admin Panel implemented by Ralph. Each section includes specific test cases, expected outcomes, and areas to verify.

## 📋 Pre-Testing Checklist

Before starting tests, ensure:
- [ ] All 3 admin database migrations have been applied
- [ ] Super admin account is created
- [ ] RLS policies have been fixed (disabled)
- [ ] Development servers are running (`npm run dev`)
- [ ] You have access to Supabase dashboard

**Test Credentials:**
- **Email:** admin@civicnotices.co.uk
- **Password:** ChangeMeImmediately123!
- **Admin Panel URL:** http://localhost:5173/admin/login

---

## 🧪 Test Sections

### Section 1: Authentication & Login (Priority: CRITICAL)

#### Test 1.1: Basic Login Flow
**Steps:**
1. Navigate to http://localhost:5173/admin/login
2. Enter email: admin@civicnotices.co.uk
3. Enter password: ChangeMeImmediately123!
4. Click "Sign In" button

**Expected Results:**
- [ ] Login page loads with dark theme
- [ ] Form accepts credentials
- [ ] No console errors appear
- [ ] Redirects to dashboard after successful login
- [ ] Session token stored in localStorage

**Edge Cases to Test:**
- [ ] Wrong password (should show error)
- [ ] Wrong email (should show error)
- [ ] Empty fields (should show validation)
- [ ] SQL injection attempt (should be sanitized)

#### Test 1.2: Failed Login Lockout
**Steps:**
1. Attempt login with wrong password 5 times
2. Check for lockout message
3. Wait 30 minutes or reset in database

**Expected Results:**
- [ ] After 5 failures, account locks for 30 minutes
- [ ] Clear error message shows remaining time
- [ ] Failed attempts logged in admin_actions table

#### Test 1.3: Session Management
**Steps:**
1. Login successfully
2. Check browser DevTools > Application > Local Storage
3. Note session expiry time
4. Keep tab open for 2+ hours

**Expected Results:**
- [ ] Session token exists in localStorage
- [ ] Session expires after 2 hours
- [ ] Warning appears at 1:50 (10 min before expiry)
- [ ] Auto-logout at 2 hours

---

### Section 2: Dashboard (Priority: HIGH)

#### Test 2.1: Dashboard Statistics
**Steps:**
1. After login, verify dashboard loads
2. Check each statistics card

**Expected Results:**
- [ ] Total Councils count displays
- [ ] Active Councils count displays
- [ ] Total Firms count displays
- [ ] Total Notices count displays
- [ ] Monthly Revenue displays (£ format)
- [ ] System Health shows status

**Data Validation:**
```sql
-- Run in Supabase to verify counts match
SELECT COUNT(*) FROM organizations WHERE type = 'council';
SELECT COUNT(*) FROM organizations WHERE type = 'firm';
SELECT COUNT(*) FROM notices;
```

#### Test 2.2: Recent Activity Feed
**Expected Results:**
- [ ] Shows last 10 admin actions
- [ ] Each entry shows: timestamp, admin email, action, target
- [ ] Severity badges colored correctly (info=blue, warning=yellow, critical=red)
- [ ] Refreshes every 30 seconds

#### Test 2.3: Quick Actions Panel
**Test Each Button:**
- [ ] "Add Council" button (should navigate or show modal)
- [ ] "Add Firm" button
- [ ] "View Audit Log" button
- [ ] "System Settings" button

#### Test 2.4: Dashboard Responsiveness
**Steps:**
1. Resize browser to mobile width (375px)
2. Check layout adjustments

**Expected Results:**
- [ ] Cards stack vertically on mobile
- [ ] Sidebar becomes hamburger menu
- [ ] All text remains readable
- [ ] No horizontal scroll appears

---

### Section 3: Account Management (Priority: HIGH)

#### Test 3.1: Viewing Accounts
**Steps:**
1. Click "Accounts" in sidebar
2. Test each tab: Councils, Firms, Users

**Expected Results for Each Tab:**
- [ ] Data table loads with accounts
- [ ] Columns display correctly
- [ ] Pagination works (if >25 items)
- [ ] Shows correct account type

#### Test 3.2: Search Functionality
**Steps:**
1. Type in search box
2. Test partial matches
3. Clear search

**Expected Results:**
- [ ] Real-time filtering as you type
- [ ] Searches across name/email fields
- [ ] Clear button resets results
- [ ] No console errors during search

#### Test 3.3: Account Actions
**For a Test Account:**
- [ ] Click "View Details" - modal opens with full info
- [ ] Click "Edit" - can modify non-critical fields
- [ ] Click "Suspend" - status changes, logged in audit
- [ ] Click "Activate" - reactivates suspended account
- [ ] Check audit log shows all actions

#### Test 3.4: Bulk Operations
**Steps:**
1. Select multiple accounts via checkboxes
2. Test bulk suspend
3. Test bulk export

**Expected Results:**
- [ ] Checkboxes appear and work
- [ ] "X selected" counter updates
- [ ] Bulk suspend affects all selected
- [ ] Export generates valid CSV file
- [ ] All bulk actions logged

---

### Section 4: Audit Log (Priority: HIGH)

#### Test 4.1: Log Display
**Navigate to Audit Log:**
- [ ] Table shows recent actions
- [ ] All columns display (Time, Admin, Action, Target, etc.)
- [ ] Severity badges show correct colors
- [ ] Newest entries appear first

#### Test 4.2: Filtering
**Test Each Filter:**
- [ ] Date range picker filters correctly
- [ ] Admin user dropdown works
- [ ] Action category filter works
- [ ] Severity filter works
- [ ] Multiple filters work together

#### Test 4.3: Log Details
**Steps:**
1. Click on any log entry
2. View detail modal

**Expected Results:**
- [ ] Modal shows complete log information
- [ ] Old/New values display for changes
- [ ] IP address shown
- [ ] Can close modal

#### Test 4.4: Export Functionality
**Steps:**
1. Apply filters
2. Click "Export to CSV"

**Expected Results:**
- [ ] CSV downloads with filtered data
- [ ] CSV has proper headers
- [ ] Special characters escaped correctly
- [ ] Date format readable

#### Test 4.5: Infinite Scroll
**If >50 logs exist:**
- [ ] Scroll to bottom loads more
- [ ] No duplicate entries
- [ ] Loading indicator appears
- [ ] Scroll position maintained

---

### Section 5: 2FA Setup (Priority: MEDIUM)

#### Test 5.1: Enable 2FA
**Steps:**
1. Navigate to Settings or Security
2. Click "Setup 2FA"
3. Scan QR with authenticator app
4. Enter 6-digit code
5. Save backup codes

**Expected Results:**
- [ ] QR code generates
- [ ] Code validation works
- [ ] Backup codes display (10 codes)
- [ ] Can download backup codes
- [ ] 2FA status updates in UI

#### Test 5.2: Login with 2FA
**After enabling 2FA:**
1. Logout
2. Login with email/password
3. Enter 2FA code

**Expected Results:**
- [ ] 2FA prompt appears after password
- [ ] Accepts valid 6-digit code
- [ ] Rejects invalid codes
- [ ] Backup code works as alternative

---

### Section 6: Security Tests (Priority: CRITICAL)

#### Test 6.1: Authorization
**Without logging in, try accessing:**
- [ ] http://localhost:5173/admin/dashboard (should redirect to login)
- [ ] http://localhost:5173/admin/accounts (should redirect to login)
- [ ] http://localhost:5173/admin/audit (should redirect to login)

#### Test 6.2: API Security
**Using curl or Postman:**
```bash
# Test without auth token
curl http://localhost:5174/api/admin/accounts/councils
```
**Expected:** 401 Unauthorized

#### Test 6.3: Input Sanitization
**In search/form fields, test:**
- [ ] `<script>alert('XSS')</script>` - should be escaped
- [ ] `'; DROP TABLE admin_users; --` - should be safe
- [ ] Very long strings (1000+ chars) - should handle gracefully

#### Test 6.4: Session Security
**Check in DevTools:**
- [ ] Session token is random/unguessable
- [ ] No sensitive data in localStorage
- [ ] HTTPS enforced in production
- [ ] Cookies have Secure flag (in production)

---

### Section 7: Performance Tests (Priority: MEDIUM)

#### Test 7.1: Page Load Times
**Using DevTools Network tab:**
- [ ] Dashboard loads < 2 seconds
- [ ] Account list loads < 2 seconds
- [ ] Audit log loads < 2 seconds
- [ ] Search responds < 500ms

#### Test 7.2: Concurrent Sessions
**Steps:**
1. Login in Chrome
2. Login in Firefox
3. Perform actions in both

**Expected Results:**
- [ ] Both sessions work independently
- [ ] Actions from both appear in audit log
- [ ] No session conflicts

#### Test 7.3: Large Data Sets
**If available, test with:**
- [ ] 1000+ accounts in table
- [ ] 10000+ audit log entries
- [ ] Pagination performs well
- [ ] Search remains responsive

---

### Section 8: Mobile & Browser Compatibility (Priority: LOW)

#### Test 8.1: Mobile Devices
**Test on actual device or Chrome DevTools:**
- [ ] iPhone SE (375px width)
- [ ] iPad (768px width)
- [ ] Touch interactions work
- [ ] Modals are accessible

#### Test 8.2: Browser Compatibility
**Test basic functionality in:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## 🐛 Known Issues & Limitations

Based on Ralph's implementation, be aware of:

1. **TypeScript Errors:** 97 pre-existing Cypress errors (non-blocking)
2. **ESLint Warnings:** 662 in JS files (non-critical)
3. **Database Requirements:** Admin tables must exist for full functionality
4. **Service Role Key:** Required for backend operations
5. **RLS Policies:** Must be disabled for proper operation

---

## 📝 Test Execution Tips

1. **Clear browser cache** between major test sections
2. **Check console** for errors after each action
3. **Monitor network tab** for failed API calls
4. **Test both happy path and edge cases**
5. **Document unexpected behaviors** in testing log
6. **Take screenshots** of any issues found

---

## 🚀 Automated Test Commands

```bash
# Run all E2E tests
npx playwright test e2e/admin-panel.spec.ts

# Run with UI (headed mode)
npx playwright test e2e/admin-panel.spec.ts --headed

# Run specific test
npx playwright test e2e/admin-panel.spec.ts -g "login flow"

# Generate test report
npx playwright show-report
```

---

## ✅ Testing Complete Checklist

After all tests:
- [ ] All critical tests pass
- [ ] Security vulnerabilities addressed
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Audit trail complete
- [ ] Documentation updated
- [ ] Testing log filled out
- [ ] Feedback provided to Ralph

---

## 📞 Support & Escalation

If you encounter blocking issues:
1. Check server logs: `npm run dev` output
2. Check Supabase logs in dashboard
3. Review `/docs/ADMIN_SECURITY_AUDIT.md`
4. Consult `/docs/ADMIN_PANEL_GUIDE.md`

---

**Remember:** The goal is to validate that Ralph's implementation meets enterprise standards for security, functionality, and user experience. Document everything in the testing log!