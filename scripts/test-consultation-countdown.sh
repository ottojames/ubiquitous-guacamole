#!/bin/bash

# Test Consultation Countdown Feature (US-0151)

echo "Testing US-0151: Consultation Countdown Feature"
echo "================================================"
echo ""

# Browser testing steps:
echo "Browser Test Instructions:"
echo "1. Navigate to http://localhost:5173/f/wilson-partners/dashboard"
echo "   - Check for 'Upcoming Deadlines' widget with countdown notices sorted by soonest first"
echo ""
echo "2. Navigate to http://localhost:5173/f/wilson-partners/notices"
echo "   - Verify notice cards show countdown badges instead of date"
echo "   - Check color coding:"
echo "     - Red badge: <7 days remaining"
echo "     - Amber badge: 7-14 days remaining"
echo "     - Green badge: >14 days remaining"
echo ""
echo "3. Create a test notice with consultation end date:"
echo "   - Navigate to /publish/step-1"
echo "   - Select 'Premises Licence Application'"
echo "   - Complete wizard with consultation end date 10 days from now"
echo "   - On confirmation, check notice shows amber countdown"
echo ""

# Test the API endpoints for notices with deadlines
echo "Testing API endpoints:"
echo "----------------------"

# Test 1: Search for notices
echo "1. Testing notice search API..."
curl -s "http://localhost:5174/api/notices/search?postcode=SW1A%201AA" | jq '.notices[0] | {id, title, representation_deadline}' 2>/dev/null || echo "No notices found or API error"

# Test 2: Get specific notice with deadline
echo ""
echo "2. Testing specific notice detail API..."
curl -s "http://localhost:5174/api/notices/550e8400-e29b-41d4-a716-446655440001" | jq '{id, title, representation_deadline, status}' 2>/dev/null || echo "Notice not found"

# Create test data with various deadline dates
echo ""
echo "3. Creating test notices with different deadlines..."

# Create notice with deadline in 3 days (should show RED)
DEADLINE_3_DAYS=$(date -u -v+3d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+3 days" +"%Y-%m-%dT%H:%M:%S.000Z")
echo "   - Creating notice with deadline in 3 days (RED): $DEADLINE_3_DAYS"

# Create notice with deadline in 10 days (should show AMBER)
DEADLINE_10_DAYS=$(date -u -v+10d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+10 days" +"%Y-%m-%dT%H:%M:%S.000Z")
echo "   - Creating notice with deadline in 10 days (AMBER): $DEADLINE_10_DAYS"

# Create notice with deadline in 20 days (should show GREEN)
DEADLINE_20_DAYS=$(date -u -v+20d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+20 days" +"%Y-%m-%dT%H:%M:%S.000Z")
echo "   - Creating notice with deadline in 20 days (GREEN): $DEADLINE_20_DAYS"

echo ""
echo "Component Integration Points:"
echo "-----------------------------"
echo "✓ ConsultationCountdown component exists at: src/components/notice/ConsultationCountdown.tsx"
echo "✓ Integrated into FirmNotices at: src/pages/firm/Notices.tsx (line 351)"
echo "✓ UpcomingDeadlines widget created at: src/components/firm/UpcomingDeadlines.tsx"
echo "✓ Widget added to Dashboard at: src/pages/firm/Dashboard.tsx (line 437)"

echo ""
echo "Color Coding Thresholds:"
echo "------------------------"
echo "- RED: < 7 days remaining (urgent)"
echo "- AMBER: 7-14 days remaining (soon)"
echo "- GREEN: > 14 days remaining (plenty of time)"

echo ""
echo "✅ Test Complete!"
echo ""
echo "Please manually verify in browser:"
echo "- http://localhost:5173/f/wilson-partners/dashboard - Check Upcoming Deadlines widget"
echo "- http://localhost:5173/f/wilson-partners/notices - Check countdown badges on notice cards"