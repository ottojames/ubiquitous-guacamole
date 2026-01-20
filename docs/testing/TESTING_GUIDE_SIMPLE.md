# TESTING GUIDE - Simple Version
**Use alongside TESTING_LOG_SIMPLE.md**
**Just test and write comments - no emojis needed!**

## Setup
```bash
VITE_DEMO_MODE=true npm run dev
```

---

## 3.1 FIX-001: Demo Authentication
**What to test:**
1. Go to http://localhost:5173/login
2. Click "Council Portal"
3. Try: licensing@westminster.gov.uk / testpass123
4. Try: solicitor@wilsonpartners.com / testpass123
5. Try: licensing@sampletonborough.gov.uk / testpass123
**Write in log:** What happened with each login

---

## 3.2 FIX-002: Address Search Single-Click
**What to test:**
1. Go to http://localhost:5173/notices
2. Type: SW1A 1AA
3. Click any address in dropdown
**Write in log:** Did you need one click or two? Did it show map or list?

---

## 3.3 FIX-003: Map View 70/30 Split
**What to test:**
Look at the map layout after searching
**Write in log:** Does it look good or crowded?

---

## 3.4 FIX-004: Remove Unnecessary Fields
**What to test:**
1. Go to http://localhost:5173/publish/step-1
2. Select "New Premises Licence"
3. Go through the form
**Write in log:** Are these fields gone: Applicant status, Trading name, Company number, DPS field?

---

## 3.5 FIX-005: Sale of Alcohol at TOP
**What to test:**
In publish wizard, look at activities section
**Write in log:** Is "Sale of Alcohol" at the top of the list?

---

## 3.6 FIX-006: Councils Dropdown
**What to test:**
In publish wizard step 3, look at council dropdown
**Write in log:** Do you see Sampletonborough and Westminster?

---

## 3.7 FIX-007: Council Settings Auto-Fill
**What to test:**
Select a council in the dropdown
**Write in log:** Did authority address and email fill in automatically?

---

## 3.8 FIX-008: ALL Notices Have Rep Forms
**What to test:**
1. View The Pilot Inn notice
2. View other notices
**Write in log:** Does every notice have a representation form?

---

## 3.9 FIX-009: No Radius Circle
**What to test:**
View any notice detail page, look at the map
**Write in log:** Is there a radius circle or just a pin?

---

## 3.10 FIX-010: Email/Password Auth
**What to test:**
Look at login page
**Write in log:** Is there a magic link option or just email/password?

---

## 3.11 FIX-011: Registration Wizard
**What to test:**
Go to http://localhost:5173/register
**Write in log:** Is there a step-by-step wizard with progress bar?

---

## 3.12 FIX-012: Default to Template
**What to test:**
Publish wizard step 2
**Write in log:** Is "Structured template" selected by default?

---

## 2.1 US-0001: Public Notice Detail
**What to test:**
1. Search postcode: S325UY
2. Set radius: 5km
3. Click "The Pilot Inn"
**Write in log:** Did the notice load properly?

---

## 2.2 US-0002: Council Notice Retrieval
**What to test:**
In council portal, click on a notice
**Write in log:** Did it open? (or can't test due to login?)

---

## 2.3 US-0003: Council Representations
**What to test:**
Council portal - go to Representations
**Write in log:** Does it load? (or can't test?)

---

## 2.4 US-0004: Council Analytics
**What to test:**
Council portal - go to Analytics
**Write in log:** Do charts load? (or can't test?)

---

## 2.5 US-0005: Firm Payment Button
**What to test:**
Firm dashboard - click "Make Payment"
**Write in log:** Does it go to billing? (or can't test?)

---

[Continue for all items...]

---

## How This Works

1. **You test** each item
2. **You write** simple comments in TESTING_LOG_SIMPLE.md
3. **You say:** "Update PRD from my testing comments"
4. **I parse** your comments and update the PRD automatically

Example comments I understand:
- "This doesn't work"
- "Had to click twice"
- "Cannot test - need login"
- "Works fine"
- "Missing the form"
- "Still shows the circle"

No emojis needed - just write what you see!