# Westminster Dashboard Fix - Complete ✅

**Date**: 2025-11-21
**Issue**: Westminster Licensing dashboard showing all zeros despite data being in database
**Status**: RESOLVED

---

## 🔍 Root Cause Analysis

The Westminster dashboard was querying by `department_id`, but the notices were only populated with `council_id`. This caused the query to return zero results.

### Code Location
**File**: `src/pages/council/Dashboard.tsx` (Line 117-120)

```typescript
// Normal mode - query by department_id
const { data: noticesData, error: noticesError } = await supabase
  .from('notices')
  .select('id, status')
  .eq('department_id', department.id);  // ← This was NULL for Westminster notices
```

### Database Schema
The `notices` table has BOTH columns:
- `council_id` (UUID) - References the council
- `department_id` (UUID) - References the specific department within the council

Our data seeding populated `council_id` but left `department_id` as NULL.

---

## ✅ Solution Applied

### 1. Updated All Westminster Notices
```sql
UPDATE notices
SET department_id = '53c08600-5c5a-46a4-8805-16c129022952'
WHERE council_id = '02cb9c23-92bb-4f51-9e1a-30698dccffb6'
  AND department_id IS NULL;
```

**Result**: 40 notices updated

### 2. Updated All Westminster Submissions
```sql
UPDATE submissions
SET target_department_id = '53c08600-5c5a-46a4-8805-16c129022952'
WHERE target_organization_id = 'fb76a8aa-4e3d-40ac-9c61-e9217ed930a4';
```

**Result**: 5 submissions updated

---

## 📊 Westminster Licensing Data Summary

| Metric | Count | Details |
|--------|-------|---------|
| **Published Notices** | 40 | All licensing and gambling types |
| **Pending Submissions** | 5 | From Wilson & Partners and other firms |
| **Total Representations** | 17 | 15 on Westminster Bridge Bistro, 2 on Lucky Stars Bingo |
| **Status Distribution** | All Published | No drafts, pending, or expired notices |

---

## 🎯 Dashboard Now Shows

### When accessing: `http://localhost:5173/c/westminster-city-of-council/licensing/dashboard`

**Stats Cards**:
- **Total Notices**: 40
- **Published**: 40
- **Drafts**: 0
- **Pending**: 0
- **Expired**: 0

**Recent Notices**:
- Shows last 5 published notices with premises names
- Includes representation counts
- Displays publication dates and deadlines

---

## 📝 Updated Documentation

### Files Updated:

1. **SHOWCASE_VIDEO_NARRATION.md** (Line 68)
   - Changed: "38 published notices" → "40 published notices"
   - Kept: "5 pending submissions" ✅
   - Kept: "15 unread representations" (referencing Westminster Bridge Bistro specifically)

2. **DEPARTMENTAL_ACCESS_CONTROL_DEMO.md** (Lines 22, 75-77)
   - Updated Licensing department: 38 → 40 active notices
   - Updated dashboard return values to match actual data

---

## 🔐 Key IDs Reference

| Entity | ID | Notes |
|--------|-----|-------|
| **Westminster Organization** | `fb76a8aa-4e3d-40ac-9c61-e9217ed930a4` | Organization level |
| **Westminster Council** | `02cb9c23-92bb-4f51-9e1a-30698dccffb6` | Council reference (for notices) |
| **Westminster Licensing Dept** | `53c08600-5c5a-46a4-8805-16c129022952` | Department level (for dashboard queries) |
| **Wilson & Partners Org** | `00000000-0000-0000-0000-000000000101` | Firm submitting notices |

---

## ✅ Verification Queries

### Verify Notices Linked to Department
```sql
SELECT COUNT(*) FROM notices
WHERE department_id = '53c08600-5c5a-46a4-8805-16c129022952';
-- Expected: 40
```

### Verify Submissions Linked to Department
```sql
SELECT COUNT(*) FROM submissions
WHERE target_department_id = '53c08600-5c5a-46a4-8805-16c129022952';
-- Expected: 5 (with status 'new')
```

### Verify Representations on Westminster Notices
```sql
SELECT COUNT(*) FROM representations r
JOIN notices n ON r.notice_id = n.id
WHERE n.department_id = '53c08600-5c5a-46a4-8805-16c129022952';
-- Expected: 17
```

---

## 🎬 Ready for Demo

The Westminster Licensing dashboard is now fully operational and displays:
- ✅ 40 published licensing and gambling notices
- ✅ 5 pending submissions from law firms
- ✅ 17 representations across multiple notices
- ✅ Departmental access control (can only access Licensing, not Planning or Highways)
- ✅ All narration matches actual dashboard data

**Demo URL**: `http://localhost:5173/c/westminster-city-of-council/licensing/dashboard`

---

**Dashboard zero data issue: RESOLVED** ✅
