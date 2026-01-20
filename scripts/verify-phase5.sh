#!/bin/bash
# Phase 5 Authentication Unification - Quick Verification Script
# Tests the most critical aspects of Ralph's implementation

set -e

echo "================================================"
echo "Phase 5 Authentication - Quick Verification"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Test result function
test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
    ((FAILED++))
  fi
}

warning() {
  echo -e "${YELLOW}⚠ WARN${NC}: $1"
  ((WARNINGS++))
}

info() {
  echo -e "ℹ INFO: $1"
}

# Check we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: Not in project root directory${NC}"
  echo "Please run from: /Users/ottoclarke/projects/Ralph's Civic Notices"
  exit 1
fi

echo "Step 1: Checking Environment Setup"
echo "-----------------------------------"

# Check .env file exists
if [ -f ".env" ]; then
  test_result 0 ".env file exists"
else
  test_result 1 ".env file missing - copy from .env.example"
fi

# Check for required env vars
if grep -q "VITE_SUPABASE_URL" .env 2>/dev/null; then
  test_result 0 "VITE_SUPABASE_URL configured"
else
  test_result 1 "VITE_SUPABASE_URL missing in .env"
fi

if grep -q "VITE_SUPABASE_ANON_KEY" .env 2>/dev/null; then
  test_result 0 "VITE_SUPABASE_ANON_KEY configured"
else
  test_result 1 "VITE_SUPABASE_ANON_KEY missing in .env"
fi

if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env 2>/dev/null; then
  test_result 0 "SUPABASE_SERVICE_ROLE_KEY configured"
else
  warning "SUPABASE_SERVICE_ROLE_KEY missing (needed for admin operations)"
fi

echo ""
echo "Step 2: Checking Migration Files"
echo "---------------------------------"

# Check migration files exist
if [ -f "supabase/migrations/20260122000001_unified_auth_system.sql" ]; then
  test_result 0 "Migration 1: unified_auth_system.sql exists"
else
  test_result 1 "Migration 1 file missing"
fi

if [ -f "supabase/migrations/20260122000002_jwt_custom_claims.sql" ]; then
  test_result 0 "Migration 2: jwt_custom_claims.sql exists"
else
  test_result 1 "Migration 2 file missing"
fi

if [ -f "supabase/migrations/20260122000003_unified_rls_policies.sql" ]; then
  test_result 0 "Migration 3: unified_rls_policies.sql exists"
else
  test_result 1 "Migration 3 file missing"
fi

echo ""
echo "Step 3: Checking Frontend Components"
echo "-------------------------------------"

# Check UnifiedAuthContext
if [ -f "src/contexts/UnifiedAuthContext.tsx" ]; then
  test_result 0 "UnifiedAuthContext.tsx exists"

  # Check it exports the right functions
  if grep -q "switchOrganization" src/contexts/UnifiedAuthContext.tsx; then
    test_result 0 "switchOrganization function implemented"
  else
    test_result 1 "switchOrganization function missing"
  fi

  if grep -q "switchDepartment" src/contexts/UnifiedAuthContext.tsx; then
    test_result 0 "switchDepartment function implemented"
  else
    test_result 1 "switchDepartment function missing"
  fi
else
  test_result 1 "UnifiedAuthContext.tsx missing"
fi

# Check DynamicCouncilSelect
if [ -f "src/components/DynamicCouncilSelect.tsx" ]; then
  test_result 0 "DynamicCouncilSelect.tsx exists"

  # Check it queries database
  if grep -q "active_councils" src/components/DynamicCouncilSelect.tsx; then
    test_result 0 "Uses active_councils view (not static JSON)"
  else
    warning "May not be using active_councils view"
  fi
else
  test_result 1 "DynamicCouncilSelect.tsx missing"
fi

# Check AuthDebug page
if [ -f "src/pages/AuthDebug.tsx" ]; then
  test_result 0 "AuthDebug.tsx page exists"
else
  test_result 1 "AuthDebug.tsx page missing"
fi

echo ""
echo "Step 4: Checking Server Files"
echo "------------------------------"

# Check server is configured correctly
if grep -q "UnifiedAuth" server/index.ts 2>/dev/null; then
  warning "Server may have references to unified auth (check if needed)"
fi

echo ""
echo "Step 5: Checking Dependencies"
echo "------------------------------"

# Check node_modules exists
if [ -d "node_modules" ]; then
  test_result 0 "node_modules directory exists"
else
  test_result 1 "node_modules missing - run 'npm install'"
fi

# Check for React 19
if [ -f "package.json" ]; then
  if grep -q '"react": "19' package.json; then
    test_result 0 "React 19 installed"
  else
    warning "React version may not be 19.x"
  fi
fi

echo ""
echo "Step 6: Testing Development Servers"
echo "------------------------------------"

info "Checking if servers are already running..."

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null 2>&1; then
  test_result 0 "Frontend server running on port 5173"
else
  warning "Frontend not running - start with 'npm run dev:web'"
fi

# Check if backend is running
if curl -s http://localhost:5174/api/health > /dev/null 2>&1; then
  test_result 0 "Backend server running on port 5174"
else
  warning "Backend not running - start with 'npm run dev:server'"
fi

echo ""
echo "Step 7: Database Connection Test"
echo "---------------------------------"

# Try to test database connection (requires server running)
if curl -s http://localhost:5174/api/health > /dev/null 2>&1; then
  HEALTH_RESPONSE=$(curl -s http://localhost:5174/api/health)

  if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    test_result 0 "API health check returns OK"
  else
    test_result 1 "API health check failed"
  fi
else
  warning "Cannot test database - server not running"
fi

echo ""
echo "================================================"
echo "Verification Summary"
echo "================================================"
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${RED}Failed:${NC}   $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All critical checks passed!${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Ensure both servers are running: npm run dev"
  echo "2. Apply database migrations (see docs/PHASE5_AUTH_TESTING_GUIDE.md)"
  echo "3. Enable JWT hook in Supabase Dashboard"
  echo "4. Test authentication at http://localhost:5173/auth/signin"
  echo "5. Check auth debug page at http://localhost:5173/auth-debug"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Some checks failed - please fix before proceeding${NC}"
  echo ""
  echo "See docs/PHASE5_AUTH_TESTING_GUIDE.md for detailed troubleshooting"
  echo ""
  exit 1
fi
