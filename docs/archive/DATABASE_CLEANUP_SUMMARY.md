# Database Cleanup Summary

**Date**: 2025-11-21
**Action**: Removed all test notices created before yesterday (Nov 20, 2025)

---

## What Was Done

### 1. Backup Created
- Backed up 59 old notices to: `data/backups/old-test-notices-[timestamp].json`
- All data safely preserved before deletion

### 2. Database Cleaned
```sql
-- Deleted 59 notices created before 2025-11-20
-- Also deleted related representations
DELETE FROM representations WHERE notice_id IN (
  SELECT id FROM notices WHERE created_at::date < '2025-11-20'::date
);
DELETE FROM notices WHERE created_at::date < '2025-11-20'::date;
```

### 3. Showcase Landing Updated
- Updated stats in `src/pages/ShowcaseLanding.tsx`
- Updated branding from "Public Notice Portal" to "Civic Notices"

---

## Current Database State

### Notices: 5 Total (All from Nov 20, 2025)
| Name | Type | Status |
|------|------|--------|
| 14 Eaton Mews West | Planning Application | Published |
| BetZone | Gambling Premises | Published |
| Lucky Stars Bingo | Gambling Premises | Published |
| Nick Semper's | Licensing Premises (New) | Published |
| (Unnamed) | Licensing Premises (New) | Published |

### Other Stats
- **Active Councils**: 349
- **Public Representations**: 0 (deleted with old notices)
- **Active Submissions**: 13 (6 new, 3 under review, 2 changes requested, 2 accepted)
- **Firms**: 2 (Wilson & Partners, Thompson Legal)
- **Clients**: 15

---

## Updated Stats Display

The `/showcase` landing page now shows:
- ✅ 349 Active Councils
- ✅ 5 Published Notices
- ✅ 0 Public Representations
- ✅ 13 Active Submissions

---

## Notices Deleted (59 total)

### By Date:
- Nov 19: 4 notices
- Nov 18: 2 notices
- Nov 16: 1 notice
- Nov 14: 2 notices
- Nov 13: 1 notice
- Nov 12: 2 notices
- Nov 11: 3 notices
- Nov 9: 3 notices
- Nov 8: 2 notices
- Nov 7: 1 notice
- Nov 6: 1 notice
- Nov 5: 4 notices
- Nov 4: 1 notice
- Nov 3: 6 notices
- Nov 2: 7 notices
- Nov 1: 1 notice
- Oct 30: 3 notices
- Oct 29: 2 notices
- Oct 28: 5 notices
- Oct 27: 2 notices
- Oct 26: 1 notice
- Oct 25: 2 notices
- Oct 24: 2 notices
- Oct 22: 1 notice

### By Type (deleted):
- Licensing notices
- Planning applications
- Traffic Regulation Orders (TRO)
- Gambling premises
- GVOL (Goods Vehicle Operator Licenses)
- Club premises certificates

---

## Next Steps (Recommended)

Since you now have only 5 notices, you may want to:

1. **Re-seed showcase data** - Run the seed scripts again to get more diverse notices:
   ```bash
   npx tsx scripts/seed-showcase-notices.ts
   npx tsx scripts/seed-representations.ts
   npx tsx scripts/seed-workflow.ts
   ```

2. **Update video scripts** - The narration scripts reference 64 notices and 40 representations. You may want to adjust the numbers or re-seed first.

3. **Test demo flows** - Verify all 5 demo segments work with reduced dataset:
   - Resident Search (may show fewer results)
   - Public Applicant (still works)
   - Law Firm (13 submissions still available)
   - Council Officer (fewer notices to review)
   - Council Manager (analytics may look sparse)

---

## Restoration (if needed)

If you need to restore the deleted data:
```bash
# The backup is in: data/backups/old-test-notices-[timestamp].json
# You can manually restore or create a restoration script
```

---

**Clean database, fresh start! Ready for new showcase data seeding.** ✨
