# Tomorrow's Meeting - Demonstration Checklist

## Pre-Meeting Setup

### ✅ Completed Today
1. **TRO Notice Types** - Fully implemented with 3 variants (permanent, temporary, experimental)
2. **Template Placeholders** - All 34 notice types now have complete placeholder registries
3. **Council Portal Templates** - Placeholder dropdown works for all notice types

### 🔄 Ready to Test

## Critical Functionality to Demonstrate

### 1. Council Portal Template System ⭐ PRIORITY

**Feature:** Council staff can create custom templates with placeholders

**Demo Steps:**
1. Navigate to council portal (`http://localhost:5173/council/{council-slug}/templates`)
2. Click "Create New Template"
3. Select a notice type (e.g., "Premises Licence — New")
4. Click "Insert Placeholder" button
5. **SHOW**: Comprehensive dropdown with categorized placeholders
   - Required placeholders (red section)
   - Optional placeholders (gray section)
   - Search functionality
   - Detailed descriptions and examples
6. Insert several placeholders (e.g., `{{APPLICANT_NAME}}`, `{{PREMISES_ADDRESS}}`, `{{DEADLINE_DATE}}`)
7. Save the template
8. **DEMONSTRATE**: Template appears in council's template list

**Success Criteria:**
- ✅ All notice types show appropriate placeholders
- ✅ Placeholders are categorized and searchable
- ✅ Required vs optional distinction is clear
- ✅ Examples help users understand each field

---

### 2. Public Notice Publishing Flow

**Feature:** Users can publish notices through the wizard

**Demo Steps:**
1. Navigate to `/next/publish/type`
2. Select a notice category (e.g., "Licensing Act 2003")
3. Select a specific notice type (e.g., "Premises Licence — New")
4. **Step 2 - Upload:** Upload a sample notice document OR use manual entry
5. **Step 3 - Details:** Fill in the form fields
   - Applicant information
   - Premises details
   - Licensing activities
   - Consultation dates
6. **Step 4 - Review:** Preview the generated notice
7. **SHOW**: Notice text is properly formatted using the template
8. Select target council from dropdown
9. Submit for publication

**Success Criteria:**
- ✅ Form fields match the selected notice type
- ✅ Validation works correctly
- ✅ Template rendering produces correct output
- ✅ Council selection dropdown works

---

### 3. Council-Specific Notice Assignment ⭐ PRIORITY

**Feature:** Published notices appear in the correct council's portal

**Demo Steps:**
1. After publishing a notice in step #2 above
2. Navigate to the target council's portal
3. **SHOW**: Notice appears in their "Incoming Notices" or "Published Notices" tab
4. **VERIFY**: Notice details match what was submitted
5. **VERIFY**: Council name is correctly associated

**Success Criteria:**
- ✅ Notices route to correct council
- ✅ Council can view submitted notice details
- ✅ Council-specific templates apply (if configured)

---

### 4. Map Visualization

**Feature:** Published notices appear on the public map

**Demo Steps:**
1. Navigate to the home page map view (`http://localhost:5173`)
2. **SHOW**: Recently published notices appear as pins on the map
3. Click on a notice pin
4. **VERIFY**: Popup shows correct notice details
   - Notice type
   - Premises name
   - Address
   - Council
   - Deadline date
5. Pan/zoom the map
6. **SHOW**: Clustering works for dense areas

**Success Criteria:**
- ✅ Notices appear on map
- ✅ Geolocation is accurate (based on postcode)
- ✅ Popups show relevant information
- ✅ Performance is acceptable with many notices

---

### 5. Confirmation Emails (If Time Permits)

**Feature:** Applicants receive confirmation after submission

**Demo Steps:**
1. Complete a notice submission (step #2 above)
2. Check configured email inbox
3. **SHOW**: Confirmation email received
4. **VERIFY**: Email contains:
   - Notice reference number
   - Submission timestamp
   - Target council
   - Next steps information

**Success Criteria:**
- ✅ Email sent successfully
- ✅ Email content is clear and professional
- ✅ All necessary information included

---

## Backup Demos (If Needed)

### TRO Notice Types
- Show the 3 TRO variants in the notice type selector
- Demonstrate conditional fields (expiry date for temporary, experimental period for experimental)
- Show the rendered template output

### Search & Filter
- Public notice search functionality
- Filter by council
- Filter by notice type
- Filter by date range
- **NEW**: Filter by status (live vs non-live) ⚠️ *Still to implement*

---

## Known Issues & Workarounds

### Database Seeding
- **Issue**: Sample data seeding script has schema mismatches
- **Workaround**: Use existing 5 notices in database, or manually create 2-3 demo notices before meeting
- **Status**: Non-critical for demo

### ZZZ_ Test Councils
- **Issue**: Cannot delete due to database connection authentication
- **Workaround**: Filter them out in UI dropdowns or ignore during demo
- **Status**: Cosmetic only

---

## Testing URLs

**Public Site:**
- Home/Map: `http://localhost:5173`
- Publish Wizard: `http://localhost:5173/next/publish/type`
- Notice Search: `http://localhost:5173/notices`

**Council Portal:** (replace `{slug}` with actual council slug)
- Dashboard: `http://localhost:5173/council/{slug}`
- Templates: `http://localhost:5173/council/{slug}/templates`
- Published Notices: `http://localhost:5173/council/{slug}/notices`

**Example Councils:**
- Bristol: `http://localhost:5173/council/bristol-city-council`
- Westminster: `http://localhost:5173/council/westminster-city-council`

---

## Pre-Meeting Checklist

### 30 Minutes Before
- [ ] Ensure dev server is running (`npm run dev`)
- [ ] Check all URLs load correctly
- [ ] Have 2-3 test notices ready to publish
- [ ] Clear browser cache if needed
- [ ] Close unnecessary browser tabs
- [ ] Have this checklist open for reference

### 5 Minutes Before
- [ ] Open key demo URLs in separate tabs
- [ ] Test microphone and screenshare
- [ ] Have sample data ready to input (applicant name, address, etc.)
- [ ] Deep breath! You've got this.

---

## Demo Script (Recommended Flow)

### Opening (2 minutes)
"Today I'm going to show you our Public Notice Portal, which streamlines the process of publishing and managing statutory notices for councils across the UK."

### Feature 1: Template System (5 minutes)
"First, let me show you how council staff can create custom notice templates..."
- Show placeholder dropdown
- Demonstrate how easy it is to build a template
- Highlight the comprehensive field options

### Feature 2: Publishing Flow (7 minutes)
"Now let's publish a notice from a solicitor's perspective..."
- Walk through the wizard
- Show the form intelligence
- Preview the final notice

### Feature 3: Council Portal (4 minutes)
"And here's what it looks like from the council's side..."
- Show incoming notice
- Demonstrate template application
- Show how councils manage their notices

### Feature 4: Public Map (3 minutes)
"Finally, here's how the public can discover notices in their area..."
- Pan around map
- Click on notice pins
- Show search/filter capabilities

### Questions (4 minutes)
"What questions do you have?"

---

## Success Metrics

**Meeting Goals:**
1. ✅ Demonstrate end-to-end notice publication workflow
2. ✅ Show council template customization capability
3. ✅ Prove notices route to correct councils
4. ✅ Display public-facing map functionality
5. ⭐ Get approval/feedback for next development phase

---

## Post-Meeting Actions

### If Demo Goes Well:
- [ ] Request list of initial pilot councils
- [ ] Clarify priority notice types for launch
- [ ] Discuss deployment timeline
- [ ] Set up follow-up technical review

### If Issues Arise:
- [ ] Document specific concerns
- [ ] Create remediation plan
- [ ] Schedule follow-up demo
- [ ] Keep calm and problem-solve

---

## Emergency Contacts & Resources

**If Server Crashes:**
```bash
cd /Users/ottoclarke/projects/ubiquitous-guacamole
pkill -9 -f "vite.*5173" && pkill -9 -f "tsx.*server"
npm run dev
```

**If Database Issues:**
- Supabase Dashboard: https://supabase.com/dashboard/project/puemqhpqxgrvrukyrfkm

**Key Files:**
- Template Editor: `src/pages/council/TemplateTextEditor.tsx`
- Placeholders: `src/next/publish/config/placeholders.ts`
- Notice Types: `src/next/publish/config/noticeTypes.ts`
- Form Blueprints: `src/next/publish/config/formBlueprints.ts`

---

**Last Updated:** 19 November 2025, 10:05 GMT
**Meeting:** Tomorrow morning
**Status:** Ready to demonstrate! 🚀
