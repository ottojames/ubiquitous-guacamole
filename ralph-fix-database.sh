#!/bin/bash

# Ralph's Database Fix Command - Automatic Schema & RLS Repair
# Usage: ./ralph-fix-database.sh [--dry-run] [--verbose]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection details
DB_HOST="aws-1-eu-west-2.pooler.supabase.com"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres.puemqhpqxgrvrukyrfkm"
DB_PASS="94EZXtBLTgr8VVIL"

# Parse arguments
DRY_RUN=false
VERBOSE=false
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      ;;
    --verbose)
      VERBOSE=true
      ;;
  esac
done

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Execute SQL with error handling
execute_sql() {
  local sql="$1"
  local description="$2"

  if [ "$VERBOSE" = true ]; then
    log_info "Executing: $description"
    echo "$sql"
  fi

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN - Would execute: $description"
    return 0
  fi

  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -c "$sql" -q 2>&1 | {
    while IFS= read -r line; do
      if [[ "$line" == *"ERROR"* ]]; then
        log_error "$line"
        return 1
      elif [[ "$line" == *"NOTICE"* ]] && [ "$VERBOSE" = true ]; then
        echo "$line"
      fi
    done
    return 0
  }

  if [ $? -eq 0 ]; then
    log_success "$description"
  else
    log_error "Failed: $description"
    return 1
  fi
}

# Main execution
echo "========================================="
echo "Ralph's Database Fix Command v2.0"
echo "EXTREME DETAIL MODE - FIXING BORING FAILURES"
echo "========================================="
echo ""
echo "Starting at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

if [ "$DRY_RUN" = true ]; then
  log_warning "Running in DRY RUN mode - no changes will be made"
fi

# Step 1: Fix Email Columns
log_info "Step 1: Fixing email column names..."

execute_sql "
DO \$\$
DECLARE
  rec RECORD;
  sql_cmd TEXT;
BEGIN
  -- Fix organizations table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations'
    AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE organizations RENAME COLUMN contact_email TO email;
    RAISE NOTICE 'Fixed: organizations.contact_email -> email';
  END IF;

  -- Fix departments table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'departments'
    AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE departments RENAME COLUMN contact_email TO email;
    RAISE NOTICE 'Fixed: departments.contact_email -> email';
  END IF;

  -- Fix clients table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients'
    AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE clients RENAME COLUMN contact_email TO email;
    RAISE NOTICE 'Fixed: clients.contact_email -> email';
  END IF;

  -- Fix firm_clients table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firm_clients'
    AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE firm_clients RENAME COLUMN contact_email TO email;
    RAISE NOTICE 'Fixed: firm_clients.contact_email -> email';
  END IF;
END \$\$;
" "Standardizing email column names"

# Step 2: Fix RLS Policies
log_info "Step 2: Fixing RLS policies..."

execute_sql "
-- Drop problematic recursive policies
DROP POLICY IF EXISTS \"Members can view dept memberships\" ON department_memberships;
DROP POLICY IF EXISTS \"Users can view department colleagues\" ON department_memberships;

-- Create clean non-recursive policies
DO \$\$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'department_memberships'
    AND policyname = 'Users view own memberships only'
  ) THEN
    CREATE POLICY \"Users view own memberships only\"
    ON department_memberships
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'department_memberships'
    AND policyname = 'Users manage own memberships'
  ) THEN
    CREATE POLICY \"Users manage own memberships\"
    ON department_memberships
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END \$\$;
" "Fixing RLS policies to prevent recursion"

# Step 3: Add Missing Foreign Key Constraints
log_info "Step 3: Adding missing foreign key constraints..."

execute_sql "
DO \$\$
BEGIN
  -- Add FK: department_memberships -> departments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_department_memberships_department'
  ) THEN
    ALTER TABLE department_memberships
    ADD CONSTRAINT fk_department_memberships_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: department_memberships -> departments';
  END IF;

  -- Add FK: department_memberships -> auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_department_memberships_user'
  ) THEN
    ALTER TABLE department_memberships
    ADD CONSTRAINT fk_department_memberships_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: department_memberships -> auth.users';
  END IF;

  -- Add FK: departments -> organizations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_departments_organization'
  ) THEN
    ALTER TABLE departments
    ADD CONSTRAINT fk_departments_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: departments -> organizations';
  END IF;
END \$\$;
" "Adding foreign key constraints"

# Step 4: Add Missing Indexes
log_info "Step 4: Adding performance indexes..."

execute_sql "
DO \$\$
BEGIN
  -- Index on department_memberships.user_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'department_memberships'
    AND indexname = 'idx_department_memberships_user_id'
  ) THEN
    CREATE INDEX idx_department_memberships_user_id
    ON department_memberships(user_id);
    RAISE NOTICE 'Added index: department_memberships.user_id';
  END IF;

  -- Index on department_memberships.department_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'department_memberships'
    AND indexname = 'idx_department_memberships_department_id'
  ) THEN
    CREATE INDEX idx_department_memberships_department_id
    ON department_memberships(department_id);
    RAISE NOTICE 'Added index: department_memberships.department_id';
  END IF;

  -- Index on departments.organization_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'departments'
    AND indexname = 'idx_departments_organization_id'
  ) THEN
    CREATE INDEX idx_departments_organization_id
    ON departments(organization_id);
    RAISE NOTICE 'Added index: departments.organization_id';
  END IF;
END \$\$;
" "Adding performance indexes"

# Step 5: Validate Schema
log_info "Step 5: Validating schema..."

VALIDATION_ERRORS=0

# Check organizations table
RESULT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -t -c "
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_name = 'organizations'
  AND column_name = 'email';
" 2>/dev/null | tr -d ' ')

if [ "$RESULT" != "1" ]; then
  log_error "organizations.email column not found"
  VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
else
  log_success "organizations.email column exists"
fi

# Check departments table
RESULT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -t -c "
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_name = 'departments'
  AND column_name = 'email';
" 2>/dev/null | tr -d ' ')

if [ "$RESULT" != "1" ]; then
  log_error "departments.email column not found"
  VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
else
  log_success "departments.email column exists"
fi

# Check RLS policies
RESULT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -t -c "
  SELECT COUNT(*) FROM pg_policies
  WHERE tablename = 'department_memberships'
  AND policyname IN ('Users view own memberships only', 'Users manage own memberships');
" 2>/dev/null | tr -d ' ')

if [ "$RESULT" != "2" ]; then
  log_error "RLS policies not properly configured"
  VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
else
  log_success "RLS policies configured correctly"
fi

# Final Report
echo ""
echo "========================================="
echo "Database Fix Complete"
echo "========================================="

if [ $VALIDATION_ERRORS -eq 0 ]; then
  log_success "All validations passed!"
  echo ""
  echo "✅ Email columns standardized"
  echo "✅ RLS policies fixed"
  echo "✅ Foreign keys added"
  echo "✅ Indexes created"
  echo ""
  log_success "Your database is now properly configured!"
else
  log_error "Found $VALIDATION_ERRORS validation errors"
  echo ""
  echo "Please review the errors above and run the script again."
  exit 1
fi

# Restart suggestion
if [ "$DRY_RUN" = false ]; then
  echo ""
  log_info "You should restart your development server:"
  echo "  npm run dev"
fi