# Council Portal UX Fixes

**Date:** 28 January 2026
**Priority:** HIGH - User-facing issues affecting council officers

---

## Tasks

### Analytics Page - Wire in real data

- [x] In `src/pages/council/Analytics.tsx`, get `department` from `useOutletContext` and query notices table filtered by `department.id` to show real total count (should show 11 for Sampleton)
- [x] In `src/pages/council/Analytics.tsx`, calculate and display real "Published" count from notices where `status = 'published'` and `department_id` matches
- [x] In `src/pages/council/Analytics.tsx`, calculate and display real representations count by joining representations with notices for this department

### Remove Drafts Tab

- [x] In `src/pages/council/CouncilLayout.tsx`, remove the "Drafts" navigation item from the sidebar menu (councils receive notices, they don't create them)

### Audit Log UX Improvements

- [ ] In `src/pages/council/AuditLog.tsx`, when `resource_type` is 'representation' or 'notice', look up the premises name from the resource_id and display it instead of just showing the truncated ID
- [ ] In `src/pages/council/AuditLog.tsx`, display the staff member name from `user_email` field instead of showing "System" - format as just the name part before @ if no display name available
- [ ] In `src/pages/council/AuditLog.tsx`, format timestamps as relative time using date-fns formatDistanceToNow (e.g., "2 hours ago") for recent entries, and friendly format for older ones
- [ ] In `src/pages/council/AuditLog.tsx`, transform action codes to plain English: `representation_note_added` → "Added internal note", `notice.created` → "Notice submitted", `notice.published` → "Notice published", `notice.status_changed` → "Status changed"
- [ ] In `src/pages/council/AuditLog.tsx`, show comment/note preview inline from `metadata.comment_preview` if available, displayed below the action in a subtle gray text
- [ ] In `src/pages/council/AuditLog.tsx`, simplify the "View Details" expanded view to show human-readable formatted info instead of raw JSON - show key fields like premises name, action taken, user, and any notes

### Settings Authority Address

- [ ] In `src/pages/council/Settings.tsx`, replace the plain text authority address input with the AddressLookup component from `@/components/AddressLookup` for proper UK address lookup
- [ ] In `src/pages/council/Settings.tsx`, ensure the authority address value is properly saved to the `council_settings` table when the form is submitted

---

## Verification Checklist

After all tasks complete, run:

```bash
npm run typecheck   # Should pass with 0 errors
npm run lint        # Should pass (warnings OK)
```

Then verify in browser:
- Analytics shows real notice counts (11 for Sampleton)
- Drafts tab is removed from council navigation
- Audit log shows premises name, staff name, friendly time, plain English actions
- Settings authority address uses address lookup component
