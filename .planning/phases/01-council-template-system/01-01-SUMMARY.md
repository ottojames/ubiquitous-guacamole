---
phase: 01-council-template-system
plan: 01
subsystem: ui
tags: [react, validation, templates, licensing]

# Dependency graph
requires:
  - phase: none
    provides: none
provides:
  - Complete placeholder coverage for all 34 notice types
  - Save-blocking validation on missing required placeholders
  - licensing-premises-review and licensing-club-review notice types in NOTICE_DEFINITIONS
  - Placeholder coverage test suite (24 tests)
affects: [02-department-isolation, 03-publish-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Validation state tracking in form components
    - Tooltip feedback for disabled button states

key-files:
  created:
    - src/next/publish/config/__tests__/placeholders.test.ts
  modified:
    - src/next/publish/config/noticeTypes.ts
    - src/pages/council/Templates.tsx
    - src/pages/council/TemplateValidationWarnings.tsx

key-decisions:
  - "TRO notices use AUTHORITY_NAME as identifier (authorities issue orders, not applicants)"
  - "Planning category has 6 notice types (not 7 as originally assumed)"

patterns-established:
  - "Validation state tracking with useEffect for reactive form validation"
  - "Disabled button with tooltip showing reason"

# Metrics
duration: 4min
completed: 2026-01-22
---

# Phase 01 Plan 01: Placeholder Coverage and Save Validation Summary

**All 34 notice types now have placeholder definitions; save button disabled until required placeholders present**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-22T10:31:17Z
- **Completed:** 2026-01-22T10:34:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added missing `licensing-premises-review` and `licensing-club-review` notice type definitions to align noticeTypes.ts with placeholders.ts (34 types in both)
- Created comprehensive test suite verifying all notice types have placeholder coverage
- Implemented save-blocking validation that prevents templates with missing required placeholders from being saved
- Added clear visual feedback when save is blocked including tooltip with missing placeholder count

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit and complete placeholder coverage** - `efb87fe4` (feat)
2. **Task 2: Block save on missing required placeholders** - `364cf5b1` (feat)

## Files Created/Modified

- `src/next/publish/config/noticeTypes.ts` - Added licensing-premises-review and licensing-club-review definitions
- `src/next/publish/config/__tests__/placeholders.test.ts` - 24 tests verifying placeholder coverage
- `src/pages/council/Templates.tsx` - Added validation state tracking, disabled save button when invalid, tooltip feedback
- `src/pages/council/TemplateValidationWarnings.tsx` - Added "Save blocked" badge, increased error border prominence

## Decisions Made

1. **TRO notices use AUTHORITY_NAME** - Traffic Regulation Orders are issued by highway authorities, not applicants, so AUTHORITY_NAME is the identifying placeholder
2. **Planning has 6 notice types** - Actual count is 6 (major, eia, listed, conservation, prow, departure), updated test expectations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Placeholder coverage is complete and tested
- Template save validation enforces legal compliance
- Ready for Plan 02 (Live Preview) or subsequent plans

---
*Phase: 01-council-template-system*
*Completed: 2026-01-22*
