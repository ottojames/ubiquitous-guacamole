# Ralph Loop Instructions for PRD Fixes

This document explains how to use Ralph Loop to systematically fix all issues in `prd.json`.

## Quick Start

```bash
/ralph-loop "Fix all critical_user_feedback issues in prd.json. For each item:
1. Start dev server if not running (npm run dev)
2. Manually test the feature in the browser
3. If broken, fix the code
4. Re-test to verify fix works
5. Update prd.json to mark passes: true and add evidence
6. Move to next item

Work through Priority 0 items first, then Priority 1.

Output <promise>CRITICAL ISSUES FIXED</promise> when all priority 0 items in critical_user_feedback section pass manual testing." --completion-promise "CRITICAL ISSUES FIXED" --max-iterations 50
```

## How Ralph Loop Will Work

### Phase 1: Start Dev Server
Ralph will run:
```bash
npm run dev
```

And verify the site loads at `http://localhost:5173`

### Phase 2: Work Through Each PRD Item

For each item in `prd.json`, Ralph will:

#### Example: fix_public_notice_detail_page

**Read the requirement:**
```json
{
  "fix_public_notice_detail_page": {
    "description": "Public notice detail page shows 'notice not found' error when clicking from search results",
    "passes": false,
    "priority": 0,
    "requirements": "When user searches postcode S325UY, finds notices, clicks 'View Notice', the notice detail page must load successfully showing full notice details, map, and representation form",
    "test_steps": [
      "Navigate to /notices",
      "Search postcode S325UY",
      "Increase radius to 5km",
      "Click on a notice like 'The Pilot Inn'",
      "Click 'View Notice' button",
      "Verify notice details load (not 'notice not found')",
      "Verify can submit representation"
    ]
  }
}
```

**Manual test:**
1. Open browser to `http://localhost:5173/notices`
2. Type `S325UY` in postcode search
3. Click search
4. Increase radius to 5km
5. Click on a notice
6. Click "View Notice" button
7. **Observe**: Does it show "notice not found"? ❌

**If broken, diagnose:**
- Check browser console for errors
- Check network tab for failed API calls
- Look at relevant code files (probably `src/pages/NoticeDetailPage.tsx`)
- Identify the bug

**Fix the code:**
- Edit the necessary files
- Test the fix
- Verify it works

**Update PRD:**
```json
{
  "fix_public_notice_detail_page": {
    "description": "Public notice detail page shows 'notice not found' error when clicking from search results",
    "passes": true,  // ← Changed to true
    "priority": 0,
    "requirements": "...",
    "evidence": "Fixed NoticeDetailPage.tsx:45 - was using wrong ID parameter. Changed from params.id to params.noticeId. Tested with S325UY postcode search, notice now loads successfully with all details, map, and representation form visible."
  }
}
```

**Move to next item**

## PRD Structure

The PRD has sections in priority order:

1. **critical_user_feedback** (Priority 0) - YOUR ISSUES - FIX FIRST
2. **priority_fixes** (Priority 0) - Already completed
3. **phase0_audit** (Priority 1) - Basic features
4. **public_applicant_flow** (Priority 3)
5. **resident_experience** (Priority 3)
6. **firm_portal** (Priority 5)
7. **council_portal** (Priority 4)
8. **defensibility** (Priority 3-5)
9. **infrastructure** (Priority 3-5)

## Testing Credentials

### Council Portal
- **Westminster Licensing**: `licensing@westminster.gov.uk`
- **Westminster Planning**: `planning@westminster.gov.uk`

### Firm Portal
- **Wilson & Partners**: `solicitor@wilsonpartners.com`

### Public Users
- Just use the public site at `/notices` or `/publish`

## Common Files to Check

Based on your issues, Ralph will likely need to edit:

### Notice Detail Page Issue
- `src/pages/NoticeDetailPage.tsx`
- `server/routes/notices.ts`

### Council Portal Issues
- `src/pages/council/Dashboard.tsx`
- `src/pages/council/Notices.tsx`
- `src/pages/council/Representations.tsx`
- `src/pages/council/Analytics.tsx`
- `src/layouts/CouncilLayout.tsx`

### Firm Portal Issues
- `src/pages/firm/Dashboard.tsx`
- `src/pages/firm/Notices.tsx`
- `src/pages/firm/Billing.tsx`
- `src/pages/firm/Team.tsx`
- `src/pages/firm/Clients.tsx`
- `src/layouts/FirmLayout.tsx`

### Publish Wizard Issues
- `src/next/publish/flow/NewPublishFlow.tsx`
- `src/next/publish/flow/steps/PaymentStep.tsx`
- `server/routes/notices.ts` (for actual notice creation)

### Template System Issues
- `src/pages/council/Templates.tsx`
- `src/components/council/TemplateTextEditor.tsx`
- Template matching logic in notice creation

## Progress Tracking

Ralph can check progress at any time:

```bash
npx tsx scripts/audit-prd.ts
```

This generates `PROGRESS.md` showing:
- How many items are passing
- Which items are failing
- Priority breakdown

## Success Criteria

Ralph Loop will output `<promise>CRITICAL ISSUES FIXED</promise>` when:

1. All Priority 0 items in `critical_user_feedback` have `"passes": true`
2. Each item has evidence of manual testing
3. Dev server runs without errors
4. All manual tests pass

## Iteration Strategy

Ralph will work in this order:

### Iteration 1-10: Critical Notice Loading Issues
- fix_public_notice_detail_page
- fix_council_notice_retrieval
- fix_council_representations_loading
- fix_council_analytics_loading

### Iteration 11-20: Firm Portal Basic Functions
- fix_firm_payment_button
- fix_firm_view_client_notices
- implement_firm_notices_page
- implement_firm_billing_page
- fix_firm_team_page_loading

### Iteration 21-30: Settings & Filters
- fix_firm_settings_notice_filter
- improve_department_switching_ux

### Iteration 31-40: Wizard & Templates
- fix_wizard_step4_upload
- verify_templates_work_with_matching
- ensure_all_templates_created

### Iteration 41-50: Research & Polish
- research_department_dashboards
- fix_owner_label_in_firm_portal
- All Priority 1 items

## Debug Tips for Ralph

When testing manually:

1. **Always check browser console** - errors show root cause
2. **Use Network tab** - see which API calls fail
3. **Check React DevTools** - see component state
4. **Look at database** - sometimes data is wrong, not code
5. **Test as different user types** - council vs firm vs public

## Running Ralph Loop

Once you're ready:

```bash
/ralph-loop "Work through prd.json critical_user_feedback section systematically. For each failing item (passes: false):

1. Read the test_steps
2. Start dev server (npm run dev) if not running
3. Manually test in browser following test_steps exactly
4. If test passes, update prd.json with passes: true and evidence
5. If test fails:
   - Diagnose the issue (check console, network, code)
   - Fix the relevant code files
   - Re-test until it passes
   - Update prd.json with passes: true and evidence of fix
6. Move to next failing item

Focus on Priority 0 items first. Work methodically through each one.

Output <promise>CRITICAL ISSUES FIXED</promise> when all critical_user_feedback items have passes: true with evidence." --completion-promise "CRITICAL ISSUES FIXED" --max-iterations 50
```

## After Ralph Finishes

1. Check `PROGRESS.md` for final status
2. Run `npx tsx scripts/audit-prd.ts` to verify
3. Manually spot-check a few critical items
4. If any issues remain, run Ralph Loop again with refined prompt

## Tips for Better Results

1. **Be specific in PRD requirements** - The clearer the test steps, the better Ralph can verify
2. **Include actual test data** - Postcodes, addresses, names that exist in your DB
3. **Set reasonable max-iterations** - 50 iterations should be enough for critical issues
4. **Let Ralph self-correct** - Each iteration Ralph sees previous work and can improve
5. **Check progress periodically** - Look at `prd.json` changes to see what Ralph has fixed

## What Success Looks Like

When Ralph Loop completes successfully:

- ✅ All Priority 0 items have `"passes": true`
- ✅ Each item has `"evidence"` field with fix details
- ✅ You can manually test site and everything works
- ✅ `PROGRESS.md` shows 100% of critical items passing
- ✅ Ralph outputs `<promise>CRITICAL ISSUES FIXED</promise>`

## If Ralph Gets Stuck

If Ralph keeps failing same test:

1. Check if test steps are clear enough
2. Check if test data exists (does postcode S325UY have notices?)
3. Maybe the issue is deeper (database, API, not just UI)
4. Simplify that PRD item's requirements
5. Use `/cancel-ralph` and manually fix that one item, then restart

Good luck! Ralph Loop is designed for exactly this kind of systematic bug fixing.
