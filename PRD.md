# Council Portal - Team, Audit Log & Analytics Fixes

**Date:** 28 January 2026
**Priority:** HIGH - User-facing issues affecting council officers

---

## Tasks

### Team Tab - Functionality & Domain Validation

- [x] In `src/pages/council/Team.tsx`, verify the invite flow works end-to-end by checking the API endpoint at `/api/departments/:id/team/invite` exists and returns proper responses
- [x] In `src/pages/council/Team.tsx`, add domain validation for invites - extract the council's domain from the organization settings (e.g., `westminster.gov.uk`) and only allow invitations to emails ending with that domain
- [x] In `src/pages/council/Team.tsx`, display a clear error message when someone tries to invite an email that doesn't match the council's domain (e.g., "Invitations can only be sent to @westminster.gov.uk addresses")
- [x] In `src/pages/council/Team.tsx`, show actual user email addresses instead of truncated user IDs in the team members list (query user emails from the API or database)

### Audit Log - Immediate Visibility Improvements

- [ ] In `src/pages/council/AuditLog.tsx`, show the exact timestamp (e.g., "28 Jan 2026, 14:32") alongside the relative time ("2 hours ago") - display both so users can see the precise time at a glance
- [ ] In `src/pages/council/AuditLog.tsx`, make the notice/premises name immediately visible in the main row (not hidden in "View Details") - display prominently as the first piece of information
- [ ] In `src/pages/council/AuditLog.tsx`, make the user name immediately visible in the main row with clear formatting (not requiring expansion to see who did what)
- [ ] In `src/pages/council/AuditLog.tsx`, restructure each audit entry to show: [User Name] • [Notice/Premises] • [Action] • [Time] all on the main visible row, with any additional notes/comments shown below in subtle gray text

### Analytics Tab - Remove Unused Sections

- [ ] In `src/pages/council/Analytics.tsx`, remove the "Cost Savings Calculator" section entirely from the Overview tab (lines ~442-494) - it's not useful for councils
- [ ] In `src/pages/council/Analytics.tsx`, remove the "Compliance" tab from the tabs array and its corresponding content section (the compliance tab just shows placeholder sample data)
- [ ] In `src/pages/council/Analytics.tsx`, fix the Audit Log tab in Analytics - it shows "Complete Audit Log" header but no actual entries; either wire it to show real audit data or link to the dedicated Audit Log page instead

### Council Portal UI/UX Review

- [ ] Review the overall council portal UI/UX and identify any areas that look "boring" or could be improved - focus on the Team tab, Dashboard, and navigation
- [ ] Ensure all interactive elements (buttons, links, cards) have proper hover states and visual feedback

---

## Verification Checklist

After all tasks complete, run:

```bash
npm run typecheck   # Should pass with 0 errors
npm run lint        # Should pass (warnings OK)
```

Then verify in browser:
- Team tab shows real email addresses, not truncated user IDs
- Inviting an email with wrong domain shows clear error
- Audit log entries show user, notice, action, and exact time all at a glance
- Analytics has no Cost Savings or Compliance sections
- Analytics Audit tab either shows real data or redirects appropriately
