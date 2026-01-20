#!/bin/bash

# =====================================================
# CIVIC NOTICES - DEMO SETUP SCRIPT
# =====================================================
# This script sets up demo accounts and councils in Supabase
#
# Usage: ./setup-demo-accounts.sh
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}    Civic Notices - Demo Account Setup        ${NC}"
echo -e "${BLUE}================================================${NC}"
echo

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}✗ .env file not found${NC}"
    echo "Please create a .env file with your Supabase credentials"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}✗ DATABASE_URL not found in .env${NC}"
    echo "Please add DATABASE_URL to your .env file"
    exit 1
fi

echo
echo -e "${YELLOW}Setting up demo accounts in Supabase...${NC}"
echo

# Run the SQL migration
echo -e "${BLUE}Running SQL migration...${NC}"
psql "$DATABASE_URL" < supabase/migrations/20260115_setup_demo_auth.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Demo accounts created successfully!${NC}"
    echo
    echo -e "${BLUE}Demo Accounts:${NC}"
    echo -e "${GREEN}Council Portal:${NC}"
    echo "  • Email: licensing@sampletonborough.gov.uk"
    echo "  • Password: testpass123"
    echo "  • Name: Sarah Wilson (Sampletonborough Licensing)"
    echo
    echo "  • Email: licensing@westminster.gov.uk"
    echo "  • Password: testpass123"
    echo "  • Name: Westminster Licensing"
    echo
    echo -e "${GREEN}Professional Portal:${NC}"
    echo "  • Email: solicitor@wilsonpartners.com"
    echo "  • Password: testpass123"
    echo "  • Name: Emma Thompson (Wilson & Partners)"
    echo
    echo -e "${BLUE}Organizations Created:${NC}"
    echo "  ✓ Sampletonborough Council"
    echo "  ✓ Westminster Council"
    echo "  ✓ Wilson & Partners LLP"
    echo
    echo -e "${GREEN}✓ Setup complete! You can now login with demo accounts.${NC}"
else
    echo -e "${RED}✗ Error running SQL migration${NC}"
    echo "Please check your database connection and try again"
    exit 1
fi

echo
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Next steps:${NC}"
echo "1. Start the dev server: npm run dev"
echo "2. Navigate to http://localhost:5173/login"
echo "3. Test with the demo accounts above"
echo -e "${BLUE}================================================${NC}"