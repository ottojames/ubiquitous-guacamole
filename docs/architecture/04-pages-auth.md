# Authentication & Onboarding Pages
## Complete Page Specifications

[← Back to Index](./00-INDEX.md) | [Previous: Roles & Permissions](./03-roles-permissions.md) | [Next: Council Pages →](./05-pages-council.md)

---

## Overview

This document specifies all authentication and onboarding pages in complete detail, including layout, components, styling (Tailwind classes), data flow, and user interactions.

**Design System Reference**: All pages follow the Pricing Page design system with:
- Cards: `rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white`
- Gradient backgrounds: `bg-gradient-to-br from-blue-50 via-white to-purple-50`
- Primary buttons: `bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700`

---

## 4.1.1 Sign In Page (`/auth/sign-in`)

**Layout**: Centered card on gradient background

### Visual Structure

**Background**:
- Full viewport height
- Gradient: `bg-gradient-to-br from-blue-50 via-white to-purple-50`

**Card Container**:
- Width: `max-w-md` (448px)
- Centered: `mx-auto mt-20`
- Styling: `bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-12`

### Content Elements

**Logo** (optional):
- Centered, max-width 120px
- Margin bottom: `mb-8`

**Heading**:
- Text: "Sign In"
- Styling: `text-3xl font-bold text-gray-900 mb-2`

**Subheading**:
- Text: "Access your council or firm account"
- Styling: `text-gray-600 text-sm mb-8`

**Email Input**:
- Label: "Email address"
- Input styling: `w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500`
- Placeholder: "you@example.com"

**Magic Link Button**:
- Text: "Send magic link"
- Styling: `w-full mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700`
- Icon: Mail icon (left side)

**OAuth Buttons** (if enabled):
- Google and Microsoft options
- Styling: `border border-gray-300 rounded-xl px-6 py-3 hover:bg-gray-50`
- Divider with "or" text between magic link and OAuth

**Footer Links**:
- "Don't have an account? Create organization" → `/onboarding/create-organization`
- "Need help?" → support page
- Styling: `text-sm text-gray-600` with `text-blue-600 hover:text-blue-700` for links

### Data Flow

1. User enters email
2. System checks if email exists
3. Sends magic link email (15-minute expiry)
4. Email link: `/auth/callback?token=xxx`
5. OAuth providers redirect to callback URL

---

## 4.1.2 Authentication Callback (`/auth/callback`)

**Layout**: Centered loading state

### Visual Elements

**Loading State**:
- Animated spinner icon
- Text: "Signing you in..."
- Same gradient background as sign-in

### Server-Side Processing

**Token Validation**:
1. Validate magic link token or OAuth response
2. Create or retrieve user record from `auth.users`

**Membership Query**:
```sql
-- Organization memberships
SELECT * FROM organization_memberships WHERE user_id = ?

-- Department memberships
SELECT * FROM department_memberships WHERE user_id = ?
```

**Routing Logic**:
- **Zero memberships** → `/onboarding/pending-approval`
- **One department membership** → `/c/:org/:dept/dashboard`
- **Multiple memberships** → `/switch-context`
- **Org Admin/Owner** → `/switch-context` (includes "All Departments" option)

**Error States**:
- Invalid token: Show error message, link to sign-in
- Suspended account: Display message with support contact

---

## 4.1.3 Create Organization (`/onboarding/create-organization`)

**Layout**: Centered wizard card (`max-w-2xl`)

### Progress Stepper

**Horizontal Steps** (top of card):
- **Councils**: Type → Details → Departments → Review
- **Firms**: Type → Details → Review

**Step Indicators**:
- Completed: Blue circle with checkmark
- Current: Blue circle with number
- Upcoming: Gray circle with number
- Connecting lines between circles

---

### Step 1: Choose Organization Type

**Heading**: "What type of organization are you?"

**Type Cards** (2-column grid):

**Council Card**:
- Icon: Building (large, blue)
- Title: "Local Council"
- Description: "Local authorities managing licensing, planning, and other statutory notices"
- Features:
  - Multiple departments
  - Team collaboration
  - Approval workflows
- Styling: `bg-white border-2 rounded-2xl p-8`
- Selected: `border-blue-500 bg-blue-50`

**Firm Card**:
- Icon: Briefcase (large, purple)
- Title: "Law Firm / Solicitor"
- Description: "Legal firms submitting notices on behalf of clients"
- Features:
  - Client management
  - Quick submission
  - Multi-council support
- Selected: `border-purple-500 bg-purple-50`

**Continue Button**: Disabled until selection made

---

### Step 2: Organization Details

**Heading**: "Tell us about your [council/firm]"

**Form Fields** (all required):

1. **Organization Name**:
   - Label: "Official name"
   - Helper: "As registered with Companies House or local government"

2. **Email Domain**:
   - Label: "Email domain"
   - Placeholder: "sampleton.gov.uk"
   - Helper: "Users with this domain can request to join automatically"
   - Validation: Must be valid domain format

3. **Registration Number**:
   - Label: "Registration number"
   - Helper: "Companies House number or local authority code"

4. **Contact Information**:
   - Primary contact name, email, phone

5. **Address**:
   - Street, City, County, Postcode, Country (defaults to UK)

6. **Logo Upload** (optional):
   - Drag-drop zone or file picker
   - Preview thumbnail
   - Max 2MB, PNG/JPG/SVG

**Navigation**: Back/Continue buttons (sticky bottom)

---

### Step 3: Create Departments (Councils Only)

**Heading**: "Set up your first department"
**Subheading**: "You can add more departments later from organization settings"

**Department Form**:

1. **Department Name**:
   - Input generates slug automatically
   - Example: "Licensing Department" → "licensing"

2. **Department Type**:
   - Dropdown: Licensing, Planning, Traffic, Environmental Health, Building Control, Other

3. **Contact Email**:
   - Public-facing email for inquiries

4. **Description** (optional):
   - Textarea for department description

**Add Another Department**:
- Outline button below form
- Can add up to 5 departments during onboarding
- Shows cards for added departments with edit/remove

---

### Step 4: Review & Submit

**Heading**: "Review your application"

**Review Sections** (accordion, all expanded):

**Organization Information**:
- Name, domain, registration number, contact details, address, logo preview
- "Edit" link → returns to Step 2

**Departments** (councils only):
- List with name, type, email
- "Edit" link → returns to Step 3

**Terms & Conditions** (checkboxes):
- ☐ Authorized to create account
- ☐ Agree to Terms of Service and Privacy Policy
- ☐ Understand approval required

**Submit Button**:
- Text: "Submit for Approval"
- Full width, primary blue
- Icon: CheckCircle
- Disabled until all boxes checked

### Data Flow on Submit

1. Create `organizations` record with `status='pending_approval'`
2. Create `organization_memberships` for owner
3. Create `departments` records (if council)
4. Create `department_memberships` for owner in each dept
5. Send approval email to site admins
6. Send confirmation email to applicant
7. Redirect to `/onboarding/pending-approval`

---

## 4.1.4 Pending Approval (`/onboarding/pending-approval`)

**Layout**: Centered message card

**Visual Elements**:
- Large clock icon (amber color)
- Heading: "Your application is being reviewed"
- Message: Confirmation and timeline expectations

**What Happens Next** (timeline):
1. "We verify your organization details"
2. "Your account is approved and activated"
3. "You'll receive an email with next steps"

**Application Details** (collapsible):
- Organization name, registration number, contact email, submitted date
- "Edit" button (reopens create-organization with pre-filled data)

**Footer**:
- "Need to make changes?" → support link
- "Sign out" button

---

## 4.1.5 Accept Invitation (`/onboarding/accept-invite?token=xxx`)

**Layout**: Centered card

### Loading State
- Validates token
- Loads invitation details
- Shows error if invalid/expired

### Card Content (once loaded)

**Organization Logo**: Centered, 80px

**Heading**: "You've been invited to join"

**Organization Name**: Large, bold

**Department Name** (if dept-specific):
- Blue badge below org name

**Role Badge**:
- Color-coded: Admin (blue), Editor (green), Viewer (gray)

**Invitation Details**:
- Invited by: [Name] with avatar
- Role: [Role Name]
- Sent: [Date]

**Personal Message** (if included):
- Quoted text box

**Action Buttons**:
- **Accept Invitation** (primary green, full width)
- **Decline** (outline red, full width)

### Data Flow on Accept

1. Validate user is signed in (redirect to sign-in with token stored if not)
2. Create `organization_membership` or `department_membership`
3. Mark invitation as `status='accepted'`
4. Send confirmation to inviter
5. Redirect to appropriate dashboard

### Data Flow on Decline

1. Mark invitation as `status='declined'`
2. Notify inviter
3. Show confirmation
4. Redirect to user's dashboard or home

---

## 4.1.6 Switch Context (`/switch-context`)

**Purpose**: Choose active department/organization workspace

**Layout**: Full page with grid of department tiles

### Page Header
- Title: "Choose your workspace"
- Subtitle: "Select the department or organization you want to work in"

### Department Tiles Grid

**Grid Layout**: 2-3 columns, `gap-6`

**Tile Design** (matches Pricing cards):
- Styling: `bg-white border-2 border-gray-200 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8`
- Height: ~200px minimum
- Hover: `hover:shadow-xl hover:border-blue-300 transition-all duration-200`

**Tile Content**:

**Organization Name** (top):
- `text-sm font-medium text-gray-600`

**Department Name** (main):
- `text-2xl font-bold text-gray-900 mt-2`
- "All Departments" in purple for org admins

**Role Badge**:
- Pills: "Department Admin", "Editor", "Viewer", "Org Admin", "Owner"
- Color-coded: `px-3 py-1 rounded-full text-xs font-semibold`

**Stats Row** (bottom):
- "X active notices" | "Last accessed: Y days ago"
- `text-sm text-gray-500`

**Most Recent Indicator**:
- Gold star icon (top-right corner)
- Tooltip: "Most recently accessed"

### Special Tile: "All Departments" (Org Admins/Owners)

**Appearance**:
- First in grid
- Purple accent (`border-purple-300`, `hover:border-purple-500`)
- Building layers icon
- Badge: "Organization Admin" or "Owner"
- Stats: "X total departments" | "Y total notices"

### Interaction

**Keyboard Navigation**:
- Number keys 1-9: Select first 9 departments
- Arrow keys: Navigate
- Enter: Select highlighted

**On Selection**:
1. Store `department_id` (or null for "All Departments") in session
2. Update `department_memberships.last_accessed_at`
3. Redirect to dashboard:
   - Department: `/c/:org/:dept/dashboard`
   - All Departments: `/c/:org/all-departments/dashboard`
   - Firm: `/f/:org/dashboard`

---

[← Back to Index](./00-INDEX.md) | [Previous: Roles & Permissions](./03-roles-permissions.md) | [Next: Council Pages →](./05-pages-council.md)
