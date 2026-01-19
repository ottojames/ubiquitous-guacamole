# Ralph CI/CD Integration Guide

## Overview

Ralph's database fix automation is now integrated into the CI/CD pipeline, ensuring database schema consistency and preventing common failures from recurring.

## What Ralph CI/CD Does

### On Every Pull Request
- **Dry Run Check**: Identifies schema issues without making changes
- **Reports**: Shows what would be fixed when merged
- **Non-Blocking**: Won't fail the PR, just provides information

### On Merge to Main/Master/Develop
- **Auto-Fix**: Automatically applies all database fixes
- **Schema Normalization**: Ensures email columns are named correctly
- **RLS Policy Fix**: Removes recursive policies that cause infinite loops
- **Performance**: Adds missing indexes for query optimization
- **Constraints**: Adds foreign key relationships

### Manual Trigger (Emergency Fixes)
- **On-Demand**: Can be triggered manually from GitHub Actions
- **Options**: Choose dry-run or apply mode
- **Verbose Output**: Get detailed logs of what's being fixed

## Setup Instructions

### 1. Add Repository Secrets

Go to Settings → Secrets and variables → Actions and add:

```
DATABASE_URL = postgres://username:password@host:port/database
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
```

For production deployments, also add:
```
PRODUCTION_DATABASE_URL = postgres://prod-username:password@prod-host:port/database
```

### 2. Enable GitHub Actions

Ensure GitHub Actions are enabled for your repository:
- Go to Settings → Actions → General
- Select "Allow all actions and reusable workflows"

### 3. Verify Workflow

The workflow is automatically triggered on:
- Push to main, master, or develop branches
- Pull requests
- Manual dispatch from Actions tab

## How It Works

### PR Workflow
```mermaid
graph LR
    A[PR Created] --> B[Ralph Dry Run]
    B --> C{Issues Found?}
    C -->|Yes| D[Report Issues]
    C -->|No| E[All Good]
    D --> F[PR Can Merge]
    E --> F
```

### Merge Workflow
```mermaid
graph LR
    A[Merge to Main] --> B[Ralph Auto-Fix]
    B --> C[Fix Email Columns]
    C --> D[Fix RLS Policies]
    D --> E[Add Constraints]
    E --> F[Add Indexes]
    F --> G[Validate]
    G --> H[Deploy Ready]
```

## Common Issues Fixed

### 1. Email Column Naming
**Problem**: Tables have `contact_email` instead of `email`
**Fix**: Automatically renames columns to `email`
**Tables affected**: organizations, departments, clients, firm_clients

### 2. Infinite Recursion RLS
**Problem**: RLS policies reference themselves causing infinite loops
**Error**: "infinite recursion detected in policy for relation department_memberships"
**Fix**: Drops recursive policies, creates simple non-recursive ones

### 3. Missing Indexes
**Problem**: Slow queries due to missing indexes
**Fix**: Adds indexes on commonly queried columns:
- department_memberships.user_id
- department_memberships.department_id
- departments.organization_id

### 4. Missing Foreign Keys
**Problem**: Data integrity issues
**Fix**: Adds proper foreign key constraints between tables

## Manual Intervention

### Running Ralph Locally

If you need to fix database issues immediately:

```bash
# Dry run (see what would be fixed)
./ralph-fix-database.sh --dry-run --verbose

# Apply fixes
./ralph-fix-database.sh --verbose
```

### Triggering from GitHub

1. Go to Actions tab in GitHub
2. Select "Ralph Database Fix CI/CD"
3. Click "Run workflow"
4. Choose options:
   - Dry run: true/false
   - Verbose: true/false
5. Click "Run workflow"

## Monitoring

### Check Workflow Status
- Go to Actions tab
- Look for "Ralph Database Fix CI/CD"
- Green check = Success
- Yellow = Running
- Red X = Failed (check logs)

### View Reports
Each workflow run generates a summary report showing:
- Issues found
- Fixes applied
- Validation results
- Performance metrics

## Emergency Procedures

### If Ralph Fails in Production

1. **Check Logs**: Go to Actions → Failed workflow → View logs
2. **Common Fixes**:
   - Wrong DATABASE_URL: Update secret in repository settings
   - Permission denied: Ensure service role key has admin privileges
   - Connection timeout: Check Supabase service status
3. **Manual Override**: Run fixes directly in Supabase SQL Editor

### Rollback Procedure

If Ralph's fixes cause issues:

```sql
-- Rollback email columns
ALTER TABLE organizations RENAME COLUMN email TO contact_email;
ALTER TABLE departments RENAME COLUMN email TO contact_email;
ALTER TABLE clients RENAME COLUMN email TO contact_email;
ALTER TABLE firm_clients RENAME COLUMN email TO contact_email;

-- Restore old RLS policies
-- (Copy from backup or previous migration)
```

## Best Practices

### Before Major Deployments
1. Run Ralph manually with dry-run
2. Review the report
3. Apply fixes if needed
4. Deploy with confidence

### After Database Migrations
1. Ralph will automatically run on merge
2. Check Actions tab for results
3. Verify application still works

### Weekly Maintenance
- Check Ralph reports in GitHub Actions
- Look for recurring issues
- Update ralph-fix-database.sh if new patterns emerge

## Integration with Other CI/CD Tools

### Jenkins
```groovy
stage('Ralph Database Fix') {
    steps {
        sh './ralph-fix-database.sh --verbose'
    }
}
```

### GitLab CI
```yaml
ralph-fix:
  stage: pre-deploy
  script:
    - ./ralph-fix-database.sh --verbose
  only:
    - main
    - develop
```

### CircleCI
```yaml
- run:
    name: Ralph Database Fix
    command: |
      ./ralph-fix-database.sh --verbose
```

## Metrics and Success Criteria

Ralph tracks these metrics:
- **Fix Success Rate**: Should be 100%
- **Schema Drift**: Should be 0 after fixes
- **Query Performance**: < 100ms for all indexed queries
- **RLS Errors**: 0 infinite recursion errors

## Future Enhancements

Planned improvements for Ralph CI/CD:
- [ ] Slack notifications for fixes applied
- [ ] Automatic rollback on failure
- [ ] Performance regression detection
- [ ] Schema version tracking
- [ ] Multi-environment support (dev/staging/prod)

## Support

If Ralph isn't working as expected:
1. Check this documentation
2. Review workflow logs in GitHub Actions
3. Check ralph-fix-database.sh for recent changes
4. Open an issue with:
   - Error message
   - Workflow run URL
   - Database state description

---

*Ralph keeps your database boring and your deployments predictable.*