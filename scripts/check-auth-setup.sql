-- Quick Auth Setup Check
-- Run this in Supabase SQL Editor to verify everything is configured

-- 1. Check if JWT hook function exists
SELECT 'JWT Hook Function' as check_item,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc
         WHERE proname = 'custom_access_token_hook'
       ) THEN '✅ Exists'
       ELSE '❌ Missing - Run migration #2'
       END as status;

-- 2. Check if you have organizations
SELECT 'Organizations' as check_item,
       COUNT(*)::text || ' found' as status
FROM organizations;

-- 3. Check your user's organization membership
SELECT 'Your Memberships' as check_item,
       o.name || ' (' || o.type || ')' as status
FROM organization_memberships om
JOIN organizations o ON o.id = om.organization_id
JOIN auth.users u ON u.id = om.user_id
WHERE u.email = 'ottoclarke00@gmail.com';  -- Change to your email

-- 4. Check if you're a platform admin
SELECT 'Platform Admin Status' as check_item,
       CASE WHEN EXISTS (
         SELECT 1 FROM platform_admin_settings pas
         JOIN auth.users u ON u.id = pas.user_id
         WHERE u.email = 'ottoclarke00@gmail.com'  -- Change to your email
       ) THEN '✅ You are admin'
       ELSE '❌ Not admin'
       END as status;

-- 5. Check active councils view
SELECT 'Active Councils View' as check_item,
       COUNT(*)::text || ' councils available' as status
FROM active_councils;