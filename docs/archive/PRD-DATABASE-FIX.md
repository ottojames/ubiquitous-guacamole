# PRD: Database Schema & RLS Policy Normalization
## Product Requirements Document - Critical Database Fixes

### Executive Summary
The Public Notice Portal is experiencing critical database schema mismatches and RLS policy conflicts that are blocking core functionality. This PRD defines a comprehensive solution to normalize the database schema, fix RLS policies, and implement automated monitoring to prevent future issues.

### Current Problems
1. **Schema Mismatches**: Column naming inconsistencies (contact_email vs email)
2. **RLS Policy Recursion**: Infinite loops in row-level security policies
3. **Missing Constraints**: Lack of foreign key constraints and indexes
4. **No Schema Versioning**: No tracking of schema state vs code expectations
5. **Manual Fixes Required**: Each issue requires manual intervention

### Success Criteria
- [ ] Zero database-related 500 errors
- [ ] All schema columns match code expectations
- [ ] RLS policies work without recursion
- [ ] Automated schema validation on every deploy
- [ ] Single command to fix all known issues

## Technical Requirements

### 1. Schema Normalization

#### 1.1 Email Column Standardization
**Requirement**: All email columns must be named `email` (not `contact_email`)

**Affected Tables**:
- `organizations` - FIXED ✓
- `departments` - FIXED ✓
- `clients` - PENDING
- `firm_clients` - PENDING
- `councils` - PENDING
- `council_settings` - Multiple columns need review
- `notices` - Has both `applicant_email` and `contact_email`

**Action**: Rename all `contact_email` columns to `email` except where prefix is needed (e.g., `applicant_email`)

#### 1.2 Foreign Key Constraints
**Requirement**: All relationships must have proper foreign key constraints

**Missing Constraints**:
```sql
-- department_memberships -> departments
ALTER TABLE department_memberships
ADD CONSTRAINT fk_department_memberships_department
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;

-- department_memberships -> users
ALTER TABLE department_memberships
ADD CONSTRAINT fk_department_memberships_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- departments -> organizations
ALTER TABLE departments
ADD CONSTRAINT fk_departments_organization
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
```

### 2. RLS Policy Fixes

#### 2.1 Department Memberships
**Current Issue**: Infinite recursion in SELECT policy
**Solution**: Simplified non-recursive policies - COMPLETED ✓

#### 2.2 Organizations
**Requirement**: Users can only see organizations they belong to
```sql
CREATE POLICY "Users view own organizations"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT d.organization_id
    FROM departments d
    JOIN department_memberships dm ON dm.department_id = d.id
    WHERE dm.user_id = auth.uid()
  )
);
```

#### 2.3 Departments
**Requirement**: Users can only see departments in their organizations
```sql
CREATE POLICY "Users view accessible departments"
ON departments FOR SELECT
USING (
  organization_id IN (
    SELECT d.organization_id
    FROM departments d
    JOIN department_memberships dm ON dm.department_id = d.id
    WHERE dm.user_id = auth.uid()
  )
);
```

### 3. Automated Validation System

#### 3.1 Schema Validation Script
Create `/scripts/validate-schema.ts`:
```typescript
interface SchemaExpectation {
  table: string;
  columns: string[];
  constraints?: string[];
}

const EXPECTED_SCHEMA: SchemaExpectation[] = [
  {
    table: 'organizations',
    columns: ['id', 'type', 'name', 'slug', 'email', 'status'],
    constraints: ['organizations_pkey', 'organizations_slug_key']
  },
  {
    table: 'departments',
    columns: ['id', 'organization_id', 'name', 'slug', 'email', 'type', 'status'],
    constraints: ['departments_pkey', 'fk_departments_organization']
  },
  // ... more tables
];
```

#### 3.2 RLS Policy Validation
Check for:
- Recursive policies (queries to same table in USING clause)
- Missing policies on sensitive tables
- Overly permissive policies

### 4. Migration Strategy

#### Phase 1: Immediate Fixes (TODAY)
1. Fix all `contact_email` → `email` columns
2. Remove recursive RLS policies
3. Add missing foreign key constraints

#### Phase 2: Validation (THIS WEEK)
1. Implement schema validation script
2. Add to CI/CD pipeline
3. Create monitoring dashboard

#### Phase 3: Prevention (NEXT WEEK)
1. Lock down direct database access
2. All schema changes through migrations only
3. Automated rollback on validation failure

### 5. Ralph Automation Command

Create a single command that:
1. Backs up current schema
2. Runs all fixes
3. Validates the result
4. Rolls back if validation fails

## Implementation Plan

### Day 1: Critical Fixes
- [x] Fix department_memberships RLS recursion
- [x] Fix organizations.email column
- [x] Fix departments.email column
- [ ] Fix remaining email columns
- [ ] Add foreign key constraints

### Day 2: Validation
- [ ] Create schema validation script
- [ ] Document all expected schemas
- [ ] Test validation against production

### Day 3: Automation
- [ ] Create Ralph fix command
- [ ] Add to CI/CD
- [ ] Deploy monitoring

## Testing Requirements

### Unit Tests
- Schema validation logic
- RLS policy checker
- Migration rollback

### Integration Tests
- Council registration flow
- User authentication
- Department switching
- Notice creation

### E2E Tests
- Full user journey from registration to notice publication
- Multi-tenant access control
- Permission boundaries

## Monitoring & Alerts

### Metrics to Track
- Database error rate (target: 0%)
- Schema validation pass rate (target: 100%)
- RLS policy performance (no timeouts)
- Migration success rate (target: 100%)

### Alerts
- Any 500 error with "infinite recursion"
- Schema validation failure
- Foreign key constraint violations
- RLS policy timeouts

## Rollback Plan

If issues occur:
1. Immediate: Restore from backup
2. Disable RLS temporarily if needed
3. Revert to previous schema version
4. Run validation to confirm state

## Success Metrics

### Week 1
- Zero database-related errors
- All schema validations passing
- Ralph command working

### Month 1
- 100% uptime for database operations
- Zero manual interventions required
- Automated monitoring in place

### Quarter 1
- Full schema documentation
- Automated testing coverage > 90%
- Zero schema-related incidents

## Appendix: Current Schema Issues

### Known Issues (As of Jan 19, 2026)
1. ✅ FIXED: departments.contact_email → email
2. ✅ FIXED: organizations.contact_email → email
3. ✅ FIXED: department_memberships RLS recursion
4. ⚠️ PENDING: clients.contact_email
5. ⚠️ PENDING: firm_clients.contact_email
6. ⚠️ PENDING: council_settings multiple email columns
7. ⚠️ PENDING: Missing foreign key constraints
8. ⚠️ PENDING: No indexes on frequently queried columns

### Code Files Affected
- `/server/routes/registration.ts` - ✅ Updated
- `/src/contexts/SwitchContext.tsx` - Uses department_memberships
- `/src/pages/firm/*.tsx` - May reference firm_clients
- `/server/services/*.ts` - Various database queries

---

## Ralph Command Implementation

See `/ralph-fix-database.sh` for the automated fix command.