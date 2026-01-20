# TESTING GUIDE - Quick Reference
**Open this alongside TESTING_LOG_QUICK.md**

## Setup
```bash
VITE_DEMO_MODE=true npm run dev
# Frontend: http://localhost:5173
# API: http://localhost:5174/api/health
```

---

## 3.1 FIX-001: Demo Authentication
**Test ALL three accounts:**
1. Go to http://localhost:5173/login
2. Click "Council Portal"
3. Try: licensing@westminster.gov.uk / testpass123
4. Should redirect to: /c/westminster/licensing/dashboard

---

## 3.2 FIX-002: Address Search Single-Click
1. Go to http://localhost:5173/notices
2. Type: SW1A 1AA
3. Click address ONCE
4. ✅ Map loads immediately
5. ✅ Defaults to MAP view

---

## 3.3 FIX-003: Map View 70/30 Split
1. After search, check layout:
2. ✅ Map = 70% width
3. ✅ List = 30% width
4. ✅ Not crowded/squeezed

---

## 3.4 FIX-004: Remove Unnecessary Fields
1. Go to http://localhost:5173/publish/step-1
2. Select "New Premises Licence"
3. Check these are GONE:
   - Applicant status
   - Trading name
   - Company number
   - DPS field

---

## 3.5 FIX-005: Sale of Alcohol at TOP
1. In publish wizard activities section
2. ✅ "Sale of Alcohol" at TOP of list

---

## 3.6 FIX-006: Councils Dropdown
1. Publish wizard step 3
2. ✅ Sampletonborough appears
3. ✅ Westminster appears

---

## 3.7 FIX-007: Council Settings Auto-Fill
1. Select council in dropdown
2. ✅ Authority address auto-fills
3. ✅ Authority email auto-fills

---

## 3.8 FIX-008: ALL Notices Have Rep Forms
1. View any notice (e.g., The Pilot Inn)
2. ✅ "Submit Representation" button exists
3. ✅ Form works

---

## 3.9 FIX-009: No Radius Circle
1. View notice detail
2. ✅ Single red pin only
3. ✅ NO radius circle

---

## 3.10 FIX-010: Email/Password Auth
1. Login page
2. ✅ NO magic link option
3. ✅ Password field with requirements

---

## 3.11 FIX-011: Registration Wizard
1. Go to http://localhost:5173/register
2. ✅ Step-by-step wizard
3. ✅ Progress bar visible

---

## 3.12 FIX-012: Default to Template
1. Publish wizard step 2
2. ✅ "Structured template" selected by default
3. ✅ NOT "Upload"

---

## 2.1 US-0001: Public Notice Detail
1. Search: S325UY
2. Radius: 5km
3. Click "The Pilot Inn"
4. ✅ Notice loads (not "not found")

---

## 2.2 US-0002: Council Notice Retrieval
**NEEDS WORKING LOGIN**
1. Council portal → Notices
2. Click any notice
3. ✅ Opens successfully

---

## 2.3 US-0003: Council Representations
**NEEDS WORKING LOGIN**
1. Council → Representations
2. ✅ List loads
3. ✅ Can add comments

---

## 2.4 US-0004: Council Analytics
**NEEDS WORKING LOGIN**
1. Council → Analytics
2. ✅ All widgets load
3. ✅ Charts render

---

## 2.5 US-0005: Firm Payment Button
**NEEDS WORKING LOGIN**
1. Firm dashboard
2. Click "Make Payment"
3. ✅ Goes to billing page

---

## 2.6 US-0006: Firm Client Notices
**NEEDS WORKING LOGIN**
1. Firm → Clients
2. Click "View Notices"
3. ✅ Shows client's notices

---

## 2.7 US-0007: Firm Notices Page
**NEEDS WORKING LOGIN**
1. Firm → Notices
2. ✅ Shows all firm notices
3. ✅ Filters work

---

## 2.8 US-0008: Firm Billing Page
**NEEDS WORKING LOGIN**
1. Firm → Billing
2. ✅ Shows subscription
3. ✅ Shows invoices

---

## 2.9 US-0009: Firm Team Page
**NEEDS WORKING LOGIN**
1. Firm → Team
2. ✅ Loads (no spinner)
3. ✅ Shows members

---

## 2.10 US-0010: Firm Settings Filter
**NEEDS WORKING LOGIN**
1. Firm → Settings
2. Select only Licensing + Planning
3. Publish page → ONLY shows those

---

## 2.11 US-0011: Wizard Step 4 Submit
1. Complete all wizard steps
2. Step 4 → Submit
3. ✅ Creates notice
4. ✅ Shows confirmation

---

[Continue with remaining items...]