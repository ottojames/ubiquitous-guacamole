# FINAL TEST LOG - Ralph's Latest Fixes
**Date:** 2026-01-16
**Tester:** Otto
**Note:** Testing Ralph's fixes from latest run (iterations 1-4)

---

## FIX-002: Address Search Single-Click ✓
**Ralph fixed:** Separated onMouseDown and onClick handlers to match HomeSearch pattern
**Test:** Type SW1A 1AA, click address once
**Comments:**
OK, this is good. This is a lot, lot better. I've navigated to slash notices, typed in SW1818A, the drop-down has appeared, clicked Buckingham Palace Garden, and yes, the map loads immediately with the notice is available. Um all perfect, absolutely perfect. 

---

## FIX-003: Map View 70/30 Split ✓
**Ralph fixed:** 70/30 split layout, custom scrollbar, smooth map interactions
**Test:** Check map layout after search
**Comments:**
Perfect! there is one change that I want to make. Um I think it'd be really good if you could filter in the list on the right-hand rail by like nearest distance. I think that would be really, really useful as an addition for the, um, for the user who is searching. So if we could add that, that would be amazing. But yeah, well done for sorting that.

---

## FIX-007: Council Auto-Population ✓
**Ralph fixed:** Not fixed in this run - still needs work
**Test:** Select Sampletonborough Council, check if fields auto-fill
**Comments:**
This is still not working. I've clicked Stapleton bar Council on the publishing Wizard on the drop-down and still nothing is auto filling below it. You need to really spend your time on fixing this as this is a critical issue because in the templates we will use these fields to input the template automatically

---

## FIX-011: Registration Wizard ✓
**Ralph fixed:** Not fixed in this run - still needs work
**Test:** Click "Sign up for free" from council portal, complete registration
**Comments:**
So fast thing to comment when we click login in the top right it should say below council portal and professional portal below that in white it should light white and unlined something with really really nice you are so it looks like if it's the Paige should say, don't have an account create one here and then once you click that it should then give you the option to create for either of the council or the professional account. 

I then filled out all the details of the council registration and again I got to the final start. I clicked complete and it says New row violates row level security policy for table organizations, so this still fails. I'm also copying in the console log. This really, really needs to be fixed as soon as possible. Really look into why this is happening, check the console log, and ensure this doesn't happen again, and will never happen again. And also, it needs to be absolutely seamless on the professional account registration as well.


---

## SUMMARY

Ralph's latest run (iterations 1-4) claims to have fixed:
- FIX-002: Address search single-click (matching HomeSearch pattern)
- FIX-003: Map view 70/30 split (already implemented, now marked complete)

Still need to test:
- FIX-007: Council auto-population (not fixed)
- FIX-011: Registration wizard (not fixed)

## HOW TO VERIFY

✅ **All Working** = Ralph successfully fixed the critical issues
❌ **Still Issues** = Note which items still fail