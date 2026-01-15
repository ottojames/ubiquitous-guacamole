#!/bin/bash

echo "Testing US-0146: Practice Area Selection"
echo "========================================"

# Start with demo mode
export VITE_DEMO_MODE=true

# Test 1: Check if settings page loads
echo ""
echo "Test 1: Settings page loads with practice areas"
curl -s http://localhost:5173/f/wilson-partners/settings | grep -q "Practice Areas" && echo "✓ Practice Areas section found" || echo "✗ Practice Areas section NOT found"

# Test 2: Check if publish wizard filters based on practice areas
echo ""
echo "Test 2: Publish wizard respects practice area filtering"
curl -s http://localhost:5173/f/wilson-partners/publish/step-1 | grep -q "Select Notice Type" && echo "✓ Notice type selection page loads" || echo "✗ Notice type page failed to load"

echo ""
echo "Browser Testing Required:"
echo "------------------------"
echo "1. Open http://localhost:5173/f/wilson-partners/settings"
echo "2. Check 'Licensing' and 'Planning' checkboxes"
echo "3. Uncheck one - verify confirmation dialog appears"
echo "4. Save settings"
echo "5. Navigate to http://localhost:5173/f/wilson-partners/publish/step-1"
echo "6. Verify only Licensing and Planning notice types are shown"
echo ""
echo "Note: Practice areas saved to organization.practice_areas field"