# Collapsible Categories - Testing Checklist

## Manual Testing Steps

### Initial State
- [ ] Navigate to `/publish/step-1` (or the wizard start)
- [ ] Verify all 5 categories are visible
- [ ] Confirm categories show icons: 📄 🎲 🚛 🏗️ ⚖️
- [ ] Check count badges display (e.g., "6 types")
- [ ] Verify all categories are collapsed (chevrons pointing down)
- [ ] No notice type cards should be visible initially

### Expand/Collapse Functionality
- [ ] Click "Licensing Act 2003" header
- [ ] Verify it expands showing 6 notice types
- [ ] Confirm chevron rotates to point up
- [ ] Check count badge changes from gray to blue
- [ ] Click header again to collapse
- [ ] Verify smooth animation
- [ ] Test with all 5 categories

### Multiple Categories Open
- [ ] Expand "Licensing Act 2003"
- [ ] Expand "Planning (Press Notices)" while Licensing stays open
- [ ] Verify both remain expanded simultaneously
- [ ] Collapse one, verify the other stays open

### Search Functionality
- [ ] Type "premises" in search box
- [ ] Verify Licensing category auto-expands
- [ ] Check filtered results show only matching notices
- [ ] Verify other categories are hidden
- [ ] Clear search (X button or ESC)
- [ ] Confirm categories return to previous state

### Selection Behavior
- [ ] Expand Licensing category
- [ ] Click "Premises Licence — New"
- [ ] Verify selection pill appears at top
- [ ] Navigate away and back to step 1
- [ ] Confirm Licensing category auto-opens with selection

### Keyboard Navigation
- [ ] Tab to first category header
- [ ] Press Enter or Space to expand
- [ ] Tab through expanded notice type cards
- [ ] Press Tab to next category header
- [ ] Verify focus visible rings appear
- [ ] Test ESC to clear search

### Accessibility
- [ ] Enable screen reader (VoiceOver on Mac: Cmd+F5)
- [ ] Navigate categories, verify announcements
- [ ] Check "expanded"/"collapsed" states are announced
- [ ] Verify count badges are read
- [ ] Test with keyboard only (no mouse)

### Responsive Design
- [ ] Resize browser to mobile (375px width)
- [ ] Verify layout remains usable
- [ ] Test expand/collapse on mobile
- [ ] Check touch targets are adequate
- [ ] Test on tablet (768px width)

### Practice Area Filtering
- [ ] If practice area filtering is active:
- [ ] Verify filtered categories still show icons/counts
- [ ] Confirm collapsible behavior works
- [ ] Check info banner displays correctly

### Performance
- [ ] Open/close categories rapidly
- [ ] Verify no lag or jank
- [ ] Type quickly in search
- [ ] Check smooth animations
- [ ] Monitor console for errors

### Browser Compatibility
Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Automated Tests

Run: `npm test -- NoticeTypeStep`

Expected: All 8 tests passing
- [x] Renders all category sections with icons and counts
- [x] Categories are collapsed by default
- [x] Expands category when header is clicked
- [x] Shows search input
- [x] Auto-expands categories when searching
- [x] Shows category icons
- [x] Opens category containing selected notice type
- [x] Allows multiple categories to be expanded simultaneously

## Known Issues / Edge Cases

None identified. Implementation is stable.

## Rollback Plan

If issues arise:
1. Revert `DisclosureSection.tsx` changes
2. Revert `NoticeTypeStep.tsx` changes
3. Remove test file
4. Component will return to "all open" state

## Sign-off

- [ ] Developer tested locally
- [ ] Code review completed
- [ ] All automated tests passing
- [ ] Manual testing checklist completed
- [ ] Accessibility verified
- [ ] Performance acceptable
- [ ] Ready for staging/production

---

**Test Date:** _______________
**Tested By:** _______________
**Browser/OS:** _______________
**Result:** PASS / FAIL / NEEDS WORK
**Notes:** _______________
