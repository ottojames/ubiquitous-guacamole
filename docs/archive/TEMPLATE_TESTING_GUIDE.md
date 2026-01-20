# Template Management System - Quick Testing Guide

## Prerequisites

1. Database migrations applied:
   - `20251117000001_template_text_support.sql`
   - `20251117000002_bristol_demo_template.sql`

2. Development server running:
   ```bash
   npm run dev
   ```

## Test 1: View Bristol Templates (2 minutes)

### Steps:
1. Navigate to: `http://localhost:5173/c/bristol-city-council/licensing/templates`
2. Log in as: `licensing@bristol.gov.uk` / `sample123`

### Expected Results:
- See 2 templates:
  - "Bristol Standard Premises Licence Notice"
  - "Bristol Premises Licence Variation Notice"
- Both show "Used 0 times"
- Both have descriptions
- Can click "Edit" to view template details

## Test 2: Create New Template (5 minutes)

### Steps:
1. On Templates page, click "+ Create Template"
2. Fill in:
   - Name: "My Test Template"
   - Notice Type: "New Premises Licence"
   - Description: "Testing template creation"
3. Scroll to "Template Text" section
4. Click "Insert Placeholder" button
5. Search for "APPLICANT"
6. Click on "APPLICANT_NAME" from the dropdown
7. Verify `{{APPLICANT_NAME}}` inserted into textarea
8. Type some text: "Application by {{APPLICANT_NAME}}"
9. Check validation warnings below

### Expected Results:
- Placeholder dropdown shows grouped items (Required/Optional)
- Each placeholder shows:
  - Token in monospace font
  - Category badge (colored)
  - Label and description
  - Example value
- Clicking placeholder inserts it at cursor position
- Validation shows RED error: "Missing required placeholders"
- Lists missing tokens (PREMISES_NAME, PREMISES_ADDRESS, etc.)

### Next Steps:
10. Click "Insert Placeholder" again
11. Add these required placeholders:
    - PREMISES_NAME
    - PREMISES_ADDRESS
    - LICENSABLE_ACTIVITIES
    - AUTHORITY_NAME
    - DEADLINE_DATE
    - REPRESENTATION_ADDRESS
12. Type text around them to make a complete template

### Expected Results:
- As you add each placeholder, validation warnings update
- When all required placeholders added, see GREEN success: "Template Validated"
- Save button becomes enabled

## Test 3: Template Validation Warnings (3 minutes)

### Steps:
1. In your template from Test 2, remove one required placeholder
2. Observe validation warning appear
3. Add it back
4. Remove the text "Licensing Act 2003" (if present)
5. Observe YELLOW warning about statutory clause
6. Add "Licensing Act 2003" somewhere in template
7. Observe warning disappear

### Expected Results:
- Real-time validation updates as you type
- Red errors for missing required fields
- Yellow warnings for best practice issues
- Green success when fully validated

## Test 4: Use Custom Template in Publish Flow (7 minutes)

### Steps:
1. Navigate to: `http://localhost:5173/publish/new`
2. Select notice type: "New Premises Licence"
3. Click "Continue"
4. Choose upload method: "Build from Scratch" (or "Upload Document")
5. Fill in form with test data:
   - Applicant Name: "Test Applicant Ltd"
   - Premises Name: "The Test Pub"
   - Premises Address: "123 Test Street, Bristol, BS1 1AA"
   - Licensable Activities: Select "Sale of Alcohol"
   - Application Date: Today's date
   - Deadline Date: 28 days from now
   - Authority: Select "Bristol City Council"
6. Progress to Review/Confirm step
7. Look at generated notice text

### Expected Results:
- Notice text uses Bristol's custom template format
- All placeholders replaced with your test data
- No `{{MISSING}}` or `{{TOKEN}}` visible
- Text matches Bristol template structure
- Check browser console for log:
  ```
  [Template Service] Using custom template: Bristol Standard Premises Licence Notice
  [NewPublishFlow] Rendering notice with custom template service
  ```

### Verification:
Open browser DevTools Console (F12), look for template logs

## Test 5: Fallback to Default Template (3 minutes)

### Steps:
1. In Templates.tsx modal, set notice type to something without custom template (e.g., "Planning Application")
2. Progress through publish flow with Planning notice
3. Check generated text

### Expected Results:
- Uses default template (not Bristol custom template)
- Console shows:
  ```
  [Template Service] Using default template for: planning
  ```

## Test 6: Search Placeholders (2 minutes)

### Steps:
1. Edit any template
2. Click "Insert Placeholder"
3. Type "address" in search box

### Expected Results:
- Dropdown filters to show only address-related placeholders:
  - APPLICANT_ADDRESS
  - PREMISES_ADDRESS
  - REPRESENTATION_ADDRESS
- Case-insensitive search
- Searches in token, label, and description

## Test 7: Character Count (1 minute)

### Steps:
1. Edit any template
2. Type text in template textarea
3. Look at top right of editor

### Expected Results:
- Shows word count and character count
- Updates in real-time as you type

## Test 8: Database Validation (5 minutes)

### Using Supabase Dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Run query:
   ```sql
   SELECT * FROM get_template_validation_report();
   ```

### Expected Results:
- Returns all templates with validation status
- Shows: template_name, notice_type, is_validated, placeholder counts, warnings

3. Check specific template:
   ```sql
   SELECT
     name,
     is_validated,
     placeholders,
     required_placeholders,
     validation_warnings
   FROM templates
   WHERE name = 'Bristol Standard Premises Licence Notice';
   ```

### Expected Results:
- `is_validated` = TRUE
- `placeholders` array contains tokens found in template
- `required_placeholders` array has tokens for notice type
- `validation_warnings` array is empty or has only informational items

4. Test RPC function:
   ```sql
   SELECT * FROM get_active_template(
     '<bristol-dept-id>',
     'licensing-premises-new'
   );
   ```
   (Replace `<bristol-dept-id>` with actual UUID from departments table)

### Expected Results:
- Returns Bristol template with all fields
- template_text field contains full template

## Common Issues & Solutions

### Issue: "Cannot find placeholder"
**Cause**: Notice type in database doesn't match placeholder registry
**Fix**: Ensure notice_type uses new IDs (e.g., `licensing-premises-new` not `premises`)

### Issue: Template not being used in publish flow
**Cause**: DepartmentId not correctly extracted
**Fix**: Check console logs, verify `selectedCouncil?.id` is valid UUID

### Issue: Validation trigger not running
**Check**:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'templates_validate_placeholders';
```
Should return 1 row with `tgenabled = 'O'` (enabled)

### Issue: Placeholders showing as {{MISSING}}
**Cause**: Token generator not mapping correct fields
**Debug**: Check console for token values, verify NoticeBase structure

## Performance Verification

### Expected Performance:
- Template creation/edit: Instant UI updates
- Placeholder insertion: < 100ms
- Validation: Real-time (< 50ms)
- Template fetch: < 200ms (first time), < 50ms (cached)
- Notice rendering: < 100ms

### Stress Test:
1. Create template with 50+ placeholders
2. Insert/remove placeholders rapidly
3. Verify no lag in validation updates

## Accessibility Testing

### Keyboard Navigation:
1. Tab through form fields
2. Use Enter to select placeholders
3. Use Escape to close dropdown

### Screen Reader:
1. Verify labels are read correctly
2. Placeholder descriptions are announced
3. Validation warnings are announced

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Mobile Responsiveness

Test on:
- [ ] Mobile viewport (375px)
- [ ] Tablet viewport (768px)
- [ ] Desktop viewport (1024px+)

## Sign-Off Checklist

Before demo:
- [ ] All 8 tests pass
- [ ] Bristol templates exist in database
- [ ] Console logs show correct template usage
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Validation shows correct states (red/yellow/green)
- [ ] Placeholders correctly replaced in publish flow
- [ ] Demo account credentials work
- [ ] Database migrations applied
- [ ] Development server runs without errors

## Demo Environment Setup

Before Thursday demo:
1. Apply migrations to demo database
2. Create Bristol test templates (via migration)
3. Test publish flow end-to-end
4. Clear browser cache
5. Prepare backup demo account
6. Have fallback slides ready (if live demo fails)

---

**Total Test Time**: ~30 minutes
**Critical Tests**: 1, 2, 4 (must pass for demo)
**Optional Tests**: 6, 7, 8 (nice to have)
