#!/bin/bash

echo "================================================"
echo "BROWSER TEST: US-0148 - Licensing Quick Publish"
echo "================================================"
echo ""

# Start servers if not running
if ! lsof -i:5173 > /dev/null; then
  echo "Starting dev server..."
  npm run dev > /dev/null 2>&1 &
  sleep 5
fi

if ! lsof -i:5174 > /dev/null; then
  echo "Starting API server..."
  npm run dev:server > /dev/null 2>&1 &
  sleep 3
fi

echo "Step 1: Navigating to firm dashboard..."
echo "URL: http://localhost:5173/f/wilson-partners/dashboard"
echo ""

echo "Step 2: Quick Publish widget should be visible"
echo "Expected:"
echo "  - Widget title: 'Quick Publish'"
echo "  - Shows '3 clients' count"
echo "  - Has client dropdown with mock data:"
echo "    - The Red Lion Pub"
echo "    - The Crown Hotel"
echo "    - Blue Moon Restaurant"
echo ""

echo "Step 3: Select 'The Red Lion Pub' from dropdown"
echo "Expected:"
echo "  - Selected client preview shows:"
echo "    - Name: The Red Lion Pub"
echo "    - Company: Red Lion Holdings Ltd"
echo "    - Address: 123 High Street"
echo ""

echo "Step 4: Click 'Start Quick Publish' button"
echo "Expected:"
echo "  - Navigates to /publish/step-1"
echo "  - Session storage contains quickPublishData"
echo ""

echo "Step 5: Select any notice type and continue to Step 2"
echo "Expected:"
echo "  - Upload method step loads"
echo ""

echo "Step 6: Select 'Enter details manually' (template option)"
echo "Expected:"
echo "  - Form fields appear"
echo ""

echo "Step 7: Check for pre-populated fields"
echo "Expected (if working correctly):"
echo "  - Applicant Name: The Red Lion Pub"
echo "  - Email: manager@redlion.com"
echo "  - Phone: 020 1234 5678"
echo "  - Address Line 1: 123 High Street"
echo "  - Postcode: SW1A 1AA"
echo ""

echo "Manual Browser Test Instructions:"
echo "1. Open http://localhost:5173/f/wilson-partners/dashboard"
echo "2. Look for Quick Publish widget on the dashboard"
echo "3. Select a client from dropdown"
echo "4. Click 'Start Quick Publish'"
echo "5. Select notice type on Step 1"
echo "6. Choose manual entry on Step 2"
echo "7. Verify form fields are pre-populated"
echo ""

echo "Dev servers running on:"
echo "  Frontend: http://localhost:5173"
echo "  API: http://localhost:5174"