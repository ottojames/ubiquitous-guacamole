# Notice Content Display - Fix Summary

## Issue
User reported: "we cannot see the actual notice on the notice page when clicked?"

The notice detail page (`/notices/:id`) was only showing metadata (premises name, address, dates, etc.) but not displaying the actual formal notice text that would appear in a newspaper or gazette.

## Root Cause
The database `notices` table had a `description` field that was `null` for all notices. The API was returning this null value, so the frontend had nothing to display.

## Solution

### Backend Changes (`server/routes/notices.ts`)

1. **Created `generateNoticeText()` function** (lines 285-359)
   - Generates formatted notice text from notice data
   - Prioritizes using detailed token data from `extras.tokens` when available
   - Falls back to extracted fields from premises, applicant, licensing objects
   - Formats text like an official gazette notice

2. **Created `formatDateForNotice()` helper** (lines 361-371)
   - Formats dates in British format (e.g., "18 November 2025")

3. **Updated GET `/api/notices/:id` endpoint** (line 928)
   - Changed: `description: row.description || generateNoticeText(row)`
   - Now generates notice text on-the-fly if database description is null

### Frontend Changes (`src/pages/NoticeDetailPage.tsx`)

1. **Enhanced "Full Notice" section** (lines 411-426)
   - Changed title from "Description" to "Full Notice"
   - Added FileText icon for visual prominence
   - Styled with blue gradient background to make it stand out
   - Added inner white card with border for the notice text
   - Used `<pre>` tag with proper formatting to preserve line breaks and spacing
   - Applied better typography with `whitespace-pre-wrap` and readable font

## Generated Notice Format

The generated notice includes:

```
NOTICE OF APPLICATION

[Notice Type]

PREMISES
[Premises Name]
[Full Address]

APPLICANT
[Applicant Name]
[Applicant Address]

LICENSABLE ACTIVITIES
• [Activity 1]
• [Activity 2]

OPENING HOURS
[Opening hours details]

REPRESENTATIONS
Representations concerning this application must be made in writing
to the licensing authority by [Deadline Date].

Representations should be sent to:
[Authority Address]

The register and application records may be inspected at the
licensing authority during normal office hours.

Licensing Authority: [Authority Name]

Published in [Newspaper Name]
```

## Example Notice

```
NOTICE OF APPLICATION

Premises Licence — New

PREMISES
Sample Venue
10 High Street, Sampleton SW1A 1AA

APPLICANT
Sample Bars Ltd
1 Demo Road, Sampleton SW1A 1AA

LICENSABLE ACTIVITIES
• Sale of alcohol (on the premises)
• Live music

OPENING HOURS
Daily 10:00–00:00

REPRESENTATIONS
Representations concerning this application must be made in writing
to the licensing authority by 18 November 2025.

Representations should be sent to:
Civic Centre, Sampleton SW1A 2BB

The register and application records may be inspected at the
licensing authority during normal office hours.

Licensing Authority: Sample Borough Council
```

## Technical Details

### Data Source Priority
1. First tries `extras.tokens` (detailed token data from form submission)
2. Falls back to `premises`, `applicant`, `licensing` objects
3. Uses extraction helpers like `extractPremisesName()`, `extractPremisesAddress()`, etc.

### Token Fields Used
- `NOTICE_TYPE` - Notice type display name
- `PREMISES_NAME` - Premises name
- `PREMISES_ADDRESS` - Full formatted address
- `APPLICANT_NAME` - Applicant name
- `APPLICANT_ADDRESS` - Applicant address
- `LICENSABLE_ACTIVITIES` - Comma/semicolon-separated activities
- `OPENING_HOURS` - Opening hours text
- `AUTHORITY_NAME` - Licensing authority name
- `AUTHORITY_ADDRESS` / `REPRESENTATION_ADDRESS` - Where to send representations
- `PUBLICATION_NEWSPAPER` - Newspaper name

## Files Modified

1. `server/routes/notices.ts`
   - Added `generateNoticeText()` function
   - Added `formatDateForNotice()` helper
   - Updated GET `/notices/:id` endpoint

2. `src/pages/NoticeDetailPage.tsx`
   - Enhanced "Full Notice" section UI
   - Better formatting for notice text display

## Testing

```bash
# Test API endpoint
curl -s "http://localhost:5174/api/notices/77c49712-c0d6-4178-ad26-47069a485ecc" | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('description'))"
```

## Benefits

1. ✅ Users can now see the complete formal notice text
2. ✅ Notice displays in a professional gazette-style format
3. ✅ All key information is presented clearly
4. ✅ Works with existing notices (generates text on-the-fly)
5. ✅ No database migration needed
6. ✅ Fallback logic ensures it works even with partial data

## Status

✅ **Complete** - Notice content is now fully visible on detail pages
