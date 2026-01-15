# Manual Browser Test for US-0011: Fix Wizard Step4 Upload

## Test Steps:

1. Open browser to http://localhost:5173/publish/step-1
2. Select "New Premises Licence"
3. Click Continue
4. Step 2: Verify "Structured template" is selected by default
5. Enter email: test@example.com
6. Click Continue
7. Step 3: Fill in details:
   - Applicant Name: Test Applicant Ltd
   - Premises Name: The Test Tavern
   - Address Line 1: 123 Test Street
   - Town: Testington
   - Postcode: TE5 7ST
   - Council: Select Sampletonborough Council
   - Activities: Check "Sale of alcohol"
8. Click Continue
9. Step 4: Click "Submit" or "Confirm and Pay" button
10. Observe what happens

## Expected Results:
- Notice should be created
- Should redirect to confirmation page
- No errors should appear

## Actual Results:
(To be filled during test)