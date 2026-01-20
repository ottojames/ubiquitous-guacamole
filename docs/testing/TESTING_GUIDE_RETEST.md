# RETEST GUIDE - Ralph's Fixes Only
**Open alongside TESTING_LOG_RETEST.md**

## Setup
✅ Server running: http://localhost:5173
✅ Demo mode: ENABLED

---

## 3.1 FIX-001: Demo Authentication
1. Go to http://localhost:5173/login
2. Click "Council Portal"
3. Try: licensing@westminster.gov.uk / testpass123
4. **Write:** Does it login or error?

---

## 3.2 FIX-002: Address Search
1. Go to http://localhost:5173/notices
2. Type: SW1A 1AA
3. Click any address ONCE
4. **Write:** Single click? Map view?

---

## 3.3 FIX-003: Map Layout
1. After search, look at map/sidebar
2. **Write:** Less crowded? Better scrolling?
Now starting 3.3, which I cannot do because of step 3.2, which failed, so this I cannot, it's in the middle because I can't say yes or no.

---

## 3.4 FIX-004: Check Fields
1. Go to http://localhost:5173/publish/step-1
2. Select "New Premises Licence"
3. Go to Step 3
4. **Write:** Are these gone: Applicant address? Company number?

---

## 3.5 FIX-005: Alcohol Order
1. Still in publish wizard
2. Look at activities section
3. **Write:** Is "On & off premises" at TOP?

---

## 3.6 FIX-006: Council Dropdown
1. In Step 3, council dropdown
2. Type "sample" or "west"
3. Click council ONCE
4. **Write:** Single click works?

---

## 3.7 FIX-007: Auto-Fill
1. After selecting council
2. **Write:** Did address and email fill in?

---

## 3.8 FIX-008: Rep Forms
1. Search S325UY, radius 5km
2. Click "The Pilot Inn"
3. **Write:** Is there a representation form?

---

## 3.9 FIX-009: Map Circle
1. On notice detail page
2. Look at the map
3. **Write:** Just one pin? No radius circle?

---

## 3.10 FIX-010: No Magic Link
1. Go to /login
2. Look at login options
3. **Write:** Email/password only? No Google?

---

## 3.11 FIX-011: Registration
1. On login page
2. Click "Sign up for free"
3. **Write:** Goes to /register or homepage?

---

## Quick Tips
- Just write what you see
- "works" = it's fixed
- "still broken" = not fixed
- "better but..." = partial fix