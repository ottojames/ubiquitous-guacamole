# FINAL TEST LOG - Ralph's Latest Fixes
**Date:** 2026-01-16
**Tester:** Otto
**Note:** Testing Ralph's fixes from iterations 20-23

---

## FIX-002: Address Search Single-Click ✓
**Ralph fixed:** GetAddress integration, resolve endpoint for postcodes
**Test:** Type SW1A 1AA, click address once
**Comments:**
Okay, I'm on Fix 002. I've gone to slash notices. I've typed in SW1AA. The drop down appears with a list of addresses. I've clicked down on Buckingham Palace Garden and nothing happens. It stays exactly as the screen. So this has failed. Please take a look at the notice search function on the homepage and copy this function pretty much because that function on the homepage works. This has failed and needs to be redone.


---

## FIX-003: Map View 70/30 Split ✓
**Ralph fixed:** Changed to 70/30 split, improved card design, better scrolling
**Test:** Check map layout after search
**Comments:**
Okay, I'm now looking at fix 003. I'm going to notices and view map. And I can't do this because fix 002 does not work, so I cannot approve this. This has failed.


---

## FIX-004: DPS Field Removal ✓
**Ralph fixed:** Completely removed DPS fields from entire codebase
**Test:** Check publish wizard Step 3 - NO DPS field should exist
**Comments:**
I'm now looking at fix 004 DPS field removal. Success.

---

## FIX-007: Council Auto-Population ✓
**Ralph fixed:** Added setValue prop, fixed auto-population for Sampletonborough
**Test:** Select Sampletonborough Council, check if fields auto-fill
**Comments:**
I am now looking at the council auto-population. I am typing in Sampleton Borough Council. I'm clicking the drop-down once and nothing at all has auto-populated. Authority address is blank, address one blank, address line two blank, town slash city blank, postcode blank, authority email blank, online register URL in brackets optional also blank. That has failed. Fix it.

---

## FIX-011: Registration Wizard ✓
**Ralph fixed:** Direct portal navigation, added slug field, fixed registration backend
**Test:** Click "Sign up for free" from council/firm portal, complete registration
**Comments:**
So I've gone to slash login. I've clicked cancel portal. I've clicked sign up free. It does in fact go to directly to register account. I've done step number five. I've filled all the steps and it does not complete. It fails and in a red box above the review and confirm pill, it says in a red box, new row violates row level security policy for table organizations, so this step has failed and needs to be fixed.


---

## SUMMARY

Ralph's latest run (iterations 20-23) claims to have fixed all 5 remaining critical issues:
- Address search now works with single click
- Map view redesigned to 70/30 split
- DPS field completely removed
- Council settings auto-populate
- Registration wizard properly wired up

## HOW TO VERIFY

Say: "Confirm all fixes" if everything works
Say: "Still issues with [item]" if something doesn't work