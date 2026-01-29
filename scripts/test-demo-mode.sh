#!/bin/bash

echo "🧪 Testing US-0027: Implement Safe Demo Access"
echo "=============================================="
echo ""

# Test 1: Without DEMO_MODE
echo "📝 Test 1: Without DEMO_MODE environment variable"
echo "--------------------------------------------------"
echo "Starting server without DEMO_MODE set..."
echo ""

# Kill existing servers
kill -9 $(lsof -ti tcp:5173) 2>/dev/null
kill -9 $(lsof -ti tcp:5174) 2>/dev/null
sleep 2

# Start servers without DEMO_MODE
echo "Starting frontend without DEMO_MODE..."
cd "/Users/ottoclarke/projects/Ralph's Civic Notices"
npm run dev:web > /tmp/dev-web-no-demo.log 2>&1 &
WEB_PID=$!
sleep 5

echo "Checking /login page without demo mode..."
echo "Navigate to: http://localhost:5173/login"
echo "Click: Council Portal"
echo "Expected: NO demo accounts section visible"
echo "Expected: Only support contact shown"
echo ""

echo "Press ENTER to continue to Test 2..."
read

# Kill servers
kill -9 $WEB_PID 2>/dev/null
kill -9 $(lsof -ti tcp:5173) 2>/dev/null
sleep 2

echo ""
echo "📝 Test 2: With DEMO_MODE=true"
echo "-------------------------------"
echo "Starting server WITH DEMO_MODE=true..."
echo ""

# Start servers with DEMO_MODE
echo "Starting frontend with DEMO_MODE=true..."
VITE_DEMO_MODE=true npm run dev:web > /tmp/dev-web-with-demo.log 2>&1 &
WEB_PID=$!
sleep 5

echo "Checking /login page WITH demo mode..."
echo "Navigate to: http://localhost:5173/login"
echo "Click: Council Portal"
echo "Expected: ✅ Demo accounts section VISIBLE"
echo "Expected: Amber warning box with 'Demo Mode - Development Only'"
echo "Expected: Clickable demo accounts"
echo ""

echo "Also check /auth/signin page:"
echo "Navigate to: http://localhost:5173/auth/signin"
echo "Expected: ✅ Demo accounts section VISIBLE"
echo ""

# Open browser
open http://localhost:5173/login
sleep 2
open http://localhost:5173/auth/signin

echo ""
echo "📊 Test Summary:"
echo "----------------"
echo "1. Without DEMO_MODE: Demo accounts should NOT appear"
echo "2. With DEMO_MODE=true: Demo accounts SHOULD appear"
echo "3. Demo section has amber warning styling"
echo "4. Demo section clearly states 'Development Only'"
echo ""
echo "Press ENTER to clean up..."
read

# Cleanup
kill -9 $WEB_PID 2>/dev/null
kill -9 $(lsof -ti tcp:5173) 2>/dev/null
kill -9 $(lsof -ti tcp:5174) 2>/dev/null

echo "✅ Test complete!"