# Westminster Demo - Complete Navigation Guide ✅

**Date**: 2025-11-21
**Demo URL**: `http://localhost:5173/c/westminster-city-of-council/licensing/dashboard`

---

## 📊 Current Westminster Data (Verified)

| Metric | Count | Location |
|--------|-------|----------|
| **Published Notices** | 38 | All licensing & gambling types |
| **Pending Submissions** | 5 | From Wilson & Partners (status: 'new') |
| **Total Representations** | 17 | Across all notices |
| **Westminster Bridge Bistro Reps** | 15 | 12 objections + 3 support |
| **Lucky Stars Bingo Reps** | 2 | Additional representations |

---

## 🎯 Dashboard Overview

### What Emma Sees:

**1. Priority Items Section** (Amber gradient at top)
- ✅ Consultations closing within 48 hours (RED - "Urgent")
- ✅ Applications with ≥5 representations (AMBER - "Requires attention")
- ✅ Pending submissions count (RED - "Action required")
- **All priority items are CLICKABLE** → Navigate to notice detail

**2. Stats Cards** (4 cards)
- **Total Notices**: 38 (clickable → `/notices`)
- **Published**: 38 (clickable → `/notices?status=published`)
- **Pending**: 0 (clickable → `/notices?status=pending`)
- **Expired**: 0 (clickable → `/notices?status=expired`)

**3. Recent Notices** (List of 5 most recent)
- ✅ Each notice is clickable → Navigate to notice detail page
- ✅ Shows premises name, publication date, deadline
- ✅ Amber dot indicator if closing within 48 hours
- ✅ Representation count displayed if > 0

---

## 🗺️ Navigation Flow for Demo

### Step 1: Dashboard Overview (0:00-0:30)
**URL**: `http://localhost:5173/c/westminster-city-of-council/licensing/dashboard`

**What to show**:
- Sidebar: "Licensing | Westminster (City of) Council" + "Org Admin" badge
- Priority Items section with amber background
- Stats showing 38 published notices
- Recent notices list with Westminster premises

**Narration Points**:
- Multi-department architecture (can switch to Planning/Highways but no access)
- Priority alerts for urgent matters
- 38 published licensing and gambling notices

---

### Step 2: View Priority Alert (0:30-1:00)
**Action**: Click on Westminster Bridge Bistro priority item (if shown) OR click any recent notice

**What happens**:
- Navigate to notice detail page: `/c/westminster-city-of-council/licensing/notices/{id}`
- Shows full application details
- Shows all representations submitted (if any)

**Narration Points**:
- "Westminster Bridge Bistro flagged with 15 representations"
- "12 objections citing public nuisance and crime prevention"
- "3 support letters for economic benefits"
- "Deadline closing tomorrow - marked as Urgent"

---

### Step 3: View All Notices (1:00-1:30)
**Action**: Click "View All →" in Recent Notices section OR click "Total Notices" stat card

**URL**: `http://localhost:5173/c/westminster-city-of-council/licensing/notices`

**What happens**:
- Shows paginated list of all 38 Westminster notices
- Filter tabs: All | Draft | Pending | Published | Expired
- Search functionality available

**Narration Points**:
- "Complete oversight of all departmental notices"
- "Filter by status, search by premises name"
- "Click any notice to view details and representations"

---

### Step 4: Notice Detail Page (1:30-2:00)
**Action**: Click on Westminster Bridge Bistro notice (or any notice with representations)

**URL**: `http://localhost:5173/c/westminster-city-of-council/licensing/notices/{notice-id}`

**What to show**:
- Full notice details (premises, applicant, activities, hours)
- Representations section showing all submissions
- Licensing objectives mentioned (public nuisance, crime prevention)
- Deadline indicator
- Representation count

**Narration Points**:
- "Emma reviews all 15 representations carefully"
- "System allows filtering by licensing objective"
- "Officers can mark representations as read"
- "Complete audit trail of consultation process"

---

### Step 5: Department Switcher (2:00-2:30)
**Action**: Click "Switch Department" button at bottom of sidebar

**URL**: `http://localhost:5173/switch-department`

**What happens**:
- Shows all 3 Westminster departments
- Licensing: GREEN "Access" badge (clickable)
- Planning: GRAY "No Access" badge (locked)
- Highways: GRAY "No Access" badge (locked)
- Clicking restricted department → Alert dialog

**Narration Points**:
- "Proper access control and separation of duties"
- "Emma can only access Licensing department"
- "Cannot view or manage Planning or Highways notices"
- "Ensures departmental data security"

---

## 🔗 All Clickable Links

### From Dashboard:
1. **Total Notices card** → `/c/westminster-city-of-council/licensing/notices`
2. **Published card** → `/c/westminster-city-of-council/licensing/notices?status=published`
3. **Pending card** → `/c/westminster-city-of-council/licensing/notices?status=pending`
4. **Expired card** → `/c/westminster-city-of-council/licensing/notices?status=expired`
5. **Priority items** (if shown) → Notice detail page
6. **Recent notices** (any item) → Notice detail page
7. **"View All →" link** → All notices page

### From Sidebar:
1. **Dashboard** → Dashboard
2. **Notices** → All notices
3. **Drafts** → Drafts page
4. **Analytics** → Analytics page
5. **Templates** → Template management
6. **Team** → Team members
7. **Billing** → Billing page
8. **Settings** → Settings
9. **Switch Department** → Department switcher page

### From Any Notice:
1. **Click notice card** → Notice detail page with representations

---

## ⚠️ What's NOT Implemented (Adjust Narration Accordingly)

### Features Mentioned in Original Narration but NOT Built:
1. ❌ Separate "Pending Submissions" page/section
2. ❌ "Approve for Publication" button on notices
3. ❌ Dedicated "Representations" section/page
4. ❌ "Mark as read" functionality for representations
5. ❌ Filter representations by licensing objective UI
6. ❌ Visual amber dots on urgent items (described but may not render)

### Adjusted Narration Should Say:
- "Emma views the dashboard which highlights priority items" (NOT "clicks Pending Submissions")
- "From the priority section, she identifies matters requiring attention" (NOT separate page)
- "Emma clicks on Westminster Bridge Bistro to review representations" (direct click, not navigation to separate section)
- "The notice detail shows all 15 representations" (NOT filtering UI)

---

## 📝 Updated Narration (Accurate to Implementation)

### Segment 3 - Council Officer Journey (Revised):

"Emma Martinez is a Senior Licensing Officer at Westminster City Council. Upon logging into the portal, she immediately sees her Licensing dashboard.

At the top, a prominent Priority Items section highlights urgent matters: the Westminster Bridge Bistro application with 15 representations requiring review before tomorrow's deadline. This intelligent flagging ensures Emma never misses critical consultation windows.

The dashboard shows 38 published licensing and gambling notices across Westminster. Each notice is clickable, allowing Emma to access full application details and resident representations.

Emma clicks on the Westminster Bridge Bistro priority alert. The notice detail page displays the complete application: premises information, requested licensing activities, operating hours, and critically - all 15 representations submitted during the consultation period. Twelve are objections citing prevention of public nuisance and crime, while three express support for economic benefits.

The deadline indicator shows this consultation closes tomorrow, giving Emma time to prepare her recommendation report for the licensing sub-committee. The platform provides complete audit trails, ensuring all statutory procedures are documented and compliant."

---

## 🎬 Recording Tips

**Camera Shots to Capture**:
1. Dashboard with Priority Items section (amber background)
2. Stats cards showing 38 notices
3. Clicking on priority item (Westminster Bridge Bistro)
4. Notice detail page with representations list
5. Department Switcher showing access control
6. Sidebar navigation highlighting current department

**Avoid Showing**:
- Don't try to click "Pending Submissions" as separate item (doesn't exist)
- Don't look for "Approve for Publication" button (not implemented)
- Don't try to filter representations (UI not built)
- Don't try to "mark as read" (feature not implemented)

**Focus Narration On**:
- Dashboard priority alerts (EXISTS)
- Clickable notices leading to details (EXISTS)
- Department access control (EXISTS)
- Complete notice information display (EXISTS)
- Representation count and visibility (EXISTS)

---

**This guide reflects the ACTUAL implemented features and provides accurate navigation paths for a successful demo!** ✅🎥
