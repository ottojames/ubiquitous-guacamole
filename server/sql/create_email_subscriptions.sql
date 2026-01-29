-- Create email_subscriptions table for resident alert preferences
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    postcode VARCHAR(10) NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    radius_km DECIMAL(3, 1) NOT NULL DEFAULT 1.0 CHECK (radius_km IN (0.5, 1.0, 2.0, 5.0)),
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
CREATE INDEX idx_email_subscriptions_postcode ON email_subscriptions(postcode);
CREATE INDEX idx_email_subscriptions_status ON email_subscriptions(status);
CREATE INDEX idx_email_subscriptions_lat_lng ON email_subscriptions(lat, lng);
CREATE INDEX idx_email_subscriptions_verification_token ON email_subscriptions(verification_token);
CREATE INDEX idx_email_subscriptions_unsubscribe_token ON email_subscriptions(unsubscribe_token);

-- Add RLS policies
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to create subscriptions
CREATE POLICY "Allow anonymous subscription creation" ON email_subscriptions
    FOR INSERT
    WITH CHECK (true);

-- Allow users to manage their own subscriptions via tokens
CREATE POLICY "Allow subscription management via tokens" ON email_subscriptions
    FOR ALL
    USING (
        verification_token::text = current_setting('app.verification_token', true) OR
        unsubscribe_token::text = current_setting('app.unsubscribe_token', true)
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_email_subscriptions_updated_at
    BEFORE UPDATE ON email_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create table to track sent alerts (prevent duplicates)
CREATE TABLE IF NOT EXISTS email_alerts_sent (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID REFERENCES email_subscriptions(id) ON DELETE CASCADE,
    notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent sending the same notice to the same subscription twice
    UNIQUE(subscription_id, notice_id)
);

CREATE INDEX idx_email_alerts_sent_subscription ON email_alerts_sent(subscription_id);
CREATE INDEX idx_email_alerts_sent_notice ON email_alerts_sent(notice_id);
CREATE INDEX idx_email_alerts_sent_at ON email_alerts_sent(sent_at);