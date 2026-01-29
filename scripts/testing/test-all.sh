#!/bin/bash

# Quick Test Runner for Civic Notices
# Run all tests and show summary

echo "🧪 Civic Notices Test Runner"
echo "================================"
echo ""

# Track results
TESTS_RUN=0
TESTS_PASSED=0

# Function to run test with nice output
run_test() {
    local NAME=$1
    local CMD=$2

    echo -n "Running $NAME... "
    TESTS_RUN=$((TESTS_RUN + 1))

    if eval "$CMD" > /dev/null 2>&1; then
        echo "✅ PASS"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "❌ FAIL"
    fi
}

# 1. Check environment
echo "📋 Environment Check"
echo "-------------------"
run_test "Node.js" "node --version"
run_test "NPM" "npm --version"
run_test "Environment file" "test -f .env"
echo ""

# 2. Code quality
echo "📝 Code Quality"
echo "--------------"
run_test "TypeScript compilation" "npm run typecheck 2>&1 | grep -q 'Found [0-9]* error' && exit 1 || exit 0"
run_test "Linting" "npm run lint 2>&1 | grep -q 'Found [0-9]* error' && exit 1 || exit 0"
echo ""

# 3. Unit tests
echo "🧬 Unit Tests"
echo "------------"
run_test "Vitest suite" "npm test"
echo ""

# 4. Build test
echo "🔨 Build Test"
echo "------------"
run_test "Server build" "npm run build:server"
run_test "Frontend build" "npm run build"
echo ""

# 5. Integration tests
echo "🔄 Integration Tests"
echo "-------------------"

# Start server for integration tests
echo "Starting dev server..."
npm run dev:server > /dev/null 2>&1 &
SERVER_PID=$!
sleep 5

run_test "Health check API" "curl -s http://localhost:5174/api/health | grep -q 'ok'"
run_test "Notice search API" "curl -s 'http://localhost:5174/api/notices/search?postcode=SW1A1AA' | grep -q 'notices'"

# Clean up
kill $SERVER_PID 2>/dev/null
echo ""

# 6. Database tests
echo "💾 Database Tests"
echo "----------------"
run_test "Database fix script" "test -f ralph-fix-database.sh"
run_test "Migration files" "test -d supabase/migrations"
echo ""

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo "Tests Run: $TESTS_RUN"
echo "Tests Passed: $TESTS_PASSED"
PASS_RATE=$((TESTS_PASSED * 100 / TESTS_RUN))
echo "Pass Rate: ${PASS_RATE}%"
echo ""

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo "✨ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi