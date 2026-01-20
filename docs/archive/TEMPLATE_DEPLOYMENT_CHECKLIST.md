# Template Management System - Deployment Checklist

## Pre-Deployment Verification

### Code Quality
- [x] TypeScript compiles without new errors
- [x] All new files follow project conventions
- [x] Path aliases (@/*) used throughout
- [x] Error handling implemented
- [x] Console logging for debugging
- [x] No hardcoded credentials or sensitive data

### Testing
- [ ] All manual tests pass (see TEMPLATE_TESTING_GUIDE.md)
- [ ] Template creation works
- [ ] Template validation works
- [ ] Placeholder insertion works
- [ ] Publish flow uses custom templates
- [ ] Fallback to default templates works
- [ ] Database functions work correctly

### Documentation
- [x] Implementation summary complete
- [x] Testing guide created
- [x] Deployment checklist (this file)
- [x] Database migration documented
- [x] Known limitations listed
- [x] Troubleshooting guide included

## Deployment Steps

### Step 1: Database Migration (10 minutes)

#### Option A: Supabase CLI (Recommended)
```bash
# From project root
cd /Users/ottoclarke/projects/ubiquitous-guacamole

# Review migrations
cat supabase/migrations/20251117000001_template_text_support.sql
cat supabase/migrations/20251117000002_bristol_demo_template.sql

# Apply to development first (test)
supabase db push --project-ref <DEV_PROJECT_REF>

# Verify migrations applied
supabase db diff

# Apply to production
supabase db push --project-ref <PROD_PROJECT_REF>
```

#### Option B: Supabase Dashboard SQL Editor
1. Log into Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `20251117000001_template_text_support.sql`
4. Execute (wait for completion)
5. Verify no errors
6. Copy contents of `20251117000002_bristol_demo_template.sql`
7. Execute (wait for completion)
8. Verify Bristol templates created

#### Verification Queries
```sql
-- Check new columns added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'templates'
  AND column_name IN (
    'template_text',
    'placeholders',
    'required_placeholders',
    'is_validated',
    'validation_warnings',
    'is_active'
  );

-- Should return 6 rows

-- Check functions created
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'validate_template_placeholders',
    'get_active_template',
    'get_template_validation_report'
  );

-- Should return 3 rows

-- Check Bristol templates created
SELECT name, notice_type, is_validated
FROM templates
WHERE name LIKE 'Bristol%';

-- Should return 2 rows, both is_validated = TRUE
```

### Step 2: Build Application (5 minutes)

```bash
# Install dependencies (if needed)
npm install

# Type check
npm run typecheck
# Ignore pre-existing errors (not related to templates)

# Lint
npm run lint
# Fix any new issues in template files

# Build for production
npm run build

# Verify build succeeded
ls dist/
# Should see index.html, assets/, etc.
```

### Step 3: Deploy Frontend (Time varies by hosting)

#### Netlify
```bash
# Push to git (triggers auto-deploy)
git add .
git commit -m "feat: council template management system"
git push origin main

# Or manual deploy
netlify deploy --prod --dir=dist
```

#### Vercel
```bash
vercel --prod
```

#### Custom Server
```bash
# Copy dist/ to production server
scp -r dist/* user@server:/var/www/html/

# Restart web server
ssh user@server 'sudo systemctl restart nginx'
```

### Step 4: Verify Deployment (15 minutes)

#### Production Smoke Tests

1. **Template Management UI**
   - [ ] Navigate to `/c/bristol-city-council/licensing/templates`
   - [ ] Verify templates load
   - [ ] Create new template
   - [ ] Insert placeholder
   - [ ] Verify validation works
   - [ ] Save template

2. **Publish Flow Integration**
   - [ ] Navigate to `/publish/new`
   - [ ] Select "New Premises Licence"
   - [ ] Fill in details
   - [ ] Progress to review step
   - [ ] Verify custom template used
   - [ ] Check console logs

3. **Database Functions**
   - [ ] Run verification queries (see Step 1)
   - [ ] Test `get_active_template()` RPC
   - [ ] Verify validation report

4. **Error Scenarios**
   - [ ] Create template with missing placeholders
   - [ ] Verify validation warnings show
   - [ ] Publish notice for council without template
   - [ ] Verify fallback to default

#### Performance Checks
- [ ] Template editor loads in < 1 second
- [ ] Placeholder dropdown opens instantly
- [ ] Validation updates in real-time (< 100ms)
- [ ] Template fetch < 200ms
- [ ] Notice rendering < 100ms

#### Browser Compatibility
- [ ] Chrome: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Edge: All features work

## Post-Deployment Tasks

### Step 5: Data Seeding (Optional)

If Bristol templates not auto-created, manually create:

```sql
-- Use Supabase Dashboard SQL Editor
-- Copy from 20251117000002_bristol_demo_template.sql
-- Adjust organization/department IDs as needed
```

### Step 6: User Training Materials

Create for council admins:
- [ ] How to create templates (video or PDF)
- [ ] Placeholder reference guide
- [ ] Best practices document
- [ ] FAQ for common issues

### Step 7: Monitoring Setup

Add monitoring for:
- [ ] Template creation events (analytics)
- [ ] Custom template usage vs default (metrics)
- [ ] Validation failure rates
- [ ] Average placeholders per template
- [ ] Template fetch performance

#### Suggested Metrics
```sql
-- Usage statistics
SELECT
  COUNT(*) as total_templates,
  COUNT(*) FILTER (WHERE is_validated) as validated_templates,
  AVG(use_count) as avg_usage,
  MAX(use_count) as max_usage
FROM templates;

-- Popular placeholders
SELECT
  UNNEST(placeholders) as placeholder,
  COUNT(*) as usage_count
FROM templates
GROUP BY placeholder
ORDER BY usage_count DESC
LIMIT 10;

-- Validation issues
SELECT
  notice_type,
  UNNEST(validation_warnings) as warning,
  COUNT(*) as occurrence_count
FROM templates
WHERE NOT is_validated
GROUP BY notice_type, warning
ORDER BY occurrence_count DESC;
```

### Step 8: Rollback Plan

If issues found, rollback steps:

#### Database Rollback
```sql
-- Remove new columns (WARNING: loses data)
ALTER TABLE templates
  DROP COLUMN template_text,
  DROP COLUMN placeholders,
  DROP COLUMN required_placeholders,
  DROP COLUMN is_validated,
  DROP COLUMN validation_warnings,
  DROP COLUMN is_active;

-- Drop functions
DROP FUNCTION validate_template_placeholders();
DROP FUNCTION get_active_template(UUID, TEXT);
DROP FUNCTION get_template_validation_report();

-- Drop trigger
DROP TRIGGER templates_validate_placeholders ON templates;
```

#### Code Rollback
```bash
# Revert to previous commit
git revert <commit-hash>
git push origin main

# Or redeploy previous version
# (depends on hosting provider)
```

## Deployment Environments

### Development
- **URL**: http://localhost:5173
- **Database**: Supabase Dev Project
- **Testing**: Full test suite
- **Status**: ✅ Ready

### Staging (if available)
- **URL**: https://staging.notices.example.com
- **Database**: Supabase Staging Project
- **Testing**: Smoke tests
- **Status**: ⚠️ Optional

### Production
- **URL**: https://notices.example.com
- **Database**: Supabase Production Project
- **Testing**: Critical path only
- **Status**: ⬜ Pending

## Risk Assessment

### High Risk (P1 - Must address)
- None identified ✅

### Medium Risk (P2 - Should address)
- **Department ID resolution**: May need adjustment based on Council structure
  - **Mitigation**: Test with multiple councils, adjust if needed
  - **Rollback**: Falls back to default templates

### Low Risk (P3 - Monitor)
- **Performance with large templates**: Not tested with 10,000+ character templates
  - **Mitigation**: Set character limit in UI
  - **Monitoring**: Track template sizes

- **Concurrent edits**: No locking mechanism for simultaneous editors
  - **Mitigation**: Last-write-wins (standard for now)
  - **Future**: Add optimistic locking

## Success Metrics

### Day 1 (Demo Day)
- [ ] Bristol templates visible in admin UI
- [ ] Can create new template
- [ ] Publish flow uses custom template
- [ ] Zero critical bugs reported

### Week 1
- [ ] 3+ councils create custom templates
- [ ] 10+ templates created total
- [ ] 90%+ template validation pass rate
- [ ] < 1% error rate in notice rendering

### Month 1
- [ ] 10+ councils using custom templates
- [ ] 50+ templates created
- [ ] 95%+ solicitor satisfaction with generated notices
- [ ] Custom template usage > 30% of total notices

## Support Plan

### During Demo (Thursday)
- **On-call**: Development team ready
- **Backup**: Demo video prepared
- **Fallback**: Demo slides ready

### Post-Demo
- **Bug reports**: Track in GitHub Issues
- **Feature requests**: Prioritize with product team
- **User feedback**: Collect via surveys
- **Documentation**: Update based on real-world usage

## Communication Plan

### Stakeholders to Notify
- [ ] Bristol City Council (demo participants)
- [ ] Other pilot councils
- [ ] Solicitor firms (via email)
- [ ] Support team (training session)
- [ ] Development team (technical briefing)

### Announcement Template
```
Subject: New Feature: Custom Notice Templates

We're excited to announce a new feature for council administrators:
Custom Notice Templates!

What's New:
- Create custom templates for licensing notices
- Use placeholders to automatically populate notice details
- Real-time validation ensures compliance
- Maintain your council's unique formatting and contact details

How to Access:
1. Log in to your council admin dashboard
2. Navigate to Templates section
3. Click "Create Template"
4. Follow the on-screen instructions

Need Help? Contact support@example.com

View Documentation: [link]
Watch Tutorial: [link]
```

## Final Checks

Before marking deployment complete:
- [ ] All verification tests pass
- [ ] No console errors in production
- [ ] Analytics tracking deployed
- [ ] Monitoring dashboards updated
- [ ] Documentation published
- [ ] Support team briefed
- [ ] Stakeholders notified
- [ ] Rollback plan tested (in dev)
- [ ] Success metrics baseline recorded

## Sign-Off

- **Developer**: ___________________________ Date: ___________
- **QA Lead**: _____________________________ Date: ___________
- **Product Owner**: _______________________ Date: ___________
- **Tech Lead**: ___________________________ Date: ___________

---

**Deployment Date**: [To be filled]
**Version**: 1.0.0 (Template Management System)
**Status**: ⬜ Ready for Deployment
