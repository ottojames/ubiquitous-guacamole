-- Fix auto_bill_notice_publication trigger to handle JSONB premises field
-- The trigger was failing with "COALESCE types text and jsonb cannot be matched"
-- Also converting to AFTER trigger to avoid foreign key constraint issues

-- Drop existing trigger first
DROP TRIGGER IF EXISTS trigger_auto_bill_publication ON notices;

-- Recreate function to work with AFTER trigger (can't modify NEW in AFTER)
CREATE OR REPLACE FUNCTION auto_bill_notice_publication()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.published_by_organization_id IS NOT NULL
     AND NEW.status = 'published'
     AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'published')
     AND COALESCE(NEW.billing_status, '') NOT IN ('waived', 'paid')
  THEN
    INSERT INTO billing_transactions (
      organization_id,
      type,
      amount,
      notice_id,
      description,
      created_by
    ) VALUES (
      NEW.published_by_organization_id,
      'charge',
      COALESCE(NEW.billing_amount, 150.00),
      NEW.id,
      'Notice publication: ' || COALESCE(
        NEW.trading_name,
        NEW.premises->>'name',
        NEW.premises->>'address',
        'Untitled'
      ),
      NEW.published_by_user_id
    );

    -- Update billing status separately since we're in AFTER trigger
    UPDATE notices SET billing_status = 'pending' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create AFTER trigger instead of BEFORE
CREATE TRIGGER trigger_auto_bill_publication
  AFTER INSERT OR UPDATE ON notices
  FOR EACH ROW
  EXECUTE FUNCTION auto_bill_notice_publication();

COMMENT ON FUNCTION auto_bill_notice_publication IS 'Automatically create billing charge with dynamic pricing based on subscription tier. Fixed to extract text from JSONB premises field and use AFTER trigger.';
