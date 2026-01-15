#!/bin/bash

echo "🧪 Testing US-0026: Remove Demo Logins Firm"
echo "==========================================="
echo ""

# Test 1: Main login page
echo "📝 Test 1: Check main /login page for firm demo accounts"
echo "-----------------------------------------------------------"
echo "Navigate to: http://localhost:5173/login"
echo "Click: Professional Portal button"
echo "Expected: NO demo accounts shown (no Wilson Partners, no test solicitors)"
echo "Expected: Only standard login form with support@civicnotices.co.uk contact"
echo ""

# Test 2: Auth signin page
echo "📝 Test 2: Check /auth/signin page for firm demo"
echo "-----------------------------------------------------------"
echo "Navigate to: http://localhost:5173/auth/signin"
echo "Expected: NO Demo Access section"
echo "Expected: Only standard magic link form"
echo ""

# Test 3: Direct firm URL without auth
echo "📝 Test 3: Try accessing firm portal directly"
echo "-----------------------------------------------------------"
echo "Navigate to: http://localhost:5173/f/wilson-partners"
echo "Expected: Should redirect to /auth/sign-in"
echo "Expected: NO automatic demo login"
echo "Expected: Must authenticate to access"
echo ""

# Check if FirmLayout.tsx still has demo code
echo "🔍 Checking code for demo remnants..."
if grep -q "Demo mode for wilson-partners" src/pages/firm/FirmLayout.tsx 2>/dev/null; then
    echo "❌ Demo code still found in FirmLayout.tsx"
else
    echo "✅ Demo code removed from FirmLayout.tsx"
fi

# Check if Login.tsx has firm demo accounts
if grep -q "solicitor@wilsonpartners\|Demo Firm" src/pages/Login.tsx 2>/dev/null; then
    echo "❌ Demo accounts found in Login.tsx"
else
    echo "✅ No demo accounts in Login.tsx"
fi

# Check if SignIn.tsx has firm demo accounts
if grep -q "solicitor@wilsonpartners\|Demo Firm" src/pages/auth/SignIn.tsx 2>/dev/null; then
    echo "❌ Demo accounts found in SignIn.tsx"
else
    echo "✅ No demo accounts in SignIn.tsx"
fi

echo ""
echo "🌐 Opening browser for manual verification..."
echo ""
# Open the login page
open http://localhost:5173/login

# Also test direct firm access
sleep 2
open http://localhost:5173/f/wilson-partners

echo "✓ Test complete - verify in browser"
echo "✓ NO demo logins should be visible"
echo "✓ Direct firm access should require authentication"