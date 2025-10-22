# Phase 12 Testing Guide - Passwordless Magic Link Authentication

## Overview

Phase 12 implements a passwordless applicant portal allowing individuals to submit licensing applications without creating an account or joining an organization.

---

## ✅ Completed Features

### 1. Passwordless Authentication System
- **ApplicantSignIn.tsx** (149 LOC)
  - Magic link email authentication via Supabase OTP
  - No password required
  - Email redirects to dashboard after verification
  - Clean, user-friendly interface with instructions

### 2. Applicant Dashboard
- **ApplicantDashboard.tsx** (278 LOC)
  - Shows all submissions for the applicant's email
  - Status badges (pending, approved, rejected, changes requested)
  - Action alerts for submissions requiring resubmission
  - Links to detailed submission views
  - "New Application" CTA button

### 3. Submission Detail View
- **ApplicantSubmissionDetail.tsx** (450 LOC)
  - Full submission details display
  - Status-specific alerts and actions
  - Council feedback display
  - Resubmission workflow for changes requested
  - Link to view published notices

### 4. Routing
- Added 3 new routes to App.tsx:
  - `/applicant/sign-in` → ApplicantSignIn
  - `/applicant/dashboard` → ApplicantDashboard
  - `/applicant/submissions/:submissionId` → ApplicantSubmissionDetail

---

## 🧪 Testing Workflow

### **Test 1: Magic Link Sign-In Flow**

1. **Navigate to Sign-In Page**
   ```
   http://localhost:5173/applicant/sign-in
   ```

2. **Enter Email Address**
   - Use your test email (e.g., `test@example.com`)
   - Click "Send Magic Link"

3. **Check Email**
   - Supabase will send an email with a magic link
   - If using Supabase local development, check the terminal for the link
   - Production: Check your email inbox

4. **Click Magic Link**
   - Should redirect to `/applicant/dashboard`
   - If no submissions exist, should show empty state
   - If submissions exist, should display list with status badges

**Expected Outcome:**
- ✅ Email sent successfully
- ✅ Magic link redirects to dashboard
- ✅ User email displayed in header
- ✅ "New Application" and "Sign Out" buttons visible

---

### **Test 2: View Dashboard (Empty State)**

1. **Sign in with new email**
   - Use an email that has never submitted applications

2. **Verify Empty State Display**
   - Should show inbox icon
   - Should display "No Applications Yet" message
   - Should show "Submit Application" CTA button

**Expected Outcome:**
- ✅ Empty state displayed correctly
- ✅ CTA button links to `/apply`
- ✅ Help section visible with guidance

---

### **Test 3: View Dashboard (With Submissions)**

**Prerequisites:**
- Create test submissions using firm portal or council portal
- Ensure submissions have `applicant_email` matching your test email

1. **Sign in with email that has submissions**

2. **Verify Submission Cards Display**
   - Each submission should show:
     * Title
     * Notice type (formatted, e.g., "Premises Licence New")
     * Status badge (colored appropriately)
     * Council + department name
     * Submitted date
     * Reviewed date (if reviewed)

3. **Check Status-Specific Alerts**
   - **Changes Requested**: Orange alert with feedback text
   - **Approved**: Green alert with approval message
   - **Rejected**: Red alert with rejection reason

**Expected Outcome:**
- ✅ All submissions displayed
- ✅ Status badges color-coded correctly
- ✅ Council information visible
- ✅ Dates formatted properly (e.g., "21 Oct 2025")

---

### **Test 4: View Submission Detail**

1. **From Dashboard, click any submission card**

2. **Verify Detail Page Displays**
   - Header shows title, notice type, and status badge
   - "Back to Dashboard" link functional
   - Status card shows:
     * Submitted to (council + department)
     * Submitted date
     * Reviewed date (if applicable)
     * Reviewed by (officer email, if applicable)

3. **Check Application Details Sections**
   - **Premises Information**: Name, address, postcode
   - **Applicant Information**: Name, email, address
   - **Licensable Activities**: Full description text
   - **Important Dates**: Representation deadline, expiry date
   - **Additional Information**: Notes field

**Expected Outcome:**
- ✅ All submission data displayed
- ✅ Sections properly labeled
- ✅ Formatting clean and readable
- ✅ Back navigation works

---

### **Test 5: Changes Requested Flow**

**Prerequisites:**
- Council has reviewed submission and requested changes
- Submission status = 'changes_requested'
- Submission has `notes` field populated with feedback

1. **View Submission with Changes Requested**

2. **Verify Alert Box**
   - Should display orange alert at top
   - Should show "⚠️ Action Required - Changes Requested"
   - Should display council's feedback text
   - Should have "Resubmit Application" button

3. **Click Resubmit Button**
   - Should redirect to `/apply?resubmit={submissionId}`
   - (This will be implemented in next phase)

**Expected Outcome:**
- ✅ Alert displays feedback clearly
- ✅ Resubmit button visible and functional
- ✅ Feedback text preserves formatting (whitespace-pre-wrap)

---

### **Test 6: Approved Submission**

**Prerequisites:**
- Council has approved submission
- Submission status = 'approved'

1. **View Approved Submission**

2. **Verify Green Alert**
   - Should show "✅ Application Approved" heading
   - Should display approval message
   - Should show council name
   - If council added notes, should display them

**Expected Outcome:**
- ✅ Green alert displayed
- ✅ Approval message clear
- ✅ Optional notes visible

---

### **Test 7: Rejected Submission**

**Prerequisites:**
- Council has rejected submission
- Submission status = 'rejected'
- Submission has rejection reason in `notes`

1. **View Rejected Submission**

2. **Verify Red Alert**
   - Should show "❌ Application Rejected" heading
   - Should display rejection reason

**Expected Outcome:**
- ✅ Red alert displayed
- ✅ Rejection reason clear
- ✅ No resubmit option (rejection is final)

---

### **Test 8: Published Notice Link**

**Prerequisites:**
- Submission has been published (status = 'published')
- Corresponding `notice` record exists in database

1. **View Published Submission**

2. **Verify Purple Alert**
   - Should show "📢 Published" heading
   - Should display publication message
   - Should have "View Public Notice" button

3. **Click View Public Notice**
   - Should navigate to `/public/notices` (browse page)
   - User can then find their published notice

**Expected Outcome:**
- ✅ Purple alert displayed
- ✅ Link to public notices functional

---

### **Test 9: Sign Out**

1. **From Dashboard, click "Sign Out"**

2. **Verify Redirect**
   - Should redirect to `/applicant/sign-in`
   - Session should be cleared
   - If navigate to `/applicant/dashboard` manually, should redirect to sign-in

**Expected Outcome:**
- ✅ Sign out successful
- ✅ Session cleared
- ✅ Protected routes redirect to sign-in

---

### **Test 10: Direct URL Access (Protected Routes)**

1. **Open browser in incognito/private mode**

2. **Navigate directly to**
   ```
   http://localhost:5173/applicant/dashboard
   ```

3. **Verify Redirect**
   - Should redirect to `/applicant/sign-in` (not authenticated)

4. **Sign in with magic link**

5. **After sign-in, try accessing another user's submission**
   ```
   http://localhost:5173/applicant/submissions/{other-user-submission-id}
   ```

**Expected Outcome:**
- ✅ Protected routes redirect when not authenticated
- ✅ Can only view submissions for own email address
- ✅ "Submission Not Found" error for others' submissions

---

## 🔐 Security Checks

### Email Verification
- ✅ Only submissions matching `applicant_email` are visible
- ✅ Cannot access other users' submissions by guessing IDs
- ✅ Magic link expires after 1 hour
- ✅ Session persists across page refreshes (until sign out)

### Database Queries
```sql
-- ApplicantDashboard.tsx:60
SELECT * FROM submissions
WHERE applicant_email = session.user.email;

-- ApplicantSubmissionDetail.tsx:54-56
SELECT * FROM submissions
WHERE id = :submissionId
  AND applicant_email = session.user.email;
```

---

## 🐛 Known Limitations (To Address in Next Phases)

1. **No Resubmission Flow Yet**
   - "Resubmit Application" button links to `/apply?resubmit={id}`
   - This will be implemented when making PublishPage context-aware

2. **No Email Notifications**
   - Users must manually check dashboard for updates
   - Email notifications planned for Phase 13

3. **No Payment Integration**
   - Application submission is free
   - Payment planned for Phase 13

4. **Cannot Create New Applications Yet**
   - "New Application" button links to `/apply`
   - This will work once PublishPage is context-aware (next task)

---

## 📊 Database Schema Dependencies

### Tables Used:
- `auth.users` - Supabase authentication
- `submissions` - Application data
- `departments` - Council department info (via foreign key)
- `organizations` - Council/firm info (via nested join)
- `profiles` - Reviewer info (via `reviewed_by_id`)

### Required Fields:
- `submissions.applicant_email` (indexed for performance)
- `submissions.status` (new, in_review, approved, rejected, changes_requested, published)
- `submissions.notes` (feedback from council)
- `submissions.reviewed_at` (timestamp)
- `submissions.reviewed_by_id` (references profiles)

---

## 🚀 Performance Notes

- **Dashboard Query**: Loads all submissions for email with nested joins (council + dept)
- **Detail Query**: Single submission by ID + email with nested joins
- **Auth Check**: Every page checks session on mount (redirects if missing)

**Optimization Recommendations:**
- Add index on `submissions.applicant_email` for faster lookups
- Consider pagination if user has >50 submissions
- Cache submission data in React state to avoid re-fetching

---

## 🎯 Next Steps (Phase 12 Remaining Tasks)

1. **Make PublishPage Context-Aware**
   - Detect if user is applicant vs council
   - Show "Select Council" dropdown for applicants
   - Submit creates `submission` record (not direct publish)

2. **Add Council Selector**
   - Load all councils with licensing departments
   - Filter by notice type (only show relevant councils)
   - Auto-populate `receiving_department_id`

3. **Integrate Hybrid Workflow**
   - Connect `/apply` route to context-aware PublishPage
   - Handle resubmission flow (`?resubmit=id`)
   - Update submission instead of creating new one

---

## 📝 Testing Checklist

- [ ] Magic link email sent successfully
- [ ] Magic link redirects to dashboard
- [ ] Empty state displays for new users
- [ ] Submissions list displays correctly
- [ ] Status badges color-coded properly
- [ ] Detail page shows all fields
- [ ] Changes requested alert visible
- [ ] Approved alert visible
- [ ] Rejected alert visible
- [ ] Published alert and link visible
- [ ] Sign out clears session
- [ ] Protected routes redirect when not authenticated
- [ ] Cannot access other users' submissions
- [ ] Back navigation works correctly
- [ ] Dates formatted properly (UK format)
- [ ] Council/department names displayed

---

**Phase 12.1 (Passwordless Authentication): COMPLETE ✅**

**Next: Phase 12.2 - Context-Aware PublishPage**
