# 📋 Testing Guide - Aligned with PRD Sections
**Links to:** PRD.md sections 2.1-2.37 (User Stories) and 3.1-3.12 (Critical Fixes)
**Update:** TESTING_LOG.md with your results
**Then:** Update PRD.md based on test results

---

## 🚀 Environment Setup

### Start Development Servers
```bash
# With demo mode enabled (required for testing):
VITE_DEMO_MODE=true npm run dev

# Verify running:
# Frontend: http://localhost:5173
# API: http://localhost:5174/api/health
```

---

## Section 3: CRITICAL FIXES (Test These First!)

### 3.1 FIX-001: Demo Authentication ⚠️ PARTIALLY BROKEN
**PRD Line:** 783
**Test ALL three accounts:**

1. Navigate to http://localhost:5173/login
2. Click "Council Portal" or "Professional Portal"
3. Test each account:
   - ✅ licensing@sampletonborough.gov.uk / testpass123 → Should go to /c/sampletonborough/licensing
   - ❌ licensing@westminster.gov.uk / testpass123 → **YOU FOUND: "Invalid credentials"**
   - ❌ solicitor@wilsonpartners.com / testpass123 → Should go to /f/wilson-partners

**Your Finding:** Westminster broken with "AuthApiError: Invalid login credentials"

---

### 3.2 FIX-002: Address Search Single-Click ❌ NOT FIXED
**PRD Line:** 799
**Test Steps:**

1. Navigate to http://localhost:5173/notices
2. Type `SW1A 1AA`
3. Click address ONCE in dropdown
4. Should: Load map immediately
5. Should: Default to MAP view

**Your Findings:**
- ❌ Still need to click twice
- ❌ Still defaults to LIST view

---

### 3.3 FIX-003: Map View 70/30 Split ⚠️ PARTIALLY FIXED
**PRD Line:** 813
**Test:**

1. After search, check map layout
2. Map should be 70% width
3. Notice list should be 30% width
4. Should look professional

**Your Finding:** "Right pillbox crowded and squeezed, UI does not look great, list tiny and can't scroll properly"

---

### 3.4 FIX-004: Remove Unnecessary Fields
**PRD Line:** 830
**Navigate to:** http://localhost:5173/publish/step-1

Check these fields are GONE:
- [ ] Applicant status field
- [ ] Trading name field
- [ ] Company number
- [ ] DPS field
- [ ] Publication date
- [ ] Authority phone

---

### 3.5 FIX-005: Field Ordering - Sale of Alcohol
**PRD Line:** 848
**Test:** In publish wizard, "Sale of Alcohol" should be at TOP of activities

---

### 3.6 FIX-006: Councils Dropdown
**PRD Line:** 861
**Test:** In publish wizard step 3, check dropdown has councils

---

### 3.7 FIX-007: Council Settings Auto-Population
**PRD Line:** 876
**Test:** When council selected, authority details should auto-fill

---

### 3.8 FIX-008: Representation Forms on ALL Notices ❌ INCONSISTENT
**PRD Line:** 891
**Test:** EVERY notice must have representation form

**Your Finding:** "The Pilot Inn" missing form but others have it - NOT ACCEPTABLE

---

### 3.9 FIX-009: Remove Radius Circle ⚠️
**PRD Line:** 924
**Test:** Notice detail should show single red pin, no radius

**Your Finding:** "Radius in right sided map is unnecessary"

---

### 3.10 FIX-010: Email/Password Auth
**PRD Line:** 939
**Test:** Check magic link removed, password requirements work

---

### 3.11 FIX-011: Registration Wizard
**PRD Line:** 959
**Test:** http://localhost:5173/register - should be questionnaire

---

### 3.12 FIX-012: Default to Template
**PRD Line:** 992
**Test:** Step 2 should default to "structured template"

---

## Section 2: USER STORIES

### 2.1 US-0001: Public Notice Detail Page
**PRD Line:** 17
**Test:**
1. Search postcode S325UY
2. Increase radius to 5km
3. Click "The Pilot Inn"
4. Click "View Notice"
5. Should show full details

---

### 2.2 US-0002: Council Notice Retrieval
**PRD Line:** 38
**Blocked by:** Need working council login (3.1)

---

### 2.3 US-0003: Council Representations
**PRD Line:** 57
**Blocked by:** Need working council login (3.1)

---

### 2.4 US-0004: Council Analytics
**PRD Line:** 76
**Blocked by:** Need working council login (3.1)

---

### 2.5 US-0005: Firm Payment Button
**PRD Line:** 95
**Blocked by:** Need working firm login (3.1)

---

### 2.6-2.37: [Continue with remaining user stories...]

---

## 📝 How to Use This Guide

1. **Test in order** - Critical Fixes (3.x) first, then User Stories (2.x)
2. **Update TESTING_LOG.md** with your findings (you've already started!)
3. **After testing**, update PRD.md:
   - Change [x] to [ ] for broken items
   - Update evidence sections with your findings
4. **Create tickets** in NEEDS-WORK.md for Ralph to fix

---

## 🔴 Your Critical Findings So Far

Based on your testing log, these need IMMEDIATE fixes:

1. **3.1 FIX-001**: Westminster auth completely broken
2. **3.2 FIX-002**: Double-click issue NOT fixed
3. **3.3 FIX-003**: Map UI needs UX specialist
4. **3.8 FIX-008**: Representation forms missing on some notices
5. **3.9 FIX-009**: Radius circle still showing

---

## Next Steps

1. Continue testing from where you left off (Section 3.4)
2. Update TESTING_LOG.md with results
3. I'll help update PRD.md based on your findings
4. Create fix tickets for Ralph

Want me to create the fix tickets based on what you've found so far?