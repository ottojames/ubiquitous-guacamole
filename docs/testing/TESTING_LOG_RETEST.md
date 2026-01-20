# RETEST LOG - Ralph's Fixes Only
**Date:** 2026-01-16
**Tester:** Otto
**Note:** Only testing items that FAILED before and Ralph claims he fixed

---

## 3.1 FIX-001: Demo Authentication
**Previous:** "Invalid credentials" error
**Ralph claims:** Fixed password validation for demo accounts
**Retest:**
Okay, testing guide retest. Starting at 3.1.6.001, going to localhost slash login. I'm clicking the Council portal. I'm trying licensing at westminster.gov.uk, clicking signing in, and it says invalid credentials, please check your email and password. So that has failed. Again, it's failed again. Fix it.

---

## 3.2 FIX-002: Address Search Single-Click
**Previous:** Had to click twice, went to list view not map view
**Ralph claims:** Changed to onClick handler, defaults to map view
**Retest:**
Okay, 3.2, navigating to slash notices. I am searching SW1A1AA, clicking Buckingham Palace Garden, and nothing comes up. Nothing. I click the address and nothing changes. It doesn't put a pin on the map. It says zero notices found. That has failed.


---

## 3.3 FIX-003: Map View (now 65/35 split)
**Previous:** Right side crowded and squeezed, can't scroll properly
**Ralph claims:** Redesigned to 65/35 split with better cards
**Retest:**
CANNOT NAVIGATE TO PAGE DUE TO PREVIOUS STEP FAILING

---

## 3.4 FIX-004: Remove Unnecessary Fields
**Previous:** Applicant address and company number still there
**Ralph claims:** Removed all specified fields from formBlueprints.ts
**Retest:**
Now starting 3.4, navigating to publish step 1. Clicking new premises license. Applicant name gone in. Premises name gone in. Premises address. That works fine. Opening hours. Great. On and off and premises is in the right place. You've still not removed designated premises supervisor field. Remove that field. I'm on the licensing authority. I'm typing in sample, clicking sample to borough council, and what do you know? The authority address has not automatically filled. The addresses obviously have not filled because it hasn't done it. It hasn't auto-populated it. The authority email isn't auto-populated and the online register URL is not automatically populated either. This has failed. We must add the data in the back end for Sampleton Borough for that to work. Come on, this is easy simple stuff.

---

## 3.5 FIX-005: Sale of Alcohol Ordering
**Previous:** Not at top of activities list
**Ralph claims:** Reordered to put "On & off premises" at TOP
**Retest:**
SUCCESS

---

## 3.6 FIX-006: Council Dropdown Single-Click
**Previous:** Had to click twice
**Ralph claims:** Removed preventDefault, now single-click works
**Retest:**
SUCCESS

---

## 3.7 FIX-007: Council Settings Auto-Fill
**Previous:** Fields do not autofill
**Ralph claims:** Fixed to use organization_id, added council settings data
**Retest:**
FAIL - NO AUTOFILL ON ANY OF THE COUNCIL FIELDS

---

## 3.8 FIX-008: Representation Forms on ALL Notices
**Previous:** Pilot Inn missing representation form
**Ralph claims:** Added prominent CTAs and floating buttons
**Retest:**
SUCCESS


---

## 3.9 FIX-009: Remove Radius Circle
**Previous:** Unnecessary radius circle on map
**Ralph claims:** Removed "1km radius shown" label, only single pin
**Retest:**
SUCCESS

---

## 3.10 FIX-010: Remove Magic Link
**Previous:** Magic link still not removed
**Ralph claims:** Removed Google login, pure email/password now
**Retest:**
SUCCESS

---

## 3.11 FIX-011: Registration Wizard Access
**Previous:** "Sign up" redirected to homepage
**Ralph claims:** Fixed redirect to go to /register
**Retest:**
This is a medium result. When we click, say, council portal, and then we say you don't have an account, sign up for free, it then says create your account, choose the type of account, but if they've already clicked on the council portal login, then it shouldn't be the council registration. And it should just go straight to council registration setup wizard. And the same with the professional portal, it should just go straight to, if you click sign up for free on that side, it should just go straight into the law firm registration wizard. The second thing is that I filled out all of the details for the council portal account setup and then I tried to complete registration and it said registration failed, please try again. So it's clearly not linked in, so we need to make sure that is wired up and also the law firm registration is wired up. So a success would be that on Chrome browser that you put in all information on both council registration and law firm registration and you can actually complete the registration and after that, log in. That would be a success. So make sure it does that through Chrome browser.

---

## SKIPPED (Already Passed)
- ✅ FIX-012: Default to Template - You marked "success"

---

## HOW TO UPDATE PRD

Say: "Update PRD from my retests"

I'll mark in PRD:
- "works now" → PASSED ✅
- "still broken" → FAILED ❌
- "better but not perfect" → PARTIAL ⚠️