# Westminster Council Demo - Complete ✅

**Date**: 2025-11-21
**Status**: All demo data seeded and narration updated

---

## 🎯 Access Information

### Council Officer Portal:
**URL**: `http://localhost:5173/c/westminster-city-of-council/licensing`

**No Login Required** - Access directly via URL

---

## 📊 Westminster Demo Data Summary

### Published Notices: **38**
- 11 existing notices
- 27 newly created notices
- Notice types: licensing-premises-new, licensing-premises-variation, licensing-club-premises, gambling-premises-new, gambling-premises-variation
- All with realistic Westminster venue names and addresses

### Pending Submissions: **5**
- 2 existing submissions
- **3 new submissions from Wilson & Partners**:
  1. **The Chelsea Wine Bar** - New premises licence (123 Sloane Street, SW3 5TN)
  2. **Mayfair Late Night Bar** - Variation to extend hours (89 Berkeley Square, W1K 5BE)
  3. **Westminster Gastro Club** - Club premises certificate (45 Horseferry Road, SW1P 2EJ)

### Representations: **15**
- **Controversial Notice**: Westminster Bridge Bistro (29 Westminster Bridge Road)
  - **12 objections** citing public nuisance and crime prevention
  - **3 support letters** citing economic benefit
- All representations have realistic Westminster addresses (Belgrave, Victoria, Ebury, Warwick Way, etc.)
- Status: All marked as 'submitted' (unread by council)

---

## 🗺️ Westminster Areas Covered

Notices distributed across authentic Westminster neighborhoods:
- Mayfair, Victoria, Soho, Westminster, Belgravia
- Pimlico, Covent Garden, The Strand, Charing Cross
- Leicester Square, Piccadilly, St James, Marylebone
- Paddington, Knightsbridge, Hyde Park, Embankment
- Trafalgar Square, Regent Street, Oxford Street, Bond Street
- Green Park, Westminster Bridge, Churchill Gardens
- Millbank, Vauxhall

---

## 📝 Narration Updates

### Changed from Bristol to Westminster:

**Before**:
- Emma Martinez, Senior Licensing Officer at **Bristol City Council**
- Controversial application in **Clifton area**

**After**:
- Emma Martinez, Senior Licensing Officer at **Westminster City Council**
- Controversial application: **Westminster Bridge Bistro** on **Westminster Bridge Road**

### Updated Statistics:

| Metric | Narration | Actual Data | Status |
|--------|-----------|-------------|--------|
| Published notices | 38 | 38 | ✅ Match |
| Pending submissions | 5 | 5 | ✅ Match |
| Unread representations | 15 | 15 | ✅ Match |
| Controversial notice objections | 12 | 12 | ✅ Match |
| Controversial notice support | 3 | 3 | ✅ Match |

---

## 🎬 What to Show in Segment 3

### Step 1: Dashboard Overview (0:00-0:15)
Navigate to: `http://localhost:5173/c/westminster-city-of-council/licensing`

**Expected Dashboard Display**:
- 38 published notices
- 5 pending submissions
- 15 unread representations
- Amber dots on urgent items

### Step 2: Review Pending Submissions (0:15-0:45)
- Click "Pending Submissions" tab
- Show list of 5 submissions
- Select one from Wilson & Partners (e.g., "The Chelsea Wine Bar")
- Show structured format with all fields complete
- Click "Approve for Publication" button
- Show confirmation that solicitor is notified

### Step 3: Review Representations (0:45-1:30)
- Click "Representations" section
- Select **Westminster Bridge Bistro** notice
- Show 12 objections + 3 support letters
- Filter by licensing objective (public nuisance, crime prevention, economic benefit)
- Mark representations as "read"
- Show deadline indicator (closes tomorrow)

### Step 4: Template Management (1:30-2:00)
- Show template management interface
- Demonstrate standard templates for routine variations
- Explain how this speeds up straightforward cases

---

## 🔍 Verification Queries

You can verify the data with these SQL queries:

```sql
-- Published notices count
SELECT COUNT(*) FROM notices
WHERE council_id = '02cb9c23-92bb-4f51-9e1a-30698dccffb6'
  AND status = 'published';
-- Result: 38

-- Pending submissions
SELECT COUNT(*) FROM submissions
WHERE target_organization_id = 'fb76a8aa-4e3d-40ac-9c61-e9217ed930a4'
  AND status = 'new';
-- Result: 5

-- Representations
SELECT
  n.premises->>'name' as venue,
  COUNT(CASE WHEN r.type = 'objection' THEN 1 END) as objections,
  COUNT(CASE WHEN r.type = 'support' THEN 1 END) as support
FROM notices n
JOIN representations r ON r.notice_id = n.id
WHERE n.council_id = '02cb9c23-92bb-4f51-9e1a-30698dccffb6'
GROUP BY n.id, n.premises
ORDER BY COUNT(r.id) DESC
LIMIT 1;
-- Result: Westminster Bridge Bistro | 12 | 3
```

---

## ✅ Checklist

- [x] Created 27 additional Westminster notices (38 total)
- [x] Created 15 representations (12 objections + 3 support)
- [x] Created 3 pending submissions from Wilson & Partners
- [x] Updated narration from Bristol to Westminster
- [x] Updated location from "Clifton area" to "Westminster Bridge Bistro on Westminster Bridge Road"
- [x] Updated statistics: 3 → 5 pending submissions
- [x] Verified all narration matches actual data
- [x] All Westminster addresses are authentic London postcodes

---

## 🚀 Ready for Video Recording

**Access URL**: http://localhost:5173/c/westminster-city-of-council/licensing

All narration in **SHOWCASE_VIDEO_NARRATION.md** (Segment 3, lines 57-82) now accurately reflects the Westminster Council portal data.

No discrepancies between narration and actual system!

---

## 📦 Files Modified

1. **SHOWCASE_VIDEO_NARRATION.md** (Lines 57-82)
   - Changed Bristol City Council → Westminster City Council
   - Changed Clifton area → Westminster Bridge Bistro
   - Updated statistics (3 → 5 pending submissions)

2. **Database** (Direct SQL inserts)
   - 27 new notices in `notices` table
   - 15 new representations in `representations` table
   - 3 new submissions in `submissions` table

---

**Demo is production-ready for Segment 3 recording!** 🎥
