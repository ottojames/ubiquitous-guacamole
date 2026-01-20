# Template Management Implementation - Complete ✅

**Date**: 2025-11-20
**Status**: All features implemented and ready for testing

---

## Summary

I've successfully implemented the council officer template management system with the following key features:

1. ✅ **One template per notice type per department** (enforced)
2. ✅ **Rich text formatting** (Bold, Underline, Italic)
3. ✅ **Placeholder system** with exact field name matching
4. ✅ **Template matching** - automatically applies templates when notices are submitted
5. ✅ **Professional duplicate warning** modal
6. ✅ **Immediate template activation** upon creation

---

## What Was Implemented

### 1. Template Duplicate Protection (`src/pages/council/Templates.tsx`)

**Modified `handleSave` function:**
- Checks if a template already exists for the selected `notice_type` in the department
- If duplicate found, shows professional warning modal
- User must confirm to replace existing template
- Old template is deleted before new one is created

**Added functions:**
- `performSave()` - Handles actual save/replace logic
- `handleConfirmReplace()` - Confirms template replacement
- `handleCancelReplace()` - Cancels replacement

**Added UI:**
- Professional duplicate warning modal with amber/warning styling
- Shows existing template details (name, description, use count)
- Clear "Replace Template" and "Cancel" actions

### 2. Rich Text Editor (`src/pages/council/TemplateTextEditor.tsx`)

**Added formatting toolbar:**
- **Bold** button (Ctrl+B)
- **Underline** button (Ctrl+U)
- **Italic** button (Ctrl+I)

**Replaced textarea with contentEditable:**
- Changed from plain `<textarea>` to `<div contentEditable>`
- Stores HTML content for rich text formatting
- Updated word/character count to strip HTML before counting
- Added CSS for placeholder text on empty contentEditable div

**Updated placeholder insertion:**
- Modified `insertPlaceholder()` to work with contentEditable
- Uses `document.execCommand('insertText')` for cursor-aware insertion
- Maintains HTML formatting when inserting placeholders

### 3. Placeholder System (Already Existed!)

**Existing infrastructure (`src/next/publish/config/placeholders.ts`):**
- Comprehensive placeholder registry with 1451 lines
- Maps notice types to available placeholders
- Each placeholder has: token, label, description, example, required flag, category
- Placeholders correspond EXACTLY to form field names from schemas

**Example placeholders:**
- `APPLICANT_NAME` → `applicantName` in schema
- `PREMISES_NAME` → `premises.name` in schema
- `PREMISES_ADDRESS` → `premises.address` in schema
- `LICENSABLE_ACTIVITIES` → `LICENSABLE_ACTIVITIES` in schema

### 4. Template Matching (Already Implemented!)

**Existing integration (`src/next/publish/flow/NewPublishFlow.tsx`):**
- Line 879: `renderNoticeWithTemplate(templateNotice, departmentId, noticeTypeId)`
- Automatically looks up custom template for department + notice type
- Falls back to default template if none found

**Template Service (`src/lib/templateService.ts`):**
- `getTemplateForDepartment(departmentId, noticeTypeId)` - Fetches custom template
- `renderNoticeWithTemplate(notice, departmentId, noticeTypeId)` - Renders with template
- `generateTokensFromNotice(notice)` - Extracts placeholder values
- `renderTemplate(templateText, tokens)` - Replaces placeholders with values

**How it works:**
1. Public applicant fills out notice form
2. Selects council/department via `CouncilDepartmentSelect`
3. System captures `DEPARTMENT_ID` and `AUTHORITY_NAME`
4. When generating notice text:
   - Gets department ID from form data
   - Gets notice type ID (e.g., `licensing-premises-new`)
   - Calls template service
   - Template service checks database for custom template
   - If found: uses custom template and replaces placeholders
   - If not found: uses default built-in template
5. Notice displays with custom formatting and wording

---

## Key Constraints Enforced

### One Template Per Notice Type Per Department

**Database Level:**
- Unique constraint could be added: `(department_id, notice_type)`
- Currently enforced at application level

**Application Level:**
- `handleSave()` queries for existing template before insert
- Prevents silent overwrites
- Forces user confirmation via modal

**User Experience:**
- Clear warning: "A template for [Notice Type] already exists"
- Shows existing template details (name, use count)
- Requires explicit "Replace Template" confirmation
- Cannot have multiple templates for same notice type

---

## Testing Checklist

### Test 1: Create Template
- [ ] Navigate to council dashboard: `/c/{council-slug}/{dept-slug}/templates`
- [ ] Click "Create Template"
- [ ] Fill in:
  - Name: "Standard Pub License"
  - Notice Type: Select from dropdown (filtered by department)
  - Description: "Standard template for new pub licenses"
  - Template Text: Use formatting and placeholders
- [ ] Click B/U/I buttons - verify formatting applied
- [ ] Click "Insert Placeholder" - verify dropdown shows placeholders for selected notice type
- [ ] Insert placeholder - verify `{{TOKEN_NAME}}` inserted at cursor
- [ ] Click "Create Template"
- [ ] Verify success message
- [ ] Verify template appears in list

### Test 2: Duplicate Warning
- [ ] Try creating another template with SAME notice type
- [ ] Verify duplicate warning modal appears
- [ ] Modal shows:
  - Warning icon (amber)
  - "Replace Existing Template?" heading
  - Current template details (name, description, use count)
  - "Creating this new template will permanently replace the existing one"
  - "Cancel" and "Replace Template" buttons
- [ ] Click "Cancel" - verify modal closes, template not created
- [ ] Try again, click "Replace Template" - verify old deleted, new created

### Test 3: Edit Existing Template
- [ ] Click "Edit" on existing template
- [ ] Modify template text/name/formatting
- [ ] Click "Update Template"
- [ ] Verify NO duplicate warning (editing same template)
- [ ] Verify update successful

### Test 4: Template Matching - Westminster Council
- [ ] Navigate to public publish flow: `/publish/step-1`
- [ ] Select notice type: "Premises Licence - New"
- [ ] Proceed to step 2 (Upload Method)
- [ ] Choose "Manual Entry" or "Upload PDF"
- [ ] Fill in form data:
  - **Council**: Westminster (City of) Council
  - **Department**: Licensing
  - Applicant Name: "John Smith"
  - Premises Name: "The Red Lion"
  - Premises Address: "45 Market Street, Westminster, SW1A 1AA"
  - Licensable Activities: "Sale of alcohol, Live music"
  - Operating Hours: "Monday-Sunday 10:00-23:00"
- [ ] Proceed to Review step
- [ ] **Verify**: Notice text uses Westminster's custom template
- [ ] **Verify**: Placeholders replaced with form values
  - `{{APPLICANT_NAME}}` → "John Smith"
  - `{{PREMISES_NAME}}` → "The Red Lion"
  - `{{PREMISES_ADDRESS}}` → "45 Market Street, Westminster, SW1A 1AA"
- [ ] **Verify**: Custom formatting preserved (bold/underline/italic)

### Test 5: Template Matching - Bristol Council
- [ ] Same as Test 4, but select **Bristol Council**
- [ ] If Bristol has custom template: verify it's used
- [ ] If Bristol has NO custom template: verify default template used
- [ ] Verify placeholders still replaced correctly

### Test 6: Rich Text Formatting
- [ ] Create or edit template
- [ ] Select text in editor
- [ ] Click "B" - verify text becomes bold
- [ ] Click "U" - verify text becomes underlined
- [ ] Click "I" - verify text becomes italic
- [ ] Try combinations (bold + underline)
- [ ] Insert placeholder in middle of formatted text
- [ ] Verify formatting preserved on save
- [ ] Verify formatting rendered in final notice

### Test 7: Placeholder Dropdown
- [ ] Create template for "Premises Licence - New"
- [ ] Click "Insert Placeholder"
- [ ] Verify dropdown shows:
  - Search bar at top
  - "Required Placeholders" section (red background)
  - "Optional Placeholders" section (gray background)
  - Each placeholder shows: token, label, description, example, category badge
- [ ] Type in search: "APPLICANT"
- [ ] Verify filtered results
- [ ] Click placeholder
- [ ] Verify inserted at cursor: `{{APPLICANT_NAME}}`

---

## How to Access

### Council Officer Template Management
1. Login as council officer
2. Navigate to: `/c/{council-slug}/{dept-slug}/templates`
3. Example: `/c/bristol-council/licensing/templates`

### Westminster Test Account
- **URL**: `/c/westminster-city-of-council/licensing/templates`
- **Department**: Licensing
- **Notice Types Available**: All licensing types (premises new, variation, review, etc.)

### Bristol Test Account
- **URL**: `/c/bristol-council/licensing/templates`
- **Department**: Licensing

---

## Database Structure

### `templates` Table
```sql
- id (uuid, primary key)
- department_id (uuid, references departments)
- name (text) - Template display name
- description (text, nullable)
- notice_type (text) - e.g., 'licensing-premises-new'
- template_text (text) - HTML content with placeholders
- default_values (jsonb, nullable)
- use_count (integer, default 0)
- created_at (timestamp)
- updated_at (timestamp)
```

### Key Relationships
- Each template belongs to ONE department
- Each department can have MULTIPLE templates (one per notice type)
- Constraint: One template per (department_id, notice_type) combination

---

## Technical Details

### Placeholder Token Format
- Format: `{{TOKEN_NAME}}`
- Token names are UPPERCASE with underscores
- Examples: `{{APPLICANT_NAME}}`, `{{PREMISES_ADDRESS}}`, `{{DEADLINE_DATE}}`

### Token Generation
- `generateTokensFromNotice(notice)` in `src/next/publish/templates/tokenizer.ts`
- Extracts all relevant fields from notice object
- Flattens nested structures (e.g., `premises.name` → `PREMISES_NAME`)
- Formats dates, addresses, and other complex types

### Template Rendering
- `renderTemplate(templateText, tokens)` replaces all `{{TOKEN}}` with values
- Preserves HTML formatting (bold, underline, italic)
- Returns final notice text

---

## Files Modified

### `/src/pages/council/Templates.tsx` (Modified)
- Added state: `showDuplicateWarning`, `existingTemplate`
- Modified `handleSave()` to check for duplicates
- Added `performSave()` for actual save logic
- Added `handleConfirmReplace()` and `handleCancelReplace()`
- Added duplicate warning modal JSX

### `/src/pages/council/TemplateTextEditor.tsx` (Modified)
- Added formatting toolbar with B/U/I buttons
- Replaced `<textarea>` with `<div contentEditable>`
- Updated `insertPlaceholder()` for contentEditable
- Added `stripHtml()` for word/character count
- Added CSS for placeholder styling

### `/src/lib/templateService.ts` (Already Existed)
- No changes needed - already implements template matching

### `/src/next/publish/flow/NewPublishFlow.tsx` (Already Existed)
- No changes needed - already calls `renderNoticeWithTemplate()`

---

## What Already Existed (Discovery)

While implementing this feature, I discovered that **most of the infrastructure already existed**:

1. **Template Database Table** - Already created with proper schema
2. **Template Service** - Complete implementation in `templateService.ts`
3. **Placeholder Registry** - Comprehensive list of 100+ placeholders
4. **Token Generation** - Extracts data from notices
5. **Template Rendering** - Replaces placeholders with values
6. **Integration in Publish Flow** - Already calls template service
7. **Department Detection** - Auto-detects Westminster and other councils

**What I Added:**
- Duplicate prevention logic
- Professional warning modal
- Rich text formatting toolbar
- ContentEditable implementation

---

## Next Steps

1. **Manual Testing** - Follow testing checklist above
2. **Create Example Templates**:
   - Westminster Council: Premises License New
   - Bristol Council: Premises License New
   - Test with different formatting and placeholders
3. **Test End-to-End Flow**:
   - Create template as council officer
   - Submit notice as public applicant
   - Verify template applied correctly
4. **Video Recording** - Once tested, can be included in demo videos

---

## Notes

- Templates are **immediately active** upon creation
- No approval workflow - officer creates, it's live
- Each department manages its own templates independently
- Templates are department-scoped (Westminster Licensing ≠ Bristol Licensing)
- Rich text formatting uses standard HTML tags (`<b>`, `<u>`, `<i>`)
- Placeholders work in both formatted and unformatted text

---

**Implementation Complete** ✅
**Ready for Testing** ✅
**Dev Server Running** ✅ (http://localhost:5173)
