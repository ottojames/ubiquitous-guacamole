#!/bin/bash

# US-0011 Browser Test Script

echo "🧪 Testing US-0011: Fix Wizard Step4 Upload"
echo "==========================================="
echo ""

# Check servers are running
echo "✅ Checking servers..."
if lsof -i :5173 > /dev/null; then
    echo "   Frontend server running on :5173 ✓"
else
    echo "   ❌ Frontend server not running on :5173"
    echo "   Run: npm run dev:web"
    exit 1
fi

if lsof -i :5174 > /dev/null; then
    echo "   API server running on :5174 ✓"
else
    echo "   ❌ API server not running on :5174"
    echo "   Run: npm run dev:server"
    exit 1
fi

echo ""
echo "📝 Testing API endpoint directly..."
RESPONSE=$(curl -s -X POST http://localhost:5174/api/notices/submit \
  -H "Content-Type: application/json" \
  -d '{
    "notice_type": "premises-licence",
    "contact_email": "test@example.com",
    "applicant": {
      "name": "Script Test Applicant",
      "email": "test@example.com"
    },
    "premises": {
      "name": "Script Test Premises",
      "address": "789 Script Street, Testborough, TE5 7SC"
    },
    "consultation": {
      "repsDeadline": "2026-02-15"
    },
    "extras": {
      "activities": ["Sale of alcohol"],
      "tokens": {
        "APPLICANT_NAME": "Script Test Applicant",
        "PREMISES_NAME": "Script Test Premises"
      }
    }
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ API endpoint working!"
    echo "   Notice ID: $(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)"
else
    echo "   ❌ API endpoint failed"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "🌐 Browser Test Instructions:"
echo "------------------------------"
echo "1. Navigate to: http://localhost:5173/publish/step-1"
echo "2. Select 'New Premises Licence'"
echo "3. Click Continue"
echo ""
echo "Step 2 - Upload Method:"
echo "  ✓ Verify 'Structured template' is selected by default"
echo "  ✓ Enter email: test@example.com"
echo "  ✓ Click Continue"
echo ""
echo "Step 3 - Notice Details:"
echo "  ✓ Applicant Name: Test Applicant Ltd"
echo "  ✓ Premises Name: The Test Tavern"
echo "  ✓ Address Line 1: 123 Test Street"
echo "  ✓ Town: Testington"
echo "  ✓ Postcode: TE5 7ST"
echo "  ✓ Council: Select Sampletonborough Council"
echo "  ✓ Activities: Check 'Sale of alcohol'"
echo "  ✓ Click Continue"
echo ""
echo "Step 4 - Review & Submit:"
echo "  ✓ Review all details"
echo "  ✓ Click 'Submit' or 'Confirm and Pay'"
echo "  ✓ Should redirect to confirmation page"
echo ""
echo "Expected Results:"
echo "  ✅ Notice created in database"
echo "  ✅ Redirected to confirmation page"
echo "  ✅ No errors displayed"
echo ""
echo "Opening browser to test page..."
open http://localhost:5173/publish/step-1