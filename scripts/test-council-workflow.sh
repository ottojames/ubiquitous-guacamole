#!/bin/bash

# Council Workflow E2E Test Runner
# Convenience script to run council workflow tests with common options

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    Council Workflow E2E Test Runner${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Development server not detected on port 5173${NC}"
    echo -e "${YELLOW}   Starting dev server...${NC}"
    echo ""

    # Start dev server in background
    cd "$PROJECT_ROOT"
    npm run dev &
    DEV_SERVER_PID=$!

    # Wait for server to start
    echo -e "${BLUE}Waiting for server to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Server started successfully${NC}"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""

    # Check if server started
    if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${RED}✗ Failed to start development server${NC}"
        echo -e "${RED}  Please run 'npm run dev' manually and try again${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Development server detected on port 5173${NC}"
fi

echo ""

# Parse command line arguments
MODE="${1:-standard}"

case "$MODE" in
    "full"|"comprehensive")
        echo -e "${BLUE}Running comprehensive test suite...${NC}"
        npx playwright test e2e/council/notice-upload-and-representations.spec.ts
        ;;

    "simple"|"simplified")
        echo -e "${BLUE}Running simplified test suite...${NC}"
        npx playwright test e2e/council/simplified-workflow.spec.ts
        ;;

    "all")
        echo -e "${BLUE}Running all council tests...${NC}"
        npx playwright test e2e/council/
        ;;

    "headed"|"ui")
        echo -e "${BLUE}Running tests with visible browser...${NC}"
        npx playwright test e2e/council/notice-upload-and-representations.spec.ts --headed
        ;;

    "debug")
        echo -e "${BLUE}Running tests in debug mode...${NC}"
        npx playwright test e2e/council/notice-upload-and-representations.spec.ts --debug
        ;;

    "report")
        echo -e "${BLUE}Generating test report...${NC}"
        npx playwright test e2e/council/ --reporter=html
        echo ""
        echo -e "${GREEN}✓ Report generated${NC}"
        echo -e "${BLUE}Opening report...${NC}"
        npx playwright show-report
        ;;

    "workflow")
        echo -e "${BLUE}Running single workflow test (fast)...${NC}"
        npx playwright test e2e/council/simplified-workflow.spec.ts -g "complete workflow"
        ;;

    "help"|"--help"|"-h")
        echo "Usage: $0 [mode]"
        echo ""
        echo "Modes:"
        echo "  full, comprehensive  - Run comprehensive test suite (default)"
        echo "  simple, simplified   - Run simplified test suite"
        echo "  all                  - Run all council tests"
        echo "  headed, ui           - Run with visible browser"
        echo "  debug                - Run in debug mode (step-by-step)"
        echo "  report               - Generate and open HTML report"
        echo "  workflow             - Run single workflow test (fastest)"
        echo "  help                 - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                   # Run standard tests"
        echo "  $0 headed            # Watch tests run in browser"
        echo "  $0 debug             # Debug tests step-by-step"
        echo "  $0 report            # Generate HTML report"
        echo ""
        exit 0
        ;;

    *)
        echo -e "${BLUE}Running standard test suite...${NC}"
        npx playwright test e2e/council/notice-upload-and-representations.spec.ts
        ;;
esac

TEST_EXIT_CODE=$?

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Some tests failed (exit code: $TEST_EXIT_CODE)${NC}"
    echo -e "${YELLOW}  Run with 'debug' mode to investigate:${NC}"
    echo -e "${YELLOW}  $0 debug${NC}"
fi

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Cleanup
if [ ! -z "$DEV_SERVER_PID" ]; then
    echo -e "${YELLOW}Stopping development server (PID: $DEV_SERVER_PID)...${NC}"
    kill $DEV_SERVER_PID 2>/dev/null || true
fi

exit $TEST_EXIT_CODE
