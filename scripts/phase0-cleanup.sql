-- CIVIC NOTICES - Phase 0 Demo Data Cleanup Script
-- This script removes all test data while preserving essential demo accounts

-- 1. First, identify test notices (notices that appear to be test data)
-- We'll look for notices with obvious test patterns in their text or names
SELECT COUNT(*) as test_notices_count FROM notices
WHERE
    LOWER(trading_name) LIKE '%test%' OR
    LOWER(premises_name) LIKE '%test%' OR
    LOWER(applicant_name) LIKE '%test%' OR
    LOWER(preview_text) LIKE '%test%' OR
    LOWER(trading_name) LIKE '%demo%' OR
    LOWER(premises_name) LIKE '%demo%' OR
    LOWER(applicant_name) LIKE '%demo%' OR
    trading_name LIKE 'Example%' OR
    premises_name LIKE 'Example%' OR
    applicant_name LIKE 'Example%' OR
    -- Common test data patterns
    trading_name IN ('The Red Lion', 'The Crown', 'The Kings Arms', 'Test Pub', 'Demo Bar') OR
    premises_name IN ('The Red Lion', 'The Crown', 'The Kings Arms', 'Test Pub', 'Demo Bar');

-- 2. Count representations that would be deleted with test notices
SELECT COUNT(*) as test_representations_count
FROM representations r
JOIN notices n ON r.notice_id = n.id
WHERE
    LOWER(n.trading_name) LIKE '%test%' OR
    LOWER(n.premises_name) LIKE '%test%' OR
    LOWER(n.applicant_name) LIKE '%test%' OR
    LOWER(n.preview_text) LIKE '%test%' OR
    LOWER(n.trading_name) LIKE '%demo%' OR
    LOWER(n.premises_name) LIKE '%demo%' OR
    LOWER(n.applicant_name) LIKE '%demo%' OR
    n.trading_name LIKE 'Example%' OR
    n.premises_name LIKE 'Example%' OR
    n.applicant_name LIKE 'Example%' OR
    n.trading_name IN ('The Red Lion', 'The Crown', 'The Kings Arms', 'Test Pub', 'Demo Bar') OR
    n.premises_name IN ('The Red Lion', 'The Crown', 'The Kings Arms', 'Test Pub', 'Demo Bar');

-- 3. Identify test users (excluding essential demo accounts)
-- Demo accounts we want to keep:
-- - council demo users (for demo portal access)
-- - firm demo users (for solicitor portal demos)
SELECT COUNT(*) as test_users_count
FROM auth.users u
WHERE
    -- Test patterns in email
    (LOWER(u.email) LIKE '%test%' OR
     LOWER(u.email) LIKE '%example%' OR
     LOWER(u.email) LIKE '%temp%' OR
     LOWER(u.email) LIKE '%delete%')
    -- But exclude essential demo accounts
    AND u.email NOT IN (
        'demo@civicnotices.uk',
        'council.demo@civicnotices.uk',
        'licensing.demo@civicnotices.uk',
        'planning.demo@civicnotices.uk',
        'highways.demo@civicnotices.uk',
        'firm.demo@civicnotices.uk',
        'solicitor.demo@civicnotices.uk'
    );

-- 4. Begin cleanup (only run if counts above look reasonable)
BEGIN;

-- Delete test representations first (due to foreign key)
DELETE FROM representations
WHERE notice_id IN (
    SELECT id FROM notices
    WHERE
        LOWER(trading_name) LIKE '%test%' OR
        LOWER(premises_name) LIKE '%test%' OR
        LOWER(applicant_name) LIKE '%test%' OR
        LOWER(preview_text) LIKE '%test%' OR
        LOWER(trading_name) LIKE '%demo%' OR
        LOWER(premises_name) LIKE '%demo%' OR
        LOWER(applicant_name) LIKE '%demo%' OR
        trading_name LIKE 'Example%' OR
        premises_name LIKE 'Example%' OR
        applicant_name LIKE 'Example%' OR
        trading_name IN ('The Red Lion', 'The Crown', 'The Kings Arms', 'Test Pub', 'Demo Bar') OR
        premises_name IN ('The Red Lion', 'The Crown', 'The Kings Arms', 'Test Pub', 'Demo Bar')
);

-- Delete test notices
DELETE FROM notices
WHERE
    LOWER(trading_name) LIKE '%test%' OR
    LOWER(premises_name) LIKE '%test%' OR
    LOWER(applicant_name) LIKE '%test%' OR
    LOWER(preview_text) LIKE '%test%' OR
    LOWER(trading_name) LIKE '%demo%' OR
    LOWER(premises_name) LIKE '%demo%' OR
    LOWER(applicant_name) LIKE '%demo%' OR
    trading_name LIKE 'Example%' OR
    premises_name LIKE 'Example%' OR
    applicant_name LIKE 'Example%' OR
    trading_name IN ('The Red Lion', 'The Crown', 'The Kings Arms', 'Test Pub', 'Demo Bar') OR
    premises_name IN ('The Red Lion', 'The Crown', 'The Kings Arms', 'Test Pub', 'Demo Bar');

-- Clean up orphaned email subscriptions for test data
DELETE FROM email_subscriptions
WHERE email IN (
    SELECT email FROM auth.users
    WHERE
        (LOWER(email) LIKE '%test%' OR
         LOWER(email) LIKE '%example%' OR
         LOWER(email) LIKE '%temp%' OR
         LOWER(email) LIKE '%delete%')
        AND email NOT IN (
            'demo@civicnotices.uk',
            'council.demo@civicnotices.uk',
            'licensing.demo@civicnotices.uk',
            'planning.demo@civicnotices.uk',
            'highways.demo@civicnotices.uk',
            'firm.demo@civicnotices.uk',
            'solicitor.demo@civicnotices.uk'
        )
);

-- Note: We cannot directly delete from auth.users as it's managed by Supabase Auth
-- Instead, we'll document which users should be removed via Supabase dashboard

-- Commit the transaction
COMMIT;

-- 5. Report cleanup results
SELECT
    'Cleanup Complete' as status,
    (SELECT COUNT(*) FROM notices) as remaining_notices,
    (SELECT COUNT(*) FROM representations) as remaining_representations,
    (SELECT COUNT(*) FROM email_subscriptions) as remaining_subscriptions;