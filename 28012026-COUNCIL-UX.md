# Council Portal UX Fixes PRD

**Date:** 28 January 2026
**Priority:** High
**Status:** Ready for implementation

---

## Issues Identified

### 1. Audit Log - Too Technical / Not User-Friendly

**Current State:**
- Shows raw technical data: "representation note added", Resource ID, "User: System"
- "View Details" shows JSON/coded format
- Not meaningful to licensing officers

**Expected Behavior:**
Licensing officers need to see at a glance:
- **Which premises/notice** it relates to (e.g., "The Red Lion - Premises Licence Variation")
- **Who** - Which staff member took action (e.g., "Jane Smith")
- **When** - Human-readable time (e.g., "Today at 3:15 PM" or "2 hours ago")
- **What** - Plain English description (e.g., "Added internal note: 'Need to check noise complaints'")

**Files to modify:**
- `src/pages/council/AuditLog.tsx`

**Fix Required:**
1. Look up notice/premises name from `resource_id` when `resource_type` is 'representation' or 'notice'
2. Display staff member name instead of "System" (from `user_email` or lookup from users table)
3. Format timestamps as relative time ("2 hours ago") or friendly format ("Today at 3:15 PM")
4. Transform action codes to plain English:
   - `representation_note_added` → "Added internal note"
   - `notice.created` → "Notice submitted"
   - `notice.published` → "Notice published"
   - `notice.status_changed` → "Status changed from X to Y"
5. Show comment preview inline instead of requiring "View Details"
6. Remove or simplify the JSON view in "View Details"

---

### 2. Analytics Page - Not Wired In

**Current State:**
- Shows "Total notices: 0", "Published: 0"
- All stats are zero despite 11 real notices in the database

**Expected Behavior:**
- Should show real counts from database
- Should filter by `department_id`

**Files to modify:**
- `src/pages/council/Analytics.tsx`

**Fix Required:**
1. Query notices table filtered by `department_id`
2. Calculate real stats:
   - Total notices
   - Published count
   - Representations received
   - Pending review count
3. Wire up any charts/graphs to real data

---

### 3. Drafts Tab - Remove for Councils

**Current State:**
- Drafts tab appears in council portal navigation

**Expected Behavior:**
- Councils don't create notices - they receive them from applicants/firms
- Drafts tab is not relevant and should be removed

**Files to modify:**
- `src/pages/council/CouncilLayout.tsx` (navigation)

**Fix Required:**
1. Remove "Drafts" from the council portal navigation
2. Remove the route if it exists

---

### 4. Settings - Authority Address Lookup

**Current State:**
- Authority address field exists but may not use address lookup
- Forms get pre-filled with council details but Settings shows them empty
- Unclear if Settings values are actually used by forms

**Expected Behavior:**
- Authority address should use the same AddressLookup component used elsewhere
- Settings values should be persisted and used when generating notices
- If forms are getting data from elsewhere, that should be clarified/unified

**Files to investigate:**
- `src/pages/council/Settings.tsx`
- `src/components/AddressLookup.tsx`
- Check where notice templates get council address from

**Fix Required:**
1. Implement AddressLookup for authority address field in Settings
2. Ensure Settings values are saved to database (`council_settings` or `organizations` table)
3. Ensure notice templates pull from these saved settings
4. Pre-populate Settings with existing council data if available

---

## Implementation Order

1. **Analytics** (P0) - Broken functionality, shows wrong data
2. **Drafts removal** (P0) - Quick win, removes confusion
3. **Audit Log UX** (P1) - Functional but poor UX
4. **Settings address** (P2) - Enhancement

---

## Verification Checklist

After implementation:

- [ ] Analytics shows real notice counts (should be 11 for Sampleton)
- [ ] Drafts tab is removed from council navigation
- [ ] Audit log shows premises name, staff name, friendly time, plain English actions
- [ ] Settings authority address uses address lookup component
- [ ] Settings values persist and are used by notice templates
