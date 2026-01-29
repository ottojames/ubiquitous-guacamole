# Firm Portal Pages
## Complete Firm Portal Specifications

[← Back to Index](./00-INDEX.md) | [Previous: Council Pages](./05-pages-council.md) | [Next: Admin Pages →](./07-pages-admin.md)

---

## Overview

Firm portal for law firms and solicitors to submit notices to council departments, manage clients, and track submissions.

**URL Structure**: `/f/:org/[page]`
**Base Layout**: Similar to council but single-tier (no departments)
**Navigation**: Dashboard, Submissions, Clients, Team, Settings, Help

---

## 6.1 Firm Dashboard (`/f/:org/dashboard`)

### Stats Row (4 cards)

1. **Active Submissions**: Count with status "New" or "Under Review", trend
2. **Accepted This Month**: Count accepted this month, success rate percentage
3. **Total Clients**: Count of active clients, "Manage clients →"
4. **Pending Actions**: Count with "Changes Requested" status, needs attention badge

---

### Main Content (2/3 + 1/3)

**Recent Submissions** (2/3):
- Table: Notice Title, Council/Dept, Status, Submitted Date, Actions
- Status badges: New (blue), Under Review (amber), Changes Requested (orange alert), Accepted (green), Rejected (red)
- Click row → submission detail

**Quick Actions** (1/3):
1. Submit New Notice (primary blue, Plus)
2. Add Client (outline, UserPlus)
3. View All Submissions (outline, List)

---

### Additional Sections

**Submission Status Chart**: Donut chart (Accepted/Under Review/Changes Requested/Rejected/New), last 90 days

**Notifications Panel**: Timeline of council actions on submissions

---

## 6.2 Submissions List (`/f/:org/submissions`)

### Filter Bar
- Status tabs: All, New, Under Review, Changes Requested, Accepted, Rejected
- Filters: Council/Department, Client, Date Range, Notice Type

---

### Table Columns
1. Notice Title (with type badge)
2. Client (name)
3. Submitted To (council + dept stacked)
4. Status (badge)
5. Submitted (date)
6. Last Updated (date)
7. Actions (dropdown)

**Row Actions**: View Details, View Council Response, Edit & Resubmit (if changes requested), Withdraw, Duplicate

**Status-Specific Indicators**:
- Changes Requested: Amber alert icon, "Needs attention"
- Accepted: "View Published Notice" link (external to public page)
- Rejected: "View Reason" link

---

## 6.3 New Submission (`/f/:org/submissions/new`)

### 3-Step Wizard

**Step 1: Council & Client**

**Select Council Department**:
- Search input with dropdown suggestions
- After council selected: radio buttons for departments
- Or: "Have a department submission link?" → paste `/submit/[dept-slug]`

**Select Client**:
- Dropdown of active clients
- "Add New Client" option (opens modal: name, contact person, email, phone, address)

---

**Step 2: Notice Details**

Same as council editor Step 2:
- Premises, Applicant, Licensing Details, Legal Information
- "Use client information for applicant" toggle (pre-fills from client)
- Attachment upload
- **Firm Message to Council** (textarea, optional, max 500 chars)

---

**Step 3: Review & Submit**

Review sections:
- Submission Target (council, dept, client)
- Notice Details
- Attachments
- Firm Message
- Generated notice preview

**Checkbox**: "Notify me when council reviews"

**Submit Button**: "Submit to Council" (primary blue, Send icon)

**Data Flow**:
1. Creates `submissions` record (firm org, target dept, client, notice data, status='new')
2. Uploads attachments to firm storage (temporary)
3. Sends notification email to council dept admins
4. Confirmation email to firm user
5. Success modal with reference number (SUB-123456)
6. Redirect to submission detail

---

## 6.4 Submission Detail (`/f/:org/submissions/:id`)

### Status Banners (conditional)

**Changes Requested**: Amber, "Council has requested changes", "View Requested Changes" button

**Rejected**: Red, "Submission rejected", "View Rejection Reason" button

**Accepted**: Green, "Accepted and published!", "View Published Notice" button

---

### Tabs

1. **Submission Details**: Read-only view of all data (council, client, notice details, attachments, firm message)
2. **Council Communication**: Timeline (submitted, claimed, changes requested, resubmitted, accepted/rejected)
3. **Edit & Resubmit** (if changes requested): Editable form, council's request at top, resubmit button

---

### Actions Panel (sidebar)

**Submission Info**: Reference, dates, submitted by

**Council Contact**: Name, dept, email (clickable), phone

**Client Info**: Name, contact, "View client details" link

**Actions**:
- View Council Response
- Edit & Resubmit (if changes requested)
- Withdraw Submission (confirmation modal with reason)
- Duplicate Submission
- Download PDF
- Print

---

### Modals

**Council Response**: Shows requested changes message, issue checkboxes, next steps

**Rejection Reason**: Full reason text, category, next steps (create new submission, contact council)

---

## 6.5 Client Management (`/f/:org/clients`)

### List/Grid Views

**List View** (table):
- Columns: Client (name + contact person), Contact Email, Phone, Submissions (count + link), Last Submission, Actions

**Grid View** (3 columns):
- Card: Icon, client name, contact person, contact info, submission count, last submission date
- Buttons: "Submit Notice" (primary), "View Details" (outline)

**Row Actions**: View Details, Edit, Submit Notice for Client, Archive

---

### Add/Edit Client Modal

Fields: Client name, Contact person name, Contact email, Contact phone, Address (optional), Notes (textarea max 500)

---

### Client Detail Page (`/f/:org/clients/:id`)

- Client information card (all details, "Edit" button)
- Submissions for this client (table, same as main list)
- Activity timeline (recent submissions/updates, max 10)

---

## 6.6 Firm Team (`/f/:org/team`)

### Active Members Table

Columns: Member (avatar, name, email), Role (Owner/Admin/User), Joined, Last Active, Submissions (count), Actions (Change Role, View Activity, Remove)

**Roles**:
- **Owner**: Full control, billing, delete account
- **Admin**: Manage team/clients, submit notices
- **User**: Submit notices, view own submissions

**Change Role Modal**: Radio buttons (Owner, Admin, User) with descriptions

**Remove Confirmation**: Warning about submissions remaining unowned, cannot remove last owner

---

### Pending Invitations
- Table with resend/cancel actions

### Invite Member Modal
- Email, Role (Admin or User, cannot invite as Owner), Personal message (optional)

---

## 6.7 Firm Settings (`/f/:org/settings`)

### Tab 1: Firm Information

**Basic Info**: Name, Email domain, Registration number, Contact email/phone, Address, Website

**Logo**: Preview, upload button (2MB, PNG/JPG/SVG)

---

### Tab 2: Notifications

**Email Notifications**: Master toggle

**Preferences**:
- Submission accepted
- Submission rejected
- Council requested changes
- New team member joined
- Weekly submission summary

**Frequency**: Immediately, Daily, Weekly

---

### Tab 3: Danger Zone (Owner Only)

**Archive Firm**: Description, requirements (all submissions closed), amber button

**Delete Firm** (Owner Only):
- Permanent deletion
- Requirements: Archived 30+ days, all members removed except owner, zero active submissions
- Red button, email code confirmation

---

[← Back to Index](./00-INDEX.md) | [Previous: Council Pages](./05-pages-council.md) | [Next: Admin Pages →](./07-pages-admin.md)
