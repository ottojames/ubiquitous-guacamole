-- Fix billing trigger to handle notices without title field
-- The original trigger referenced NEW.title which doesn't exist

CREATE OR REPLACE FUNCTION auto_bill_notice_publication()
RETURNS TRIGGER AS $$
BEGIN
  -- Only bill if published by a firm (not by council directly)
  -- AND billing_status is not already set to 'comp' (complimentary/free)
  IF NEW.published_by_organization_id IS NOT NULL
     AND NEW.status = 'published'
     AND OLD.status IS DISTINCT FROM 'published' -- Only on transition to published
     AND COALESCE(NEW.billing_status, '') != 'comp' -- Skip if marked as comp
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
      COALESCE(NEW.billing_amount, 150.00), -- Default £150, configurable per notice
      NEW.id,
      'Notice publication: ' || COALESCE(NEW.trading_name, NEW.premises_address, 'Untitled'),
      NEW.published_by_user_id
    );

    -- Update notice billing status
    NEW.billing_status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_bill_notice_publication IS 'Automatically create billing charge when a firm publishes a notice (fixed to use trading_name instead of title)';
