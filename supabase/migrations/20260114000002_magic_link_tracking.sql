-- Add tracking token to notices table for magic link access
ALTER TABLE notices ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notices_tracking_token ON notices(tracking_token);

-- Function to generate a secure tracking token
CREATE OR REPLACE FUNCTION generate_tracking_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tracking token on insert
CREATE OR REPLACE FUNCTION set_tracking_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_token IS NULL THEN
    NEW.tracking_token := generate_tracking_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_tracking_token
  BEFORE INSERT ON notices
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_token();

-- Backfill existing notices with tracking tokens
UPDATE notices
SET tracking_token = generate_tracking_token()
WHERE tracking_token IS NULL;

-- Comment
COMMENT ON COLUMN notices.tracking_token IS 'Secure token for applicants to track representations on their notice via magic link';
