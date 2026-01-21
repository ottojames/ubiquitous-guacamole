#!/bin/bash

# Environment verification script for Civic Notices Platform
# Checks all required environment variables and server startup

ENV_FILE=".env"
PASS_COUNT=0
FAIL_COUNT=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

check_env_var() {
    local var_name=$1
    if grep -q "^${var_name}=" "$ENV_FILE" 2>/dev/null; then
        echo -e "${GREEN}PASS${NC}: $var_name exists in .env"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}FAIL${NC}: $var_name not found in .env"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

echo "============================================"
echo "Environment Verification Script"
echo "============================================"
echo ""

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}FAIL${NC}: .env file not found"
    echo "Please create .env file from .env.example"
    exit 1
fi

echo "Checking required environment variables..."
echo ""

# Check each required env var
check_env_var "RESEND_API_KEY"
check_env_var "VITE_SUPABASE_URL"
check_env_var "VITE_SUPABASE_ANON_KEY"
check_env_var "SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "============================================"
echo "Testing server startup..."
echo "============================================"
echo ""

# Kill any existing processes on ports 5173 and 5174
lsof -ti tcp:5173 | xargs kill -9 2>/dev/null || true
lsof -ti tcp:5174 | xargs kill -9 2>/dev/null || true
sleep 1

# Start the dev server in the background
npm run dev &
DEV_PID=$!

# Wait for server to start (timeout after 10 seconds)
TIMEOUT=10
ELAPSED=0
SERVER_STARTED=false

while [ $ELAPSED -lt $TIMEOUT ]; do
    sleep 1
    ELAPSED=$((ELAPSED + 1))

    # Check if server is responding on port 5174
    if curl -s http://localhost:5174/api/health > /dev/null 2>&1; then
        SERVER_STARTED=true
        break
    fi

    # Also check logs for the startup message
    if lsof -i tcp:5174 > /dev/null 2>&1; then
        SERVER_STARTED=true
        break
    fi
done

# Kill the dev server
kill $DEV_PID 2>/dev/null || true
# Also kill any child processes (vite, etc.)
pkill -P $DEV_PID 2>/dev/null || true
lsof -ti tcp:5174 | xargs kill -9 2>/dev/null || true
lsof -ti tcp:5173 | xargs kill -9 2>/dev/null || true

if [ "$SERVER_STARTED" = true ]; then
    echo -e "${GREEN}PASS${NC}: Server started successfully (detected within ${ELAPSED}s)"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}FAIL${NC}: Server did not start within ${TIMEOUT}s timeout"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo ""
echo "============================================"
echo "Summary"
echo "============================================"
echo -e "Passed: ${GREEN}${PASS_COUNT}${NC}"
echo -e "Failed: ${RED}${FAIL_COUNT}${NC}"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}Verification FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}All checks PASSED${NC}"
    exit 0
fi
