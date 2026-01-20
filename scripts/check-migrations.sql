-- ============================================================================
-- Phase 5 Migration Verification Script
-- Run this in Supabase SQL Editor to verify migrations were applied
-- ============================================================================

-- Check 1: platform_admin_settings table exists
SELECT
  'platform_admin_settings table' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'platform_admin_settings'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING - Run Migration 1'
  END as status;

-- Check 2: Helper functions exist
SELECT
  'Helper functions' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'private'
        AND routine_name IN ('get_user_org_id', 'get_user_dept_id', 'is_platform_admin')
      HAVING COUNT(*) = 3
    ) THEN '✓ ALL 3 EXIST'
    ELSE '✗ MISSING - Run Migration 1'
  END as status;

-- Check 3: custom_access_token_hook exists
SELECT
  'JWT custom claims hook' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'custom_access_token_hook'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING - Run Migration 2'
  END as status;

-- Check 4: active_councils view exists
SELECT
  'active_councils view' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name = 'active_councils'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING - Run Migration 1'
  END as status;

-- Check 5: New RLS policies exist on notices table
SELECT
  'RLS policies on notices' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'notices'
        AND policyname IN (
          'platform_admins_full_access',
          'org_members_see_own_notices',
          'dept_members_manage_notices',
          'public_notices_readable'
        )
      HAVING COUNT(*) = 4
    ) THEN '✓ ALL 4 EXIST'
    ELSE '✗ MISSING - Run Migration 3'
  END as status;

-- Check 6: organization_id is NOT NULL on notices
SELECT
  'notices.organization_id NOT NULL' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'notices'
        AND column_name = 'organization_id'
        AND is_nullable = 'NO'
    ) THEN '✓ NOT NULL'
    ELSE '⚠ NULLABLE - May need Migration 1'
  END as status;

-- Check 7: JWT hook permissions granted
SELECT
  'JWT hook permissions' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE grantee = 'supabase_auth_admin'
        AND table_name IN ('organizations', 'organization_memberships', 'department_memberships', 'platform_admin_settings')
      HAVING COUNT(DISTINCT table_name) = 4
    ) THEN '✓ GRANTED'
    ELSE '⚠ MISSING - Run Migration 2'
  END as status;

-- Check 8: Count councils in active_councils view
SELECT
  'Councils in active_councils view' as check_name,
  COALESCE(
    (SELECT COUNT(*)::text FROM public.active_councils),
    '0'
  ) || ' councils' as status;

-- Check 9: Count platform admins
SELECT
  'Platform admin users' as check_name,
  COALESCE(
    (SELECT COUNT(*)::text FROM public.platform_admin_settings),
    '0'
  ) || ' admins' as status;

-- Check 10: Sample organization membership check
SELECT
  'Organization memberships' as check_name,
  COALESCE(
    (SELECT COUNT(*)::text FROM public.organization_memberships),
    '0'
  ) || ' memberships' as status;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- All checks should show "✓" status
-- If any show "✗", run the indicated migration
-- If any show "⚠", investigate but may not be critical
-- ============================================================================

-- Additional Details Query (optional)
-- Uncomment to see full migration status:

/*
SELECT
  'MIGRATION STATUS' as section,
  '' as detail
UNION ALL
SELECT
  'Tables Created',
  string_agg(table_name, ', ')
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('platform_admin_settings')
UNION ALL
SELECT
  'Views Created',
  string_agg(table_name, ', ')
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('active_councils')
UNION ALL
SELECT
  'Functions Created (private)',
  string_agg(routine_name, ', ')
FROM information_schema.routines
WHERE routine_schema = 'private'
  AND routine_name IN ('get_user_org_id', 'get_user_dept_id', 'is_platform_admin')
UNION ALL
SELECT
  'Functions Created (public)',
  string_agg(routine_name, ', ')
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('custom_access_token_hook')
UNION ALL
SELECT
  'RLS Policies Created',
  string_agg(policyname, ', ')
FROM pg_policies
WHERE tablename = 'notices'
  AND policyname LIKE '%admin%' OR policyname LIKE '%org_%' OR policyname LIKE '%dept_%' OR policyname LIKE '%public_%';
*/
