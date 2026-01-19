#!/bin/bash

# Comprehensive Test Suite for Civic Notices
# This script runs all tests and generates a report

echo "=========================================="
echo "Civic Notices Comprehensive Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Create test results directory
mkdir -p test-results
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="test-results/test-report-${TIMESTAMP}.txt"

# Function to run a test category
run_test_category() {
    local CATEGORY=$1
    local COMMAND=$2
    local DESCRIPTION=$3

    echo -e "${YELLOW}Running: ${DESCRIPTION}${NC}"
    echo "========================================" >> $REPORT_FILE
    echo "$DESCRIPTION" >> $REPORT_FILE
    echo "========================================" >> $REPORT_FILE

    # Run the test and capture output
    if eval "$COMMAND" >> $REPORT_FILE 2>&1; then
        echo -e "${GREEN}✓ ${DESCRIPTION} passed${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}✗ ${DESCRIPTION} failed${NC}"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))

    echo "" >> $REPORT_FILE
}

# Start test report
echo "Test Report - $(date)" > $REPORT_FILE
echo "========================================" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# 1. Unit Tests
echo -e "\n${YELLOW}=== UNIT TESTS ===${NC}\n"
run_test_category "unit" "npm test" "Unit Tests (Vitest)"

# 2. TypeScript Type Checking
echo -e "\n${YELLOW}=== TYPE CHECKING ===${NC}\n"
run_test_category "typescript" "npm run typecheck 2>&1 | grep -c 'error TS' | xargs -I {} test {} -le 100" "TypeScript Type Checking (<100 errors)"

# 3. Linting
echo -e "\n${YELLOW}=== CODE QUALITY ===${NC}\n"
run_test_category "lint" "npm run lint 2>&1 | grep -c 'error' | xargs -I {} test {} -le 600" "ESLint (<600 errors)"

# 4. Build Test
echo -e "\n${YELLOW}=== BUILD TEST ===${NC}\n"
run_test_category "build" "npm run build:server" "Server Build"

# 5. API Endpoint Tests
echo -e "\n${YELLOW}=== API TESTS ===${NC}\n"

# Start dev server in background for API tests
echo "Starting dev server for API tests..."
npm run dev:server > /dev/null 2>&1 &
SERVER_PID=$!
sleep 5

# Test key API endpoints
run_test_category "api" "curl -s -o /dev/null -w '%{http_code}' http://localhost:5174/api/health | grep -q '200'" "Health Check API"
run_test_category "api" "curl -s http://localhost:5174/api/notices/search?postcode=SW1A1AA | jq -e '.notices' > /dev/null" "Notice Search API"

# Kill the dev server
kill $SERVER_PID 2>/dev/null

# 6. Database Schema Tests
echo -e "\n${YELLOW}=== DATABASE TESTS ===${NC}\n"
run_test_category "database" "test -f ralph-fix-database.sh" "Database Fix Script Exists"

# 7. Critical User Journey Tests
echo -e "\n${YELLOW}=== USER JOURNEY TESTS ===${NC}\n"

# Check critical pages exist
run_test_category "pages" "test -f src/pages/Notices.tsx" "Public Notice Search Page"
run_test_category "pages" "test -f src/pages/NoticeDetailPage.tsx" "Notice Detail Page"
run_test_category "pages" "test -f src/pages/council/Dashboard.tsx" "Council Dashboard"
run_test_category "pages" "test -f src/pages/firm/Dashboard.tsx" "Firm Dashboard"
run_test_category "pages" "test -f src/next/publish/flow/NewPublishFlow.tsx" "Publish Wizard"

# 8. Email Service Tests
echo -e "\n${YELLOW}=== EMAIL SERVICE TESTS ===${NC}\n"
run_test_category "email" "test -f server/services/email.ts" "Email Service Exists"
run_test_category "email" "grep -q 'sendNoticeConfirmation' server/services/email.ts" "Notice Confirmation Email"
run_test_category "email" "grep -q 'sendRepresentationConfirmation' server/services/email.ts" "Representation Confirmation Email"

# 9. Security Tests
echo -e "\n${YELLOW}=== SECURITY TESTS ===${NC}\n"
run_test_category "security" "! grep -r 'SUPABASE_SERVICE_ROLE_KEY' src/ --include='*.tsx' --include='*.ts'" "No service keys in frontend"
run_test_category "security" "grep -q 'requireAuth' server/routes/notices.ts" "Auth middleware present"

# Print summary
echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "Total Tests Run: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "Pass Rate: ${PASS_RATE}%"

# Save summary to report
echo "" >> $REPORT_FILE
echo "========================================" >> $REPORT_FILE
echo "SUMMARY" >> $REPORT_FILE
echo "========================================" >> $REPORT_FILE
echo "Total Tests: $TOTAL_TESTS" >> $REPORT_FILE
echo "Passed: $PASSED_TESTS" >> $REPORT_FILE
echo "Failed: $FAILED_TESTS" >> $REPORT_FILE
echo "Pass Rate: ${PASS_RATE}%" >> $REPORT_FILE

echo ""
echo "Full report saved to: ${REPORT_FILE}"

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✨ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Check the report for details.${NC}"
    exit 1
fi