# Council Portal Pages
## Complete Council Portal Specifications

[← Back to Index](./00-INDEX.md) | [Previous: Auth Pages](./04-pages-auth.md) | [Next: Firm Pages →](./06-pages-firm.md)

---

## Overview

This document specifies all council portal pages with complete detail including base layout, navigation, and all individual pages.

**URL Structure**: `/c/:org/:dept/[page]`

**Access**: Users with department or organization memberships only

---

## Base Layout (All Council Pages)

### Top Navigation Bar (Sticky)

**Structure**:
- Height: 64px
- Background: `bg-white border-b border-gray-200 shadow-sm`

**Left Section**:
- Organization logo (32px)
- Organization name: `text-lg font-semibold text-gray-900`

**Center Section - Department Context Dropdown**:
- Shows active department name with blue badge
- Click → dropdown listing all accessible departments
- Each item: dept name, role badge, checkmark if current
- "All Departments" option at top (if org admin)
- Divider + "Switch workspace" link

**Right Section**:
- Notifications bell (with badge count)
- User menu dropdown (avatar, name, email, profile, switch workspace, sign out)

---

### Sidebar Navigation (Fixed Left)

**Structure**:
- Width: 256px
- Background: `bg-slate-50`
- Padding: `p-6`

**Navigation Links**:
- Dashboard (Home icon)
- Notices (FileText icon + badge for drafts)
- Templates (File icon)
- Team (Users icon)
- Settings (Settings icon)
- Audit Log (Clock icon)
- Help (HelpCircle icon)

**Link Styling**:
- Default: `text-gray-700 px-4 py-3 rounded-xl flex items-center gap-3`
- Hover: `bg-white shadow-sm`
- Active: `bg-blue-50 text-blue-700 font-semibold`

**Sidebar Footer**:
- Current plan badge
- Storage usage indicator
- Upgrade button

---

### Main Content Area

- Left margin: 256px
- Top margin: 64px
- Background: `bg-slate-50`
- Padding: `p-8`
- Max container: `max-w-7xl mx-auto`

**Breadcrumb**: `[Org Name] / [Dept Name] / [Page]`

---

## 5.1 Department Dashboard (`/c/:org/:dept/dashboard`)

### Stats Cards Row (4 cards, equal width)

**Card Styling** (all cards):
- `bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6`
- Hover: `hover:shadow-lg transition-shadow`

**Card 1: Active Notices**:
- Icon: FileText (blue-500)
- Count of published notices
- Label: "Active Notices"
- Trend: "+X from last month" (green/red)

**Card 2: Drafts**:
- Icon: Edit (amber-500)
- Count of draft notices
- Subtext: "Y need approval" (if enabled)

**Card 3: Published This Month**:
- Icon: CheckCircle (green-500)
- Count this month
- Trend vs last month

**Card 4: Pending Reviews**:
- Icon: Clock (purple-500)
- Representation count
- Clickable → representations page

---

### Main Content Grid (2/3 + 1/3)

**Recent Activity Feed** (2/3 width):
- Section header: "Recent Activity" + "View All →"
- White card, rounded-3xl
- Timeline format:
  - User avatar (40px)
  - Action: "[User] published [Notice]"
  - Timestamp: "2 hours ago"
  - Color-coded dots (blue/green/amber/red by action)
- Max 10 entries, scrollable

**Quick Actions Panel** (1/3 width):
- White card
- Stacked buttons:
  1. Create New Notice (primary blue, Plus icon)
  2. Import from Template (outline, Copy icon)
  3. View Public Notices (outline, Eye icon)
  4. Invite Team Member (outline, UserPlus icon - admin only)

---

### Upcoming Deadlines Section (full width)

- Section header: "Upcoming Deadlines"
- Table: Notice Title | Type | Deadline | Days Remaining | Status
- Color-coded urgency: Red <3 days, Amber 3-7, Green >7
- Max 5 rows, "View All →" link
- Click row → notice detail

**Data**: All filtered by `department_id`, real-time subscriptions

---

## 5.2 Notices List (`/c/:org/:dept/notices`)

### Page Header
- Title: "Notices"
- Right: "Create Notice" button (primary blue)

---

### Filter Sidebar (280px, sticky)

**Filters**:
1. **Status**: Checkboxes (All, Published, Draft, Expired, Archived) with counts
2. **Date Range**: Quick selects (7/30/90 days, Custom)
3. **Notice Type**: Multi-select dropdown
4. **Created By**: Multi-select with avatars
5. **Search**: Text input for title/premises/applicant

**Apply Filters Button** (sticky bottom):
- Primary blue, full width
- Shows count: "Show X notices"

---

### View Controls Bar

**Left**: Results count
**Right**:
- View toggle: List/Grid (icons, active highlighted)
- Sort dropdown: Most Recent, Oldest, Title A-Z, Status

---

### List View (default)

**Table Columns**:
1. Checkbox (bulk select)
2. Title (with type badge below)
3. Status (color-coded pill)
4. Created By (avatar + name)
5. Created Date
6. Actions (dropdown: View, Edit, Duplicate, Export PDF, Unpublish, Delete)

**Bulk Actions Bar** (appears when selected):
- Sticky bottom, `bg-blue-600 text-white`
- Shows "X selected"
- Actions: Publish Selected, Export, Archive, Delete
- Cancel button

---

### Grid View

**Grid**: 3 columns, `gap-6`

**Notice Card**:
- White, rounded-2xl, p-6
- Shadow with hover lift
- Header: Type badge + status badge
- Title: text-lg font-semibold (2-line truncate)
- Premises: MapPin icon + address (truncated)
- Meta: Creator avatar + date
- Footer: "View Details" button

**Pagination** (bottom):
- "1-25 of 156 results"
- Page buttons, Previous/Next
- Items per page: 25/50/100

**Empty States**: "No notices yet" / "No filtered results"

---

## 5.3 New Notice Editor (`/c/:org/:dept/notices/new`)

### Progress Stepper (sticky top)
- 4 steps: Type → Details → Attachments → Review
- Completed: Green checkmark
- Current: Blue circle (pulsing)
- Future: Gray circle

---

### Step 1: Select Notice Type

**Heading**: "What type of notice are you creating?"

**Grid**: 2-3 columns of type cards
- White, border-2, rounded-2xl, p-6
- Selected: `border-blue-500 bg-blue-50`
- Icon, title, description, "Most used" badge
- Filtered by dept's `allowed_notice_types`

**Continue Button**: Disabled until selected

---

### Step 2: Notice Details

**Sections** (collapsible cards):

**1. Premises Information**:
- Premises name (required)
- Address autocomplete (street, city, county, postcode)
- "Find address" button (uses postcode lookup)
- Map preview (400px, draggable pin, postcodes.io geocoding)

**2. Applicant Information**:
- Name, address, email, phone, type
- "Same as premises" checkbox

**3. Licensing Details**:
- Licensable activities (checklist + custom)
- Operating hours (day-by-day time picker or "Same hours every day")
- DPS (name, licence number, issuing authority)
- Conditions (textarea, max 2000 chars)

**4. Legal Information**:
- Licensing authority (auto-filled from dept)
- Representation deadline (auto-calculated: today + default days, editable)
- Hearing date (optional)
- Publication date (defaults tomorrow)
- Newspaper (dropdown, dept default pre-selected)

**Auto-Save Indicator** (bottom-right, fixed):
- Pills: "Saving..." (blue), "Saved" (green), "Error" (red)
- Saves every 30 seconds to sessionStorage

**Action Buttons** (sticky bottom):
- Left: "Save Draft" (outline)
- Right: "Back" + "Continue" (primary)

---

### Step 3: Attachments

**Drag-Drop Zone**:
- Large dashed border
- Upload cloud icon
- Text: "Drag and drop files here, or click to browse"
- Formats: PDF, DOC, DOCX, JPG, PNG (max 10MB)

**Uploaded Files List**:
- Cards with thumbnail, filename, size, remove button
- Reorderable (drag handles)
- Progress bars during upload

**OCR Processing** (for PDFs):
- "Extract text" button
- Shows extracted text modal
- "Auto-fill from extracted text" parses fields

**Action Buttons**: Same as Step 2

---

### Step 4: Review & Publish

**Review Sections** (accordion):
- Notice Type & Status
- Premises Information + minimap
- Applicant Information
- Licensing Details
- Legal Information
- Attachments (thumbnails)
- Each with "Edit" button (jumps to relevant step)

**Generated Notice Preview**:
- Section: "Public Notice Preview"
- Styled box (newspaper format, serif font, centered heading)
- Full formal notice text with tokens replaced
- "Copy text" button

**Publication Options**:
- Radio: (1) Save as Draft, (2) Publish Immediately, (3) Submit for Approval (if required)

**Action Buttons**:
- Left: "Back"
- Right: "Save Draft" / "Publish Notice" / "Submit for Approval" (green/amber)

**Data Flow**:
- Creates `notices` record
- Uploads attachments to storage
- Geocodes address
- Generates formal description
- Sets status/published_at/expires_at
- Sends notifications
- Redirects with success toast

---

## 5.4 Edit Notice (`/c/:org/:dept/notices/:id/edit`)

**Same as New Notice** except:

**Warning Banner** (if published):
- Amber, AlertTriangle icon
- "This notice is currently published. Changes visible immediately."
- Checkbox: "I understand changes will affect public notice"

**Additional Actions** (Step 4):
- Unpublish button (red, opens confirmation modal with reason)
- Delete button (red, type title to confirm)

**Metadata Display**:
- Created by, Last modified by, View count

**Permissions**: Editors edit own drafts, Admins edit any

---

## 5.5 Templates Manager (`/c/:org/:dept/templates`)

### Page Header
- Title: "Templates"
- Subtitle: "Reusable notice templates for faster creation"
- Right: "Create Template" button

---

### Templates Grid (3 columns)

**Template Card**:
- White, rounded-2xl, p-6, shadow with hover
- Icon (large, matching notice type)
- Template name (text-xl font-semibold)
- Notice type badge
- Pre-filled fields indicator:
  - "Pre-fills 7 fields:"
  - Checkmarks: Operating hours, Activities, Authority, +4 more
- Usage stats: "Used 24 times"
- Created by (avatar + name, date)
- "Use Template" button (primary, full width)
- Actions menu (edit, duplicate, delete)

---

### Create/Edit Template Modal

**Modal Content**:

**Section 1: Template Info**:
- Template name (required)
- Notice type (dropdown of allowed types)

**Section 2: Default Field Values**:
- Dynamic form based on selected type
- Each field:
  - Checkbox: "Include in template"
  - Input: Default value (enabled if checked)
- Common fields: Activities, Operating hours, Authority, Representation period, Newspaper, Conditions

**Footer**:
- Cancel + "Save Template" button

**Use Template Flow**:
1. Click "Use Template"
2. Redirect to `/c/:org/:dept/notices/new?template=:id`
3. Type pre-selected, fields pre-filled
4. User modifies as needed
5. Saves as normal notice (increments template.use_count)

**Empty State**: "No templates yet" with create button

---

## 5.6 Team Management (`/c/:org/:dept/team`)

### Page Header
- Title: "Team"
- Subtitle: "Manage members of [Department Name]"
- Right: "Invite Member" button (admin only)

---

### Active Members Table

**Columns**:
1. Member (avatar 48px, name, email)
2. Role (color-coded badge: Admin blue, Editor green, Viewer gray)
3. Joined (date)
4. Last Active (relative time)
5. Actions (dropdown: Change Role, View Activity, Remove)

**Change Role Modal**:
- Title: "Change [User]'s Role"
- Radio buttons: Dept Admin, Editor, Viewer (with descriptions)
- Warning if downgrading
- Save button

**Remove Confirmation**:
- Warning about data access loss
- If user has drafts: notice
- If last admin: error
- "Remove" button (red)

---

### Pending Invitations Section

- Table: Email, Role, Invited By, Sent, Expires In, Actions (Resend, Cancel)
- Resend: new email, reset expiry
- Cancel: marks cancelled

---

### Invite Member Modal

**Fields**:
1. Email (required)
2. Role (radio: Admin, Editor (default), Viewer with descriptions)
3. Personal message (optional textarea, max 500 chars)

**Invitation Preview**: Collapsible email preview

**Data Flow**:
- Creates `invitations` record with `department_id`, role, token
- Sends email: `/onboarding/accept-invite?token=xxx`
- 7-day expiry
- Success toast, adds to pending list

**Org-Wide Invitations** (if Org Admin/Owner):
- Toggle: "Invite as Organization Admin"
- Creates org-level invitation

---

## 5.7 Settings (`/c/:org/:dept/settings`)

### Tabbed Interface

**Tabs**:
1. Department Settings (default)
2. Organization Settings (Org Admin/Owner only)
3. Notifications
4. Danger Zone (Admin+ only)

---

### Tab 1: Department Settings

**Section 1: Department Information**:
- Fields: Dept name, Email, Type (dropdown), Description (textarea max 500)

**Section 2: Notice Defaults**:
- Default representation period (number, 14-90 days)
- Default newspaper (dropdown + custom)
- Require approval toggle (description explains Editor submission flow)

**Section 3: Allowed Notice Types**:
- Grid of checkboxes with type cards
- Checked types available to dept members
- Select All / Clear All links

**Section 4: Department Status**:
- Badge showing Active/Archived
- Link to Danger Zone for archiving

**Save Button** (sticky bottom bar):
- Appears when changes detected
- "Save Changes" (primary blue right) + "Discard Changes" link (left)

---

### Tab 2: Organization Settings (Org Admin/Owner Only)

**Section 1: Organization Information**:
- Fields: Org name, Email domain, Contact email/phone, Registration number, Website
- Logo upload: current preview, "Change Logo" button, max 2MB PNG/JPG/SVG, 400x400px recommended

**Section 2: Departments**:
- Heading: "Manage Departments"
- Table: Name, Type, Status, Members, Active Notices, Actions (View Dashboard, Edit, Archive/Restore)
- "Create New Department" button (above table, opens modal)

**Create Department Modal**:
- Same as onboarding step 3
- Auto-adds creator as Dept Admin

**Archive Confirmation**:
- Modal warnings: member access loss, notices read-only, can restore
- "Archive Department" button (amber)

**Section 3: Organization-Wide Settings**:
- Timezone (dropdown)
- Data retention (1/2/5/10 years, indefinite)
- Public portal branding toggle (color picker if enabled)

---

### Tab 3: Notifications

**Master Toggle**: "Enable email notifications" (disables all if off)

**Notification Preferences**:

**Department Notifications**:
- ☑ New notice published
- ☑ Notice submitted for approval
- ☑ New team member joined
- ☑ Notice approaching deadline
- ☐ Weekly digest

**Organization Notifications** (if Org Admin):
- ☑ New department created
- ☑ New user joined
- ☐ Monthly summary

**Frequency**: Dropdown (Immediately, Daily Digest, Weekly Digest)

**Send Test Email Button**: Outline

---

### Tab 4: Danger Zone (Admin+ Only)

**Warning Container**: `border-red-500 bg-red-50` with AlertTriangle icon

**Section 1: Archive Department** (Dept Admin):
- Description: "Archiving prevents new notices but preserves data. Members lose access."
- Requirements checklist:
  - ☑ No pending approvals
  - ☑ All published notices past deadline
  - ☐ At least one admin in another dept
- Archive button (red outline, disabled if requirements unmet)
- Confirmation modal: type dept name, reason textarea

**Section 2: Delete Department** (Org Admin/Owner):
- Warning: "PERMANENT deletion. All data lost. Cannot be undone."
- Requirements:
  - Archived 30+ days
  - Zero published notices
  - All members removed
- Delete button (red solid)
- Confirmation: type "DELETE [DEPT NAME]", email code verification

**Section 3: Delete Organization** (Owner Only):
- Warning: "EXTREME action. Deletes all departments, notices, users."
- Requirements:
  - All depts archived/deleted
  - Zero active subscriptions
  - Owner account 90+ days old
- Similar confirmation flow

---

## 5.8 Audit Log (`/c/:org/:dept/audit`)

### Page Header
- Title: "Audit Log"
- Subtitle: "Complete activity history for [Department/Organization Name]"
- Right: "Export CSV" button

**View Toggle** (if Org Admin/Owner):
- Buttons: "This Department" | "Organization-Wide"

---

### Filter Sidebar (280px)

**Filters**:
1. **Action Types**: Checkboxes (Notice Created/Published/Edited/Deleted, Template, User, Settings, Dept actions)
2. **Performed By**: Multi-select with avatars
3. **Date Range**: Quick selects + custom picker
4. **Resource Type**: Radio (All, Notices, Templates, Users, Settings)

**Apply Filters**: Primary blue, sticky bottom

---

### Audit Table

**Columns**:
1. Timestamp ("18 Nov 2025, 14:32:15", gray-700)
2. User (avatar, name, role badge)
3. Action (bold verb, color-coded: create green, edit blue, delete red)
4. Resource (type + name, clickable link)
5. Details (truncated description)
6. Actions ("View Details" link)

**Row Interaction**:
- Hover: bg-slate-50
- Click "View Details" → row expands

**Expanded Row**:
- Background: blue-50, px-6 py-4
- Full change description
- IP address, User agent (truncated tooltip)
- Changes (if applicable): Before/After columns with JSON, diff highlighting (green/red/amber)
- Related actions: links to related entries
- "Export This Entry" button

**Pagination**: 1-50 of 1,247 entries, page buttons, items per page (25/50/100/250)

**Empty State**: "No audit entries found" with clear filters

**Export CSV**:
- Filename: `audit-log-[dept-name]-[date].csv`
- Columns: Timestamp, User, Email, Role, Action, Resource Type, Resource Name, Details, IP

**Data**: Queries `audit_logs` filtered by `department_id` or `organization_id`

---

## 5.9 Organization Overview (`/c/:org/all-departments/dashboard`)

**Access**: Org Admin/Owner only

### Page Header
- Title: "[Organization] — All Departments"
- Purple "All Departments" badge
- Right: Date range selector

---

### Top-Level Stats (4 cards)

1. **Total Active Notices**: Sum across all depts, trend, "Across X departments"
2. **Departments**: Total count, "X active, Y archived"
3. **Team Members**: Unique users, "X admins, Y editors, Z viewers"
4. **This Month's Activity**: Published count, trend percentage

**Card Styling**: Same as dept dashboard

---

### Department Performance Grid (2/3 width)

**Section**: "Department Overview" + "View All Departments →"

**Table**:
- Columns: Dept (icon, name, type badge), Active Notices (count + sparkline), Team Size, Last Activity, Status, Actions ("View Dashboard")
- Sorted by: Last Activity (most recent first)
- Hover row: bg-slate-50, entire row clickable
- Pagination if >10 depts

**Row Click**: Navigates to dept dashboard, switches context

---

### Recent Cross-Department Activity (1/3 sidebar)

**Section**: "Recent Activity" + "View All →"

**Timeline**:
- User avatar, action with **dept name** in bold
- Example: "[User] published notice in **Licensing**"
- Resource link, timestamp
- Color-coded dots
- Max 10 entries

---

### Quick Actions Panel

**Section**: "Organization Actions"

**Buttons** (stacked):
1. Create New Department (primary blue, Plus)
2. Invite Organization Admin (outline, UserPlus)
3. View Organization Settings (outline, Settings)
4. Download Organization Report (outline, Download - generates PDF/CSV)

---

### Department Health Indicators (full width)

**Section**: "Department Health"

**Grid** (4 columns):

1. **Notices Pending Review**: Lists depts with approvals needed, clickable
2. **Upcoming Deadlines**: Next 5 deadlines across depts, color-coded urgency
3. **Inactive Departments**: Depts with no activity 30+ days, warning indicator
4. **Pending Invitations**: Count across all depts, "Manage invitations →"

**Card Styling**: White, rounded-xl, left border colored by health (green/amber/red), p-6, hover shadow

**Data**: Aggregates from all depts where user is Org Admin/Owner

**Breadcrumb**: "[Org] / All Departments / Dashboard"

---

## 5.10 Submissions Inbox (`/c/:org/:dept/submissions-inbox`)

**Purpose**: Receive notice submissions from law firms

**Access**: Dept Admin/Editors (full), Viewers (read-only)

### Page Header
- Title: "Submissions Inbox"
- Subtitle: "Notice submissions from law firms for [Department]"
- Right: "Archive All Read" + "Filter" toggle

---

### Stats Row (3 compact cards)

1. **New Submissions**: Unread count, blue
2. **Under Review**: Claimed/in-progress count, amber
3. **Processed This Month**: Accepted/rejected count, green

---

### Filter Bar (toggleable)

**Status Tabs**: All, New (badge), Under Review, Accepted, Rejected, Archived

**Filters**: Firm (multi-select), Date range, Notice type

---

### Submissions List

**List Item Card** (full width, stacked):
- White, rounded-lg, border, px-6 py-4, mb-4
- **Unread**: Blue left bar (4px), bg-blue-50 tint

**Card Layout** (horizontal flex):

**Left Section** (flex-1):
- Header: Firm logo (32px), firm name, type badge, "New" badge
- Title: Premises name (text-lg font-medium, truncated)
- Details: MapPin (address), Calendar (submitted date), User (submitter name)
- Status badge (color-coded: New blue, Under Review amber, Accepted green, Rejected red, Archived gray)

**Right Section** (240px):

**If New**:
- "Claim This Submission" button (primary blue)
- Or "Assign to..." dropdown (admin)

**If Under Review**:
- Assigned user avatar + name
- "Reassign" link (admin only)

**If Claimed**:
- Accept Submission (green, CheckCircle)
- Request Changes (amber, MessageCircle)
- Reject (outline red, X)

**If Accepted**:
- Green checkmark, "Accepted on [date]"
- "View Notice" link

**If Rejected**:
- Red X, "Rejected on [date]"
- "View Reason" link

**Card Hover**: shadow-lg, scale-[1.01]

**Click Card**: Opens submission detail modal

---

### Submission Detail Modal (max-w-4xl)

**Tabs**:

1. **Notice Details**: Full notice preview (all sections), generated notice text
2. **Attachments**: Grid of files, PDF previews, download buttons
3. **Firm Message**: Styled message box from firm
4. **Submission History**: Timeline of all actions

**Footer** (sticky):

**Left**: Archive, Print buttons

**Right** (conditional):
- If New: "Claim & Review" (assigns to current user)
- If Claimed: "Request Changes", "Reject", "Accept & Publish" (green)
- If Accepted: "View Published Notice"
- If Rejected: "Reconsider" (reopens)

---

### Action Modals

**Request Changes Modal**:
- Title: "Request Changes from [Firm]"
- Message textarea (what needs changing)
- Issue types checklist (Incomplete info, Incorrect address, Missing docs, Deadline issues, Other)
- "Send Request" button (sends email, updates status)

**Reject Submission Modal**:
- Warning banner (red)
- Reason textarea (required, min 20 chars)
- Rejection categories (radio: Outside jurisdiction, Incomplete, Incorrect type, Duplicate, Other)
- "Confirm Rejection" button (red, sends rejection email)

**Accept & Publish Modal**:
- Review checklist (all info verified, docs valid, deadlines confirmed, address geocoded)
- Final edits section: editable key fields (address, deadline, publication date, newspaper)
- Publication options: date picker, newspaper dropdown
- "Publish Notice" button (green):
  - Creates notice with `submitted_by_firm_id`
  - Sets status='published'
  - Geocodes, uploads attachments
  - Sends confirmation to firm
  - Marks submission accepted
  - Shows success modal

**Data**: Queries `submissions` filtered by `target_department_id`, real-time subscriptions

**Empty State**: "No submissions yet" with copyable submission link `/submit/[dept-slug]`

---

[← Back to Index](./00-INDEX.md) | [Previous: Auth Pages](./04-pages-auth.md) | [Next: Firm Pages →](./06-pages-firm.md)
