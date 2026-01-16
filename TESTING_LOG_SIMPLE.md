# TESTING LOG - Simple Comments
**Date:** 2026-01-16
**Tester:** Otto
**Instructions:** Just write what happened in the Comments section. I'll parse it and update the PRD.

---

## 3.1 FIX-001: Demo Authentication
**Test:** Login with all three accounts
**Comments:**
Tried Westminster - licensing@westminster.gov.uk / testpass123 - got error "Invalid credentials"
Tried Wilson Partners -
Tried Sampletonborough -

---

## 3.2 FIX-002: Address Search Single-Click
**Test:** Type SW1A 1AA, click address once
**Comments:**
Typed SW1A 1AA, dropdown appeared, clicked Green Park - had to click twice not once. After clicking it went to list view not map view. This is not fixed.

---

## 3.3 FIX-003: Map View 70/30 Split
**Test:** Check if map layout looks good
**Comments:**
Map is right size but the right side pillbox is crowded and squeezed. List of notices is tiny and can't scroll properly. UI does not look great. Needs UX specialist to fix.

---

## 3.4 FIX-004: Remove Unnecessary Fields
**Test:** Check publish wizard for removed fields
**Comments:** Okay, I'm going through 3.4. Navigated to publish step 1, selected new premises licence, and applicant address field is still there. That still needs to be removed. The company number optional is still there. That needs to be removed. Activity and hours, sale of alcohol on and off the premises, is still not above sale of alcohol off the premises or sale of alcohol on the premises. Sale of alcohol on and off the premises must be above sale of alcohol on the premises. That needs to be changed. When I go on to licensing authority, I type in sample, I click Sampleton Borough Council from the drop-down, and then it doesn't fill in, or it does fill in, but then I need to click the drop-down again. So that needs to be fixed. Also, the authority address has not been automatically filled once I've clicked the drop-down licensing authority name, which should happen. Also, the authority email has not been automatically filled. That should happen when I click the licensing authority name drop-down. Also, the online register URL has also not been automatically filled. That should be filled when I click the licensing authority name drop-down.


---

## 3.5 FIX-005: Sale of Alcohol at TOP
**Test:** Check activities section order
**Comments:** no , this failed


---

## 3.6 FIX-006: Councils Dropdown
**Test:** Check councils appear in dropdown
**Comments:** yes, but have to click twice - correct result is to only click the dropdown council once. 


---

## 3.7 FIX-007: Council Settings Auto-Fill
**Test:** Select council, check if fields auto-populate
**Comments:** no, they do not autofill, fail.


---

## 3.8 FIX-008: ALL Notices Have Rep Forms
**Test:** Check every notice has representation form
**Comments:**
Failed. The Pilot Inn does not have a representation form but other notices do. This needs to be consistent - every notice must have the form, non-negotiable.

---

## 3.9 FIX-009: No Radius Circle
**Test:** Check notice detail map
**Comments:**
The radius circle on the map is unnecessary and should be removed. Just need one red pin.

---

## 3.10 FIX-010: Email/Password Auth
**Test:** Check login page for magic link removal
**Comments:** still not removed. Fill.


---

## 3.11 FIX-011: Registration Wizard
**Test:** Go to /register, check for wizard
**Comments:** clicked sign up for free on the login page and redirected me to the homepage, fail.


---

## 3.12 FIX-012: Default to Template
**Test:** Check step 2 default selection
**Comments:** success.


---

## 2.1 US-0001: Public Notice Detail
**Test:** Search S325UY, click Pilot Inn
**Comments:** failed, no representation form on this notice. Needs to be a representation section CTA on every single notice on our site.


---

## 2.2 US-0002: Council Notice Retrieval
**Test:** Council portal - click notice
**Comments:**
Cannot test - need working Westminster login first

---

## 2.3 US-0003: Council Representations
**Test:** Council portal - representations page
**Comments:**
Cannot test - need working Westminster login first

---

## 2.4 US-0004: Council Analytics
**Test:** Council portal - analytics page
**Comments:**
Cannot test - need working Westminster login first

---

## 2.5 US-0005: Firm Payment Button
**Test:** Firm dashboard - make payment button
**Comments:**
Cannot test - need working Wilson Partners login first

---

## 2.6 US-0006: Firm Client Notices
**Test:** Firm clients - view notices button
**Comments:**
Cannot test - need working Wilson Partners login first

---

## 2.7 US-0007: Firm Notices Page
**Test:** Firm notices page functionality
**Comments:**
Cannot test - need working Wilson Partners login first

---

## 2.8 US-0008: Firm Billing Page
**Test:** Firm billing page
**Comments:**
Cannot test - need working Wilson Partners login first

---

## 2.9 US-0009: Firm Team Page
**Test:** Firm team page loads
**Comments:**
Cannot test - need working Wilson Partners login first

---

## 2.10 US-0010: Firm Settings Filter
**Test:** Firm settings notice type filter
**Comments:**
Cannot test - need working Wilson Partners login first

---

## 2.11 US-0011: Wizard Step 4 Submit
**Test:** Complete wizard and submit
**Comments:**


---

## 2.12 US-0012: Department Switching
**Test:** Switch between departments
**Comments:**
Cannot test - need working council login first

---

## 2.13 US-0013: Department Dashboards
**Test:** Check department-specific dashboards
**Comments:**
Cannot test - need working council login first

---

## 2.14 US-0014: Template Matching
**Test:** Check template placeholders work
**Comments:** cannot check as council dropdown not working properly. Fail.


---

## 2.15 US-0015: All Templates Created
**Test:** Verify templates exist
**Comments:** cannot verify as council dropdown not working properly. Fail.


---

## 2.16 US-0025: Remove Demo Logins Council
**Test:** Check council login page
**Comments:** medium, demo amber box gone but cannot login get the error: Password must be at least 8 characters with uppercase, lowercase, number, and special character. Fail.


---

## 2.17 US-0026: Remove Demo Logins Firm
**Test:** Check firm login page
**Comments:** demo removed but no login details to check login.


---

## 2.18 US-0027: Safe Demo Access
**Test:** Check demo mode with env var
**Comments:** fine, success.


---

## 2.19 US-0028: Wizard Submit Button
**Test:** Check submit button loading state
**Comments:** cannot proceed as step 2 not working properly due to above comments. Please list them e.g council dropdown and removal of fields etc...


---

## 2.20 US-0029: Submit Error Handling
**Test:** Check error messages
**Comments:** cannot approve as step 2 not working properly due to above comments. Please list them e.g council dropdown and removal of fields etc... fail


---

## 2.21 US-0108: One Click Address
**Test:** Already tested in 3.2
**Comments:**
See 3.2 - still needs double-click

---

## 2.22 US-0109: Radius Filters
**Test:** Check radius buttons visible
**Comments:**
Yes radius filters are visible at top - 500m, 1km, 2km, 5km

---

## 2.23 US-0117: Blue Notice PDF
**Test:** Download blue notice PDF
**Comments:** cacannot approve as cannot upload a notice yet due to step 2.


---

## 2.24 US-0118: Blue Notice Templates
**Test:** Check different notice type templates
**Comments:** cacannot approve as cannot upload a notice yet due to step 2.


---

## 2.25 US-0119: Blue Notice QR Code
**Test:** Check QR code on PDF
**Comments:** cacannot approve as cannot upload a notice yet due to step 2.


---

## 2.26 US-0120: Blue Notice Instructions
**Test:** Check display instructions on PDF
**Comments:** cacannot approve as cannot upload a notice yet due to step 2.


---

## 2.27 US-0125: Licensing Dashboard
**Test:** Check licensing-specific widgets
**Comments:**
Cannot test - need working council login first

---

## 2.28 US-0126: Assign Representation
**Test:** Assign rep to officer
**Comments:**
Cannot test - need working council login first

---

## 2.29 US-0127: Mark Rep Reviewed
**Test:** Mark representation as reviewed
**Comments:**
Cannot test - need working council login first

---

## 2.30 US-0128: Internal Notes
**Test:** Add internal notes to rep
**Comments:**
Cannot test - need working council login first

---

## 2.31 US-0129: Export for Idox
**Test:** Export reps as CSV
**Comments:**
Cannot test - need working council login first

---

## 2.32 US-0145: Firm Registration Wizard
**Test:** Check /register/firm
**Comments:** clicked sign up for free on the login page and redirected me to the homepage, fail.


---

## 2.33 US-0146: Practice Area Selection
**Test:** Check practice areas in settings
**Comments:** cannot approve as cannot access dashboard due to not being able to login


---

## 2.34 US-0148: Quick Publish
**Test:** Quick publish for repeat clients
**Comments:**
Cannot test - need working firm login first

---

## 2.35 US-0149: Client Management
**Test:** Firm clients page
**Comments:**
Cannot test - need working firm login first

---

## 2.36 US-0150: Live Rep Feed
**Test:** Recent representations widget
**Comments:**
Cannot test - need working firm login first

---

## 2.37 US-0151: Consultation Countdown
**Test:** Check countdown display
**Comments:**
Cannot test - need working firm login first

---

## HOW TO UPDATE PRD FROM THIS LOG

Just say: "Update PRD from my testing comments"

I'll read your comments and:
- If you wrote "cannot test" or "need login" → Mark as BLOCKED
- If you wrote "not fixed" or "still broken" → Mark as FAILED
- If you wrote "missing" or "does not work" → Mark as FAILED
- If you wrote "works" or no issues → Mark as PASSED
- If you wrote "partially works" → Mark as PARTIAL