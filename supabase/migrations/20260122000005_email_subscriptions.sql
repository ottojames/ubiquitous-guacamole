-- Migration: Create email_subscriptions table for resident alert preferences
-- Purpose: Enable residents to subscribe to email alerts for notices in their area

-- Create email_subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    postcode VARCHAR(10) NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    radius_km DECIMAL(4, 1) NOT NULL DEFAULT 5.0 CHECK (radius_km >= 0.5 AND radius_km <= 50),
    notice_types TEXT[] DEFAULT ARRAY['all'],
    is_verified BOOLEAN DEFAULT false,
    verification_token UUID DEFAULT gen_random_uuid(),
    unsubscribe_token UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sent_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'unsubscribed', 'bounced')),

    -- Add unique constraint on email + postcode to prevent duplicates
    UNIQUE(email, postcode)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_postcode ON email_subscriptions(postcode);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_status ON email_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_lat_lng ON email_subscriptions(lat, lng);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_verification_token ON email_subscriptions(verification_token);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_unsubscribe_token ON email_subscriptions(unsubscribe_token);

-- Add RLS policies
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by the API)
-- The API uses service_role key which bypasses RLS, so these policies
-- are defense-in-depth for any direct client access

-- Allow service role full access
CREATE POLICY "Service role has full access to email_subscriptions"
ON email_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create table to track sent alerts (prevent duplicates)
CREATE TABLE IF NOT EXISTS email_alerts_sent (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID REFERENCES email_subscriptions(id) ON DELETE CASCADE,
    notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent sending the same notice to the same subscription twice
    UNIQUE(subscription_id, notice_id)
);

CREATE INDEX IF NOT EXISTS idx_email_alerts_sent_subscription ON email_alerts_sent(subscription_id);
CREATE INDEX IF NOT EXISTS idx_email_alerts_sent_notice ON email_alerts_sent(notice_id);
CREATE INDEX IF NOT EXISTS idx_email_alerts_sent_at ON email_alerts_sent(sent_at);

-- Add RLS to email_alerts_sent
ALTER TABLE email_alerts_sent ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to email_alerts_sent"
ON email_alerts_sent
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
