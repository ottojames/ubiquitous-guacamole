# User Flow Narratives
## Step-by-Step User Journeys

[← Back to Index](./00-INDEX.md) | [Previous: Design System](./08-design-system.md) | [Next: Functional Requirements →](./10-functional-requirements.md)

---

## Overview

This document describes complete user journeys with step-by-step narratives for each user type, demonstrating how the system works in practice.

---

## 9.1 Licensing Officer (Single Department)

**User**: John Smith, Licensing Officer at Sampleton Borough Council
**Role**: Editor in Licensing Department
**Goal**: Publish a new premises licence application notice

### Journey Steps

**1. Sign In**
- Opens browser to civic notices portal
- Clicks "Sign In"
- Enters email: john.smith@sampleton.gov.uk
- Receives magic link email, clicks link
- System detects single department membership (Licensing)
- Redirected directly to `/c/sampleton/licensing/dashboard`

**2. Dashboard Overview**
- Sees stats: 45 active notices, 3 drafts, 12 published this month
- Quick Actions panel shows "Create New Notice" button
- Clicks "Create New Notice"

**3. Create Notice - Step 1: Type**
- Sees grid of notice types filtered by Licensing department
- Selects "Premises Licence — New Application"
- Clicks "Continue"

**4. Create Notice - Step 2: Details**
- **Premises Section**:
  - Enters: "The Red Lion Inn"
  - Address: Starts typing postcode "SW1A 1AA"
  - Clicks "Find address" → populates full address
  - Map shows pin at location
- **Applicant Section**:
  - Enters applicant name: "Red Lion Pubs Ltd"
  - Clicks "Same as premises" for address
  - Enters contact email and phone
- **Licensing Details**:
  - Checks boxes: "Sale of alcohol (on premises)", "Live music"
  - Sets operating hours: Mon-Sun 10:00-23:00 using "Same hours every day"
  - Enters DPS details
- **Legal Information**:
  - Authority auto-filled: "Sampleton Borough Council"
  - Deadline auto-calculated: 28 days from today
  - Sets publication date: Tomorrow
  - Newspaper: "Sampleton Gazette" (dept default)
- Sees "Saved" indicator (auto-save working)
- Clicks "Continue"

**5. Create Notice - Step 3: Attachments**
- Drags application PDF into upload zone
- File uploads with progress bar
- Clicks "Extract text" (OCR)
- Reviews extracted text, fields mostly match (confirms auto-fill worked well)
- Clicks "Continue"

**6. Create Notice - Step 4: Review**
- Reviews all sections
- Notices typo in premises name
- Clicks "Edit" next to Premises → back to Step 2
- Fixes typo, clicks "Continue" twice to return
- Reviews generated notice preview (looks good)
- Selects "Publish Immediately" (approval not required for Editors in this dept)
- Clicks "Publish Notice" (green button)

**7. Success**
- Success toast: "Notice published successfully!"
- Modal offers: "View Public Notice" or "Create Another"
- Clicks "View Public Notice"
- Sees notice on public portal with map pin
- Done in under 8 minutes

---

## 9.2 Multi-Department Admin

**User**: Sarah Jones, Senior Officer at Sampleton Council
**Roles**: Admin in Licensing, Editor in Planning, Viewer in Traffic
**Goal**: Manage team in Licensing, then review a Planning notice

### Journey Steps

**1. Sign In & Context Selection**
- Signs in with magic link
- System detects 3 department memberships
- Sees context switcher with 3 tiles:
  - **Licensing** (Admin) - Most recently accessed (gold star)
  - Planning (Editor)
  - Traffic (Viewer)
- Clicks Licensing tile

**2. Licensing Dashboard (Admin Context)**
- URL: `/c/sampleton/licensing/dashboard`
- Top nav shows "Licensing (Admin)" in blue badge
- Sidebar shows all menu items including Team and Settings (admin access)
- Stats show 45 active notices
- Clicks "Team" in sidebar

**3. Team Management**
- Sees list of 5 team members with roles
- Notices new joiner "Mike Brown" has Viewer role
- Clicks "Change Role" → selects "Editor"
- Confirms change
- Mike immediately has Editor permissions
- Clicks "Invite Member" button
- Enters email for new officer, selects Editor role, adds welcome message
- Sends invitation

**4. Switch to Planning Department**
- Clicks department dropdown in top nav
- Sees all 3 departments
- Selects "Planning (Editor)"
- URL changes to `/c/sampleton/planning/dashboard`
- Page refreshes with Planning data
- Stats show different numbers (Planning's data)
- Sidebar now hides "Team" and "Settings" (not Admin in Planning)

**5. Review Planning Notice (Editor Context)**
- Clicks "Notices" in sidebar
- Sees list of Planning notices (different from Licensing)
- Filters by "Draft" status
- Sees draft from colleague: "New residential development - 25 Oak Street"
- Clicks to view
- Reviews details, looks good
- As Editor, can edit and publish
- Makes minor correction to address
- Clicks "Publish Notice"
- Success!

**6. Attempt to Access Traffic (Viewer Context)**
- Switches to Traffic department via dropdown
- Dashboard shows Traffic's stats
- Tries to click "Create Notice" → button is hidden/disabled (Viewer role)
- Can only view existing notices
- Cannot access Team or Settings pages
- Context switching demonstrates role-based access control

---

## 9.3 Organization Admin

**User**: Michael Brown, IT Director at Sampleton Council
**Role**: Organization Admin
**Goal**: Create new department, view cross-department analytics

### Journey Steps

**1. Sign In**
- Signs in, sees context switcher
- Special purple "All Departments" tile at top
- Individual department tiles below
- Selects "All Departments"

**2. Organization Overview Dashboard**
- URL: `/c/sampleton/all-departments/dashboard`
- Purple accent color (not blue like departments)
- Breadcrumb: "Sampleton Council / All Departments / Dashboard"
- Stats show aggregated data:
  - Total Active Notices: 120 (across all depts)
  - Departments: 3 active
  - Team Members: 15 unique users
  - This Month: 28 published

**3. Department Performance Grid**
- Table shows all 3 departments:
  - Licensing: 45 active, 5 members, active 2 hours ago
  - Planning: 35 active, 3 members, active 1 day ago
  - Traffic: 40 active, 7 members, active 5 hours ago
- Sees Planning has been inactive for a day
- Notes Traffic has most team members

**4. Create New Department**
- Clicks "Create New Department" button in Quick Actions
- Modal opens
- Enters:
  - Name: "Environmental Health Department"
  - Type: Environmental Health
  - Email: envhealth@sampleton.gov.uk
  - Description: "Food safety, pollution control, and health inspections"
- Clicks "Create"
- New department created
- Michael automatically assigned as Department Admin
- Success toast
- Department appears in grid

**5. Drill Into Specific Department**
- Clicks "View Dashboard" for Licensing
- URL changes to `/c/sampleton/licensing/dashboard`
- Now in Licensing context (as Admin, since Org Admins get admin access)
- Can manage team, settings, approve notices
- Full admin capabilities within this department

**6. Return to Organization View**
- Clicks department dropdown
- Selects "All Departments" again
- Back to aggregated view
- Can see audit log for entire organization (not just one dept)

---

## 9.4 Law Firm Solicitor

**User**: Emma Wilson, Solicitor at Wilson & Partners LLP
**Role**: Firm User
**Goal**: Submit premises licence application to council on behalf of client

### Journey Steps

**1. Sign In**
- Signs in to firm portal
- Single-tier access (no departments)
- Redirected to `/f/wilson-partners/dashboard`

**2. Firm Dashboard**
- Sees stats: 8 active submissions, 15 accepted this month, 24 total clients
- Clicks "Submit New Notice" button

**3. Submission - Step 1: Council & Client**
- **Select Council**:
  - Types "Sampleton" in search
  - Selects "Sampleton Borough Council"
  - Radio buttons appear for departments: Licensing, Planning, Traffic, Env Health
  - Selects "Licensing Department"
- **Select Client**:
  - Dropdown shows existing clients
  - Selects "Red Lion Pubs Ltd" (existing client)
- Clicks "Continue"

**4. Submission - Step 2: Notice Details**
- Same form as council editor
- Clicks "Use client information for applicant" toggle
- Client name and contact details auto-populate
- Enters premises information
- Enters licensing details (activities, hours, DPS)
- Uploads application documents (PDF, supporting docs)
- **Firm Message to Council**:
  - Types: "Application complete and all fees paid. Please let us know if you need any additional information."
- Clicks "Continue"

**5. Submission - Step 3: Review**
- Reviews all details
- Sees generated notice preview
- Checkbox: "Notify me when council reviews" (checked)
- Clicks "Submit to Council" (blue button)

**6. Submission Confirmation**
- Success modal: "Submission sent to Sampleton Licensing"
- Reference number: SUB-123456
- "They'll review it and get back to you"
- Confirmation email sent
- Redirected to submission detail page

**7. Track Submission Status**
- URL: `/f/wilson-partners/submissions/SUB-123456`
- Status: "New"
- Sees submission details
- Council contact info displayed
- Can download PDF of submission
- Timeline shows: "Submitted 5 minutes ago"

**8. Council Reviews (Days Later)**
- Emma receives email: "Council has requested changes"
- Opens submission detail page
- Status banner (amber): "Council has requested changes"
- Clicks "View Requested Changes"
- Modal shows council message: "Please clarify operating hours for outdoor seating area"
- Clicks "Edit & Resubmit" tab
- Edits licensing details to clarify
- Clicks "Resubmit" button
- Status changes to "Under Review" again
- Timeline updated with "Resubmitted" entry

**9. Submission Accepted**
- Receives email: "Your submission has been accepted!"
- Opens submission
- Green banner: "Submission accepted and published!"
- Clicks "View Published Notice"
- Opens public portal showing published notice
- Client satisfied, done!

---

## 9.5 Public Citizen

**User**: Local Resident
**Goal**: Find nearby premises licence applications and submit representation

### Journey Steps

**1. Discover Portal**
- Googles "Sampleton licensing applications"
- Finds public civic notices portal

**2. Browse Map**
- Sees map with clustered pins of all published notices
- Zooms to neighborhood
- Clicks pin near home: "The Red Lion Inn"

**3. View Notice Detail**
- Sees full formal notice text
- Premises name, address on map
- Applicant details
- Licensable activities: "Sale of alcohol, Live music"
- Operating hours: 10:00-23:00 daily
- **Representation Deadline**: "28 November 2025" (2 weeks away) - prominently displayed in amber badge
- Countdown: "14 days remaining"

**4. Submit Representation**
- Clicks "Submit Representation" button
- Simple form:
  - Name
  - Email
  - Address
  - Representation text (textarea)
  - Checkbox: "I object to this application because it may cause noise disturbance"
  - Detailed reasons textarea
- Clicks "Submit Representation"

**5. Confirmation**
- Success message: "Your representation has been submitted"
- Confirmation email sent
- Reference number provided
- Notice: "The licensing authority will consider your representation. You may be invited to a hearing."

---

[← Back to Index](./00-INDEX.md) | [Previous: Design System](./08-design-system.md) | [Next: Functional Requirements →](./10-functional-requirements.md)
