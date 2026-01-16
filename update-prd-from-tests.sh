#!/bin/bash

# Automated PRD Updater from Testing Log
# Run this after testing to automatically update PRD.md based on TESTING_LOG.md results

echo "╔══════════════════════════════════════════════╗"
echo "║     PRD Auto-Updater from Test Results      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Backup PRD first
cp PRD.md PRD.md.backup.$(date +%Y%m%d-%H%M%S)
echo "✅ Backed up PRD.md"

# Create temp file for processing
TEMP_FILE="temp_test_results.txt"
UPDATE_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0
PARTIAL_COUNT=0

echo ""
echo "📖 Reading test results from TESTING_LOG.md..."
echo ""

# Parse TESTING_LOG.md and extract test results
# This looks for patterns like:
# ### 3.1 FIX-001: Demo Authentication
# - **Status:** ❌ FAIL / ✅ PASS / ⚠️ PARTIAL

# Function to update PRD based on status
update_prd_section() {
    local section=$1
    local status=$2
    local comment=$3

    case "$status" in
        *"FAIL"*|*"❌"*)
            echo -e "${RED}❌ $section: FAILED${NC}"
            echo "   Updating PRD: [x] → [ ]"
            # Update the PRD.md file
            sed -i '' "s/### $section \[x\]/### $section \[ \]/g" PRD.md
            FAIL_COUNT=$((FAIL_COUNT+1))
            ;;
        *"PARTIAL"*|*"⚠️"*)
            echo -e "${YELLOW}⚠️  $section: PARTIAL${NC}"
            echo "   Updating PRD: [x] → [⚠️]"
            sed -i '' "s/### $section \[x\]/### $section \[⚠️\]/g" PRD.md
            PARTIAL_COUNT=$((PARTIAL_COUNT+1))
            ;;
        *"PASS"*|*"✅"*)
            echo -e "${GREEN}✅ $section: PASSED${NC}"
            echo "   PRD remains: [x]"
            PASS_COUNT=$((PASS_COUNT+1))
            ;;
    esac
    UPDATE_COUNT=$((UPDATE_COUNT+1))
}

# Parse critical fixes (3.x)
echo "🔍 Checking Critical Fixes (Section 3)..."
echo "────────────────────────────────────"

# FIX-001: Demo Authentication
if grep -q "Westminster.*Invalid credentials" TESTING_LOG.md; then
    update_prd_section "3.1" "PARTIAL" "Westminster auth broken"
fi

# FIX-002: Address Search
if grep -q "have to click twice\|defaults to list view" TESTING_LOG.md; then
    update_prd_section "3.2" "FAIL" "Double-click issue not fixed"
fi

# FIX-003: Map View
if grep -q "crowded and.*squeezed\|UI does not look great" TESTING_LOG.md; then
    update_prd_section "3.3" "PARTIAL" "UI needs improvement"
fi

# FIX-008: Representation Forms
if grep -q "pilot inn.*representation form" TESTING_LOG.md; then
    update_prd_section "3.8" "PARTIAL" "Some notices missing forms"
fi

# FIX-009: Radius Circle
if grep -q "radius.*unnecessary" TESTING_LOG.md; then
    update_prd_section "3.9" "FAIL" "Radius still showing"
fi

echo ""
echo "🔍 Checking User Stories (Section 2)..."
echo "────────────────────────────────────"

# Check for blocked tests due to login issues
if grep -q "cannot verify as cannot login" TESTING_LOG.md; then
    echo -e "${YELLOW}⚠️  Multiple tests blocked due to authentication issues${NC}"
    # Mark council-related stories as blocked
    for section in "2.2" "2.3" "2.4" "2.12" "2.13" "2.14" "2.25" "2.26" "2.27" "2.28" "2.29"; do
        sed -i '' "s/### $section \[x\]/### $section \[🔒\]/g" PRD.md
    done
fi

echo ""
echo "════════════════════════════════════════"
echo "📊 Update Summary"
echo "════════════════════════════════════════"
echo -e "${GREEN}✅ Passed:${NC} $PASS_COUNT"
echo -e "${YELLOW}⚠️  Partial:${NC} $PARTIAL_COUNT"
echo -e "${RED}❌ Failed:${NC} $FAIL_COUNT"
echo "📝 Total Updated: $UPDATE_COUNT"
echo ""

# Update evidence sections with test results
echo "📝 Adding test evidence to PRD..."

# Add test run timestamp to PRD
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
sed -i '' "s/\*\*Evidence:\*\* /\*\*Evidence:\*\* \[TEST RUN: $TIMESTAMP\] /g" PRD.md

echo ""
echo "✅ PRD.md has been automatically updated!"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff PRD.md"
echo "2. Commit if happy: git add PRD.md && git commit -m 'Update PRD from test results'"
echo "3. Create fix tickets: ./create-fix-tickets.sh"
echo ""