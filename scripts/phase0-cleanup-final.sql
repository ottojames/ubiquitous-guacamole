-- CIVIC NOTICES - Phase 0 Demo Data Cleanup Script (Final)
-- Removes test data while preserving real notices

BEGIN;

-- Delete test representations first (foreign key constraint)
DELETE FROM representations
WHERE notice_id IN (
    SELECT id FROM notices
    WHERE
        LOWER(trading_name) LIKE '%test%' OR
        LOWER(applicant_name) LIKE '%test%' OR
        LOWER(preview_text) LIKE '%test%' OR
        trading_name LIKE 'Example%' OR
        applicant_name LIKE 'Example%' OR
        trading_name IN ('Test Pub', 'Demo Bar')
);

-- Delete test notices
DELETE FROM notices
WHERE
    LOWER(trading_name) LIKE '%test%' OR
    LOWER(applicant_name) LIKE '%test%' OR
    LOWER(preview_text) LIKE '%test%' OR
    trading_name LIKE 'Example%' OR
    applicant_name LIKE 'Example%' OR
    trading_name IN ('Test Pub', 'Demo Bar');

-- Clean up test email subscriptions
DELETE FROM email_subscriptions
WHERE
    LOWER(email) LIKE '%test%' OR
    LOWER(email) LIKE '%example%' OR
    email LIKE '%@test.%';

-- Clean up test email alerts sent
DELETE FROM email_alerts_sent
WHERE subscription_id NOT IN (SELECT id FROM email_subscriptions);

COMMIT;

-- Verify cleanup results
SELECT 'After cleanup:' as status;
SELECT COUNT(*) as total_notices FROM notices;
SELECT COUNT(*) as total_representations FROM representations;
SELECT COUNT(*) as total_subscriptions FROM email_subscriptions;