#!/bin/bash

echo "==============================================="
echo "US-0150: Live Representation Feed - Browser Test"
echo "==============================================="
echo ""
echo "This test will verify the Recent Representations widget on firm dashboard"
echo ""

# Check if servers are running
if ! lsof -ti tcp:5173 > /dev/null; then
    echo "ERROR: Web server not running on port 5173"
    echo "Run: npm run dev:web"
    exit 1
fi

if ! lsof -ti tcp:5174 > /dev/null; then
    echo "ERROR: API server not running on port 5174"
    echo "Run: npm run dev:server"
    exit 1
fi

echo "✓ Both servers running"
echo ""

echo "Test Steps:"
echo "==========="
echo ""
echo "1. Open browser to: http://localhost:5173/f/wilson-partners/dashboard"
echo ""
echo "2. Look for 'Recent Representations' widget on the dashboard"
echo "   - Should show between Quick Actions and Recent Notices"
echo "   - Has purple icon and 'Last 7 days' badge"
echo "   - Shows refresh button and last update time"
echo ""
echo "3. The widget should display:"
echo "   - 3 mock representations (if no database data)"
echo "   - Each showing: stance icon (thumbs up/down), notice type badge, respondent name"
echo "   - Preview text and 'View full representation' link"
echo "   - Total count at bottom: '3 total representations in the last 7 days'"
echo ""
echo "4. Click the refresh button (circular arrow icon)"
echo "   - Update time should change"
echo ""
echo "5. For real-time test (optional):"
echo "   - Publish a test notice from the firm"
echo "   - Open incognito window and submit a representation"
echo "   - Return to firm dashboard and refresh"
echo "   - New representation should appear in the widget"
echo ""

# Try to open browser automatically
if command -v open > /dev/null; then
    echo "Opening browser..."
    open "http://localhost:5173/f/wilson-partners/dashboard"
else
    echo "Please open your browser manually to the URL above"
fi

echo ""
echo "Expected Result:"
echo "================"
echo "✓ Recent Representations widget visible on firm dashboard"
echo "✓ Shows representations from last 7 days"
echo "✓ Each entry shows stance, notice ref, date, preview text"
echo "✓ Updates in real-time or on refresh"
echo "✓ Links to full representation details work"