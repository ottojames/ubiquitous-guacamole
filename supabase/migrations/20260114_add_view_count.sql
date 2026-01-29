-- Add view tracking to notices table
ALTER TABLE notices
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_notices_view_count ON notices(view_count DESC);

-- Create view tracking table to prevent duplicate views from same IP
CREATE TABLE IF NOT EXISTS notice_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  viewer_ip INET NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT,
  UNIQUE(notice_id, viewer_ip)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_notice_views_notice_id ON notice_views(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_views_viewed_at ON notice_views(viewed_at);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_notice_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE notices
  SET view_count = view_count + 1
  WHERE id = NEW.notice_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update view count when new view is recorded
DROP TRIGGER IF EXISTS update_notice_view_count ON notice_views;
CREATE TRIGGER update_notice_view_count
  AFTER INSERT ON notice_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_notice_view_count();

-- Add view count to audit log
INSERT INTO audit_actions (action_type, entity_type, description)
VALUES ('add_view_tracking', 'notices', 'Added view count tracking to notices table');