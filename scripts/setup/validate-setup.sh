#!/bin/bash

# Civic Notices - Professional Testing Setup Validator
# Run this to check if your testing environment is ready

echo "╔════════════════════════════════════════════════╗"
echo "║   Civic Notices - Testing Setup Validator     ║"
echo "║          Acting like a 15-year Dev            ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0

echo "📁 Checking Professional Structure..."
echo "────────────────────────────────────"

# Check testing structure
if [ -f "docs/testing/TEST-TRACKING.md" ]; then
    echo -e "${GREEN}✅${NC} TEST-TRACKING.md exists"
    PASS=$((PASS+1))
else
    echo -e "${RED}❌${NC} TEST-TRACKING.md missing"
    FAIL=$((FAIL+1))
fi

if [ -f "docs/testing/TEST-RESULTS.md" ]; then
    echo -e "${GREEN}✅${NC} TEST-RESULTS.md exists"
    PASS=$((PASS+1))
else
    echo -e "${RED}❌${NC} TEST-RESULTS.md missing"
    FAIL=$((FAIL+1))
fi

if [ -f "docs/verified/VERIFIED-COMPLETE.md" ]; then
    echo -e "${GREEN}✅${NC} VERIFIED-COMPLETE.md exists"
    PASS=$((PASS+1))
else
    echo -e "${RED}❌${NC} VERIFIED-COMPLETE.md missing"
    FAIL=$((FAIL+1))
fi

if [ -f "docs/needs-work/NEEDS-WORK.md" ]; then
    echo -e "${GREEN}✅${NC} NEEDS-WORK.md exists"
    PASS=$((PASS+1))
else
    echo -e "${RED}❌${NC} NEEDS-WORK.md missing"
    FAIL=$((FAIL+1))
fi

if [ -f "PRD-ACTIVE.md" ]; then
    echo -e "${GREEN}✅${NC} PRD-ACTIVE.md (your real PRD) exists"
    PASS=$((PASS+1))
else
    echo -e "${RED}❌${NC} PRD-ACTIVE.md missing"
    FAIL=$((FAIL+1))
fi

echo ""
echo "📦 Checking Ralph's Archived Work..."
echo "────────────────────────────────────"

if [ -f "docs/phase1-ralph-attempt/PRD-ralph-attempt.md" ]; then
    echo -e "${GREEN}✅${NC} Ralph's PRD archived"
    PASS=$((PASS+1))
else
    echo -e "${YELLOW}⚠️${NC}  Ralph's PRD not archived"
fi

echo ""
echo "🔧 Checking Development Environment..."
echo "────────────────────────────────────"

# Check if npm is installed
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✅${NC} npm installed ($(npm -v))"
    PASS=$((PASS+1))
else
    echo -e "${RED}❌${NC} npm not found"
    FAIL=$((FAIL+1))
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} node_modules exists"
    PASS=$((PASS+1))
else
    echo -e "${RED}❌${NC} node_modules missing - run: npm install"
    FAIL=$((FAIL+1))
fi

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✅${NC} .env file exists"
    PASS=$((PASS+1))
else
    echo -e "${YELLOW}⚠️${NC}  .env missing - copy from .env.example"
fi

echo ""
echo "🌐 Checking Servers..."
echo "────────────────────────────────────"

# Check if port 5173 is available or in use
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅${NC} Frontend server running on :5173"
    PASS=$((PASS+1))
else
    echo -e "${YELLOW}⚠️${NC}  Frontend not running (run: npm run dev)"
fi

# Check if port 5174 is available or in use
if lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅${NC} API server running on :5174"
    PASS=$((PASS+1))
else
    echo -e "${YELLOW}⚠️${NC}  API not running (run: npm run dev)"
fi

echo ""
echo "📊 Testing Progress Check..."
echo "────────────────────────────────────"

if [ -f "docs/testing/TEST-TRACKING.md" ]; then
    TOTAL=$(grep -c "^⬜" docs/testing/TEST-TRACKING.md 2>/dev/null || echo "0")
    PASSED=$(grep -c "^✅" docs/testing/TEST-TRACKING.md 2>/dev/null || echo "0")
    FAILED=$(grep -c "^❌" docs/testing/TEST-TRACKING.md 2>/dev/null || echo "0")
    PARTIAL=$(grep -c "^⚠️" docs/testing/TEST-TRACKING.md 2>/dev/null || echo "0")

    echo "📋 Test Status:"
    echo "   Not Tested: $TOTAL"
    echo "   Passed: $PASSED"
    echo "   Failed: $FAILED"
    echo "   Partial: $PARTIAL"

    if [ "$TOTAL" -eq "49" ] && [ "$PASSED" -eq "0" ]; then
        echo -e "   ${YELLOW}⚠️${NC}  No tests completed yet - time to start!"
    elif [ "$PASSED" -gt "0" ]; then
        echo -e "   ${GREEN}✅${NC} Making progress! $PASSED tests passing"
    fi
else
    echo -e "${RED}❌${NC} Cannot read test tracking file"
fi

echo ""
echo "════════════════════════════════════════"
echo "📈 Setup Score: $PASS checks passed"
echo "════════════════════════════════════════"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 Everything looks good! You're ready to test like a pro.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run dev (if not already running)"
    echo "2. Open: docs/testing/TEST-TRACKING.md"
    echo "3. Start testing with FIX-001 (Authentication)"
    echo ""
    echo "Quick test all accounts:"
    echo "  curl http://localhost:5174/api/health"
else
    echo -e "${RED}⚠️  Some issues need fixing before you can test properly.${NC}"
    echo ""
    echo "Fix the ❌ items above, then run this script again."
fi

echo ""
echo "💡 Pro tip: Use 'npm run dev' in one terminal, test in another"
echo "📚 Documentation: docs/testing/README.md"
echo ""
echo "Remember: It's not done until YOU test it! 🚀"
echo ""