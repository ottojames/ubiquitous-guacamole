# Quick Testing Guide
**Public Notice Portal - Rapid Manual Testing**

---

## 🚀 Quick Start (5 Minutes)

### 1. Start Dev Environment
```bash
cd /Users/ottoclarke/projects/ubiquitous-guacamole
npm run dev
# Opens http://localhost:5173
```

### 2. Login as Council Officer
```
URL: http://localhost:5173/login
Click: "Council Portal"
Email: demo@council.gov.uk
Password: demo123
```

### 3. Test Premises Licence Flow
```
1. Navigate to: /publish/step-1
2. Expand "Licensing Act 2003" category (click the header)
3. Click "Premises Licence — New"
4. Click "Continue"
5. Switch to "Structured template" tab (if not already selected)
6. Fill minimum required fields (see below)
7. Check preview looks correct
8. Complete payment (look for skip/test mode button)
9. Verify success message
```

---

## ✅ Manual Test Checklist

### Test 1: Premises Licence (5 mins)

**Step 1: Notice Type**
- [ ] "Licensing Act 2003" category visible
- [ ] Can expand/collapse category
- [ ] "Premises Licence — New" button clickable
- [ ] Selection pill shows after click
- [ ] Continue button enabled

**Step 2: Template**
- [ ] Email field visible and required
- [ ] "Structured template" tab active by default
- [ ] All required fields have red asterisk
- [ ] Validation pill shows status
- [ ] Can fill all fields without errors

**Required Fields**:
```
✓ APPLICANT_NAME
✓ PREMISES_ADDRESS
✓ LICENSABLE_ACTIVITIES
✓ ACTIVITY_SCHEDULE
✓ INSPECTION_TIMES
✓ APPLICATION_DATE
✓ DEADLINE_DATE
```

**Step 3: Confirm**
- [ ] Preview renders correctly
- [ ] All entered data appears
- [ ] No placeholder tokens visible (e.g., {{FIELD_NAME}})
- [ ] Dates formatted correctly
- [ ] Can go back to edit

**Step 4: Payment**
- [ ] Payment summary shown
- [ ] Test/skip payment button present (dev mode)
- [ ] OR Stripe payment form loads
- [ ] After payment: success message
- [ ] Can view published notice

---

### Test 2: GVOL New Operator (5 mins)

**Step 1: Select**
- [ ] Expand "Goods Vehicle Operator's Licence"
- [ ] Click "GVOL — New"

**Step 2: Fill**
- [ ] OPERATOR_NAME
- [ ] OPERATING_CENTRE_ADDRESS
- [ ] TRAFFIC_AREA dropdown (7 UK areas)
- [ ] Correct Traffic Commissioner auto-filled
- [ ] VEHICLE_COUNT, TRAILER_COUNT

**Step 3: Verify**
- [ ] Traffic Commissioner office address correct
- [ ] Deadline = APPLICATION_DATE + 21 days

---

### Test 3: Gambling Betting (5 mins)

**Step 1: Select**
- [ ] Expand "Gambling Act 2005"
- [ ] Click "Betting — New"

**Step 2: Fill**
- [ ] APPLICANT_NAME
- [ ] PREMISES_ADDRESS
- [ ] GAMBLING_ACTIVITIES checkboxes visible
- [ ] Can check multiple activities
- [ ] Hours section renders
- [ ] Different hours for different days

**Step 3: Verify**
- [ ] Preview shows all selected activities
- [ ] Hours formatted correctly (Mon–Sat 09:00–23:00)

---

### Test 4: Representations (10 mins)

**As Council (Publish)**:
1. Publish a Premises Licence (Test 1)
2. Copy notice ID from URL or success modal

**As Public (Submit)**:
1. Logout (click Sign Out)
2. Navigate to: `/notices/{NOTICE_ID}`
3. Click "Submit representation" button
4. Fill form:
   - Full Name: "Test Resident"
   - Email: "test@example.com"
   - Address: "123 Test Street"
   - Type: "Objection"
   - Comments: "Test objection comments"
5. Submit form
6. Verify success message

**As Council (View)**:
1. Login as council officer again
2. Navigate to: `/c/westminster/licensing/notices/{NOTICE_ID}`
3. Look for "Representations" tab or section
4. Verify representation appears
5. Try "Mark as read" button

**Checklist**:
- [ ] Public can submit without login
- [ ] Form validates required fields
- [ ] Success message after submission
- [ ] Representation appears in council portal
- [ ] Can mark as read

---

## 🐛 Common Issues to Look For

### Form Validation
- [ ] Required fields clearly marked
- [ ] Inline errors helpful
- [ ] Validation pill accurate (green = ready, red = incomplete)
- [ ] Cannot proceed with missing data

### Preview Generation
- [ ] All data appears
- [ ] No {{PLACEHOLDERS}} visible
- [ ] Dates in correct format
- [ ] Addresses formatted nicely
- [ ] Lists render properly (activities, hours)

### UX Issues
- [ ] Loading states shown
- [ ] Error messages clear
- [ ] Can go back without losing data
- [ ] Mobile responsive
- [ ] Keyboard navigation works

### Backend Issues
- [ ] Notice appears in database
- [ ] Geolocation works (if postcode entered)
- [ ] Files upload successfully
- [ ] No console errors
- [ ] API responses under 1 second

---

## 📝 Sample Data

### Premises Licence
```
APPLICANT_NAME: Test Licensing Ltd
PREMISES_NAME: The Test Arms
PREMISES_ADDRESS: 123 High Street, Westminster, London, SW1A 1AA
LICENSABLE_ACTIVITIES: Sale of alcohol (on premises)\nLive music
ACTIVITY_SCHEDULE: Mon-Sat: 11:00-23:00\nSun: 12:00-22:30
INSPECTION_TIMES: Mon-Fri: 09:00-17:00
APPLICATION_DATE: [Today's date]
DEADLINE_DATE: [Today + 28 days]
```

### GVOL
```
OPERATOR_NAME: Test Haulage Ltd
OPERATING_CENTRE_ADDRESS: Industrial Estate, Leicester, LE1 1AA
TRAFFIC_AREA: Eastern and Wales
LICENCE_CATEGORY: Standard National
VEHICLE_COUNT: 10
TRAILER_COUNT: 5
APPLICATION_DATE: [Today]
```

### Gambling
```
APPLICANT_NAME: Betting Premises Ltd
PREMISES_ADDRESS: 456 Betting Street, London, W1A 1AA
GAMBLING_ACTIVITIES:
  ☑ Over-the-counter betting
  ☑ Fixed-odds betting terminals (4 machines)
OPENING_HOURS: Mon-Sat: 09:00-23:00, Sun: 10:00-22:00
APPLICATION_DATE: [Today]
```

---

## 🚨 Red Flags (Stop and Report)

### CRITICAL
- ❌ Cannot select notice type
- ❌ Form completely blank
- ❌ Crash/white screen
- ❌ Cannot proceed to next step
- ❌ Published notice returns 404

### MEDIUM
- ⚠️ Validation not working
- ⚠️ Preview shows placeholders
- ⚠️ Backend errors in console
- ⚠️ Data not persisting between steps

### LOW
- 💡 Typos in text
- 💡 Minor layout issues
- 💡 Slow loading (>3 seconds)

---

## 📊 Test Report Template

After testing, fill this out:

```markdown
## Test Results - [Date]

### Environment
- Browser: Chrome 120
- Screen: Desktop 1920x1080
- User: demo@council.gov.uk

### Tests Completed
- [x] Premises Licence flow
- [x] GVOL flow
- [ ] Gambling flow (skipped)
- [x] Representations submission

### Issues Found
1. [MEDIUM] Validation pill not updating (Steps 2)
2. [LOW] Preview text slightly off-center

### Overall Status
✅ Ready for production / ⚠️ Minor fixes needed / ❌ Major issues

### Time Taken
25 minutes
```

---

## 🔗 Quick Links

### Local URLs
- Home: http://localhost:5173
- Login: http://localhost:5173/login
- Publish: http://localhost:5173/publish/step-1
- Map: http://localhost:5173/notices/map
- Council Portal: http://localhost:5173/c/westminster/licensing/dashboard

### Test Helpers
```bash
# Run Playwright tests
npx playwright test e2e/council/ --headed

# Generate test code
npx playwright codegen http://localhost:5173/publish/step-1

# View test report
npx playwright show-report
```

### API Health Check
```bash
curl http://localhost:5174/api/health
curl http://localhost:5174/api/notices?limit=5
```

---

## 💡 Pro Tips

1. **Use browser DevTools**: Network tab shows API calls, Console shows errors
2. **Test with validation errors**: Try submitting incomplete forms
3. **Test edge cases**: Very long text, special characters, future dates
4. **Check mobile view**: Responsive design crucial for public users
5. **Clear localStorage**: `localStorage.clear()` in console for fresh state

---

## 🎯 Success Criteria

**Minimum Viable**:
- ✅ Can publish 1 notice type successfully
- ✅ Notice appears in database
- ✅ Public can view notice
- ✅ Representations can be submitted

**Production Ready**:
- ✅ All notice types work
- ✅ Validation comprehensive
- ✅ Preview accurate
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Payment integration working

---

**Last Updated**: 2025-11-06
**Next Review**: After manual testing session
