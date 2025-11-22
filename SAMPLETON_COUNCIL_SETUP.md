# Sampleton Borough Council - Test Setup Complete ✅

**Date**: 2025-11-20
**Status**: Ready for testing

---

## What Was Created

### 1. Council Organization ✅
- **Name**: Sampleton Borough Council
- **Slug**: `sampleton-borough`
- **Domain**: `sampleton.gov.uk`
- **Status**: Active
- **Contact**: licensing@sampleton.gov.uk
- **Address**: Civic Centre, High Street, Sampleton, SP1 1AA

### 2. Departments ✅
Created three departments:
1. **Licensing Department** (`licensing`) - Has template
2. **Planning Department** (`planning`) - No template yet
3. **Traffic Management** (`traffic`) - No template yet

### 3. Premises Licence Template ✅
- **Template Name**: Standard Premises Licence Application
- **Notice Type**: `licensing-premises-new`
- **Department**: Licensing
- **Description**: Standard template for new premises licence applications

**Template Features:**
- ✅ Rich text formatting (bold, underline, italic)
- ✅ Professional layout with clear sections
- ✅ All required placeholders included
- ✅ Statutory warning text included

**Placeholders Used:**
- `{{APPLICANT_NAME}}` - Applicant name
- `{{APPLICANT_ADDRESS}}` - Applicant address
- `{{AUTHORITY_NAME}}` - Council name (auto-filled)
- `{{PREMISES_NAME}}` - Premises name
- `{{PREMISES_ADDRESS}}` - Full premises address
- `{{PREMISES_POSTCODE}}` - Premises postcode
- `{{LICENSABLE_ACTIVITIES}}` - Activities applied for
- `{{ACTIVITY_SCHEDULE}}` - Activity timings
- `{{OPERATING_HOURS}}` - Opening hours
- `{{DPS_NAME}}` - Designated Premises Supervisor name
- `{{INSPECTION_LOCATION}}` - Where to view application
- `{{INSPECTION_HOURS}}` - Inspection times
- `{{REPRESENTATION_ADDRESS}}` - Where to send representations
- `{{REPRESENTATION_EMAIL}}` - Email for representations
- `{{DEADLINE_DATE}}` - Representation deadline
- `{{APPLICATION_DATE}}` - Application submission date

---

## How to Test

### Test 1: View Council in Dropdown

**As Public Applicant:**
1. Navigate to: http://localhost:5173/publish/step-1
2. Select notice type: **"Premises Licence - New"**
3. Click "Next" to upload/entry step
4. Choose **"Manual Entry"** or **"Upload PDF"**
5. In the form, find the **Council/Authority dropdown**
6. **Verify**: "Sampleton Borough Council" appears in the list
7. Select it

### Test 2: Verify Template Application

**Continue from Test 1:**
1. Fill in the premises licence form:
   - **Applicant Name**: John Smith
   - **Applicant Address**: 123 High Street, Sampleton, SP1 1AA
   - **Premises Name**: The Red Lion
   - **Premises Address**: 45 Market Street, Sampleton, SP2 3BB
   - **Premises Postcode**: SP2 3BB
   - **Licensable Activities**: Sale of alcohol, Live music, Late night refreshment
   - **Activity Schedule**:
     ```
     Alcohol: Monday-Sunday 11:00-23:00
     Live Music: Friday-Saturday 20:00-23:30
     Late Night Refreshment: Friday-Saturday 23:00-02:00
     ```
   - **Operating Hours**: Monday-Sunday 10:00-00:00
   - **DPS Name**: Sarah Johnson
   - **Inspection Location**: Sampleton Borough Council, Licensing Office, Civic Centre, High Street, Sampleton, SP1 1AA
   - **Inspection Hours**: Monday-Friday 9:00 AM - 5:00 PM
   - **Representation Address**: Licensing Team, Sampleton Borough Council, Civic Centre, High Street, Sampleton, SP1 1AA
   - **Representation Email**: licensing@sampleton.gov.uk

2. Proceed to **Review step**
3. **Verify the notice text**:
   - Should use Sampleton's custom template
   - Heading should be bold: "LICENSING ACT 2003"
   - Applicant name should be bold where specified
   - All placeholders replaced correctly
   - Deadline date should be underlined
   - Formatting preserved (bold, underline, italic)

### Test 3: Council Officer Template Management

**View/Edit Template:**
1. Navigate to: http://localhost:5173/c/sampleton-borough/licensing/templates
2. **Verify**: Template "Standard Premises Licence Application" is visible
3. Click **"Edit"** on the template
4. **Verify**:
   - Template text shows with formatting
   - Bold/Underline/Italic buttons work
   - Placeholders visible as `{{TOKEN_NAME}}`
5. Make a small edit (e.g., change description)
6. Click **"Update Template"**
7. **Verify**: Update successful, no duplicate warning

### Test 4: Try Creating Duplicate Template

**From Template Management Page:**
1. Stay on: http://localhost:5173/c/sampleton-borough/licensing/templates
2. Click **"+ Create Template"**
3. Fill in:
   - **Name**: "Alternative Pub Licence"
   - **Notice Type**: Select **"Premises Licence - New"** (same as existing)
   - **Description**: "Different wording for pubs"
   - **Template Text**: Write any text
4. Click **"Create Template"**
5. **Verify**: Duplicate warning modal appears
6. Modal should show:
   - ⚠️ Warning icon
   - "Replace Existing Template?" heading
   - Details of current template: "Standard Premises Licence Application"
   - Use count: 0 times
   - "This will permanently replace the existing one"
7. Click **"Cancel"** - modal closes, template not created
8. Try again, click **"Replace Template"**
9. **Verify**: Old template deleted, new one created

---

## Database Details

### Organization ID
```
00000000-0000-0000-0000-000000000001
```

### Department IDs
- **Licensing**: `00000000-0000-0000-0001-000000000001`
- **Planning**: `00000000-0000-0000-0001-000000000002`
- **Traffic**: `00000000-0000-0000-0001-000000000003`

### Template ID
```
adcb9506-69e9-4d7c-b54f-f4785531c786
```

---

## Expected Behavior

### When Public Applicant Selects Sampleton

**Workflow:**
1. User selects "Sampleton Borough Council" from dropdown
2. System captures department ID: `00000000-0000-0000-0001-000000000001`
3. User fills in premises licence form
4. When generating notice text:
   - `renderNoticeWithTemplate()` called with:
     - `departmentId`: `00000000-0000-0000-0001-000000000001`
     - `noticeTypeId`: `licensing-premises-new`
   - Template service queries database
   - Finds "Standard Premises Licence Application" template
   - Generates tokens from form data
   - Replaces all `{{PLACEHOLDERS}}` with actual values
   - Returns formatted HTML with rich text

**Result:**
Professional, formatted notice with:
- Bold headings
- Underlined deadline
- Italic representation address
- All user-entered data in correct places
- Statutory warning text
- Sampleton Borough Council branding

---

## Template Text Preview

The template includes:

```
LICENSING ACT 2003 (Bold)
APPLICATION FOR A NEW PREMISES LICENCE (Bold)

Notice is hereby given that [Applicant Name] (Bold) of [Address] has applied to [Authority Name] (Bold) for a new premises licence...

Premises Details: (Bold)
Name: [Premises Name] (Bold)
Address: [Full Address]
Postcode: [Postcode]

Licensable Activities Applied For: (Bold)
[List of activities]

Operating Schedule: (Bold)
[Schedule details]

Opening Hours: (Bold)
[Hours]

Designated Premises Supervisor: (Bold)
[DPS Name]

Inspection of Application: (Bold)
The application may be inspected at [Location] during [Hours].

Representations: (Bold)
Any person wishing to make representations should write to [Address] (Italic) or email [Email] by [Deadline] (Bold, Underlined).

[Statutory warning about false statements]

Dated: [Application Date]
```

---

## Quick Access Links

### Public Applicant Flow
```
http://localhost:5173/publish/step-1
```

### Council Officer Template Management
```
http://localhost:5173/c/sampleton-borough/licensing/templates
```

### Council Dashboard
```
http://localhost:5173/c/sampleton-borough/licensing
```

---

## SQL Queries for Verification

### Check Council Exists
```sql
SELECT id, name, slug, status FROM organizations
WHERE slug = 'sampleton-borough';
```

### Check Department & Template
```sql
SELECT
  o.name as council,
  d.name as department,
  t.name as template,
  t.notice_type
FROM organizations o
JOIN departments d ON o.id = d.organization_id
LEFT JOIN templates t ON d.id = t.department_id
WHERE o.slug = 'sampleton-borough'
  AND d.type = 'licensing';
```

### Check Template Content
```sql
SELECT
  name,
  notice_type,
  LEFT(template_text, 200) as text_preview,
  use_count
FROM templates
WHERE department_id = '00000000-0000-0000-0001-000000000001';
```

---

## Troubleshooting

### If Sampleton Doesn't Appear in Dropdown

**Check:**
1. Organization status is 'active'
2. Organization type is 'council'
3. Browser cache cleared

**Fix:**
```sql
UPDATE organizations
SET status = 'active', type = 'council'
WHERE slug = 'sampleton-borough';
```

### If Template Doesn't Apply

**Check:**
1. Template notice_type is `licensing-premises-new` (not `premises-licence`)
2. Department ID matches
3. Template has content in `template_text` field

**Verify:**
```sql
SELECT notice_type, department_id, LENGTH(template_text) as text_length
FROM templates
WHERE department_id = '00000000-0000-0000-0001-000000000001';
```

### If Placeholders Not Replaced

**Check browser console for:**
```
[Template Service] Looking up template for: {...}
[Template Service] ✅ Using custom template: Standard Premises Licence Application
```

**Or:**
```
[Template Service] ❌ No custom template found
```

---

## Summary

✅ **Sampleton Borough Council** created and active
✅ **Licensing Department** with template configured
✅ **Template** uses correct notice type and all required placeholders
✅ **Rich text formatting** applied (bold, underline, italic)
✅ **Council appears** in public dropdown
✅ **Template matching** will work automatically

**Ready for end-to-end testing!** 🎉
