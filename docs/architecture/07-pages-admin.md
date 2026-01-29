# Admin Portal Pages
## Platform Administration Interface

[← Back to Index](./00-INDEX.md) | [Previous: Firm Pages](./06-pages-firm.md) | [Next: Design System →](./08-design-system.md)

---

## Overview

**Access**: Site Administrator role only
**URL Structure**: `/admin/[page]`
**Navigation**: Dashboard, Organizations, Departments, Users, Moderation, Audit, Settings

---

## 7.1 Admin Dashboard (`/admin/dashboard`)

### Stats Row (5 cards)

1. **Total Organizations**: Count (X councils, Y firms)
2. **Pending Approvals**: Count, alert badge if >0
3. **Total Departments**: Count across councils, average per council
4. **Active Notices**: Total published platform-wide, this month's count
5. **Total Users**: Unique users, new this month

---

### Pending Approvals Queue (if any)

- Heading: "Organizations Awaiting Approval"
- Table: Org Name, Type, Registration Number, Submitted, Actions ("Review" button)

**Approval Modal**:
- Organization details, registration verification
- Approve/Reject buttons
- Reject reason textarea
- On approve: status='active', activation email sent
- On reject: status='rejected', rejection email with reason

---

### Recent Platform Activity
- Timeline: Org created/approved/rejected, Department created, Notice published, User joined
- Max 20 entries, pagination

---

## 7.2 Organizations (`/admin/organizations`)

### Filters
- Type: All, Councils, Firms
- Status: All, Pending, Active, Suspended
- Search: Org name or domain

---

### Table Columns
1. Organization (logo, name, domain)
2. Type (Council/Firm badge)
3. Status (badge)
4. Departments (count, councils only)
5. Users (member count)
6. Notices (count)
7. Created (date)
8. Actions (dropdown)

**Row Actions**: View Details, View Departments (councils), Suspend/Activate, Delete

---

### Organization Detail Page (`/admin/organizations/:id`)

- Full org info
- Department list (if council)
- Member list
- Recent notices
- Audit log
- Admin actions: Suspend, Delete

---

## 7.3 Departments (`/admin/departments`)

### Filters
- Council (multi-select)
- Type: Licensing, Planning, etc.
- Status: Active, Archived
- Search: Department name

---

### Table Columns
1. Department (name + icon)
2. Council (parent org)
3. Type (badge)
4. Status (Active/Archived)
5. Members (count)
6. Notices (count)
7. Created (date)
8. Actions (dropdown)

**Row Actions**: View Details, View Dashboard (impersonate dept admin), View Audit Log, Archive/Restore

---

## 7.4 Users (`/admin/users`)

### Filters
- Has Memberships: All, With Memberships, No Memberships
- Organization (multi-select)
- Last Active (date range)

---

### Table Columns
1. User (avatar, name, email)
2. Organizations (count + tooltip list)
3. Departments (count + tooltip list)
4. Last Active (date)
5. Created (date)
6. Actions (dropdown)

**Row Actions**: View Details, Impersonate User (view as them), Suspend User, Delete User

---

### User Detail Page
- Personal info
- Membership list (orgs + depts with roles)
- Activity timeline
- Notices created
- Admin actions

---

## 7.5 Content Moderation (`/admin/moderation`)

### Flagged Notices Queue
- Table: Notice Title, Organization, Dept, Reason, Flagged Date, Actions
- Actions: Review, Approve, Remove

**Review Modal**:
- Full notice content
- Flagging reason
- History of flags
- Actions: Mark as Reviewed (keeps published), Unpublish (with reason, notifies org), Delete (extreme, permanent)

---

### All Published Notices
- Searchable table of all public notices
- Filters: org, dept, type, date
- Quick unpublish action

---

## 7.6 Global Audit Log (`/admin/audit`)

### Filters
- Organization (multi-select)
- Department (multi-select after org selected)
- User (search)
- Action Type (all actions including org/dept creation)
- Date Range (custom picker)

---

### Table
- Additional column: Organization/Department context
- All other columns same as dept audit
- Expandable rows with full details

**Export**: CSV of all filtered entries

---

## 7.7 Platform Settings (`/admin/settings`)

### Tab 1: General Settings
- Platform name
- Support email
- Default timezone
- Maintenance mode toggle

### Tab 2: Organization Approval
- Auto-approve councils (toggle)
- Auto-approve firms (toggle)
- Manual approval required if disabled

### Tab 3: Notice Types
- Manage global notice types
- Add/edit/disable types
- Configure templates for each

### Tab 4: Email Templates
- Customize: Invitations, Approvals, Notifications, Password resets

### Tab 5: Storage & Limits
- Max file upload size
- Storage quotas per org
- API rate limits

---

[← Back to Index](./00-INDEX.md) | [Previous: Firm Pages](./06-pages-firm.md) | [Next: Design System →](./08-design-system.md)
