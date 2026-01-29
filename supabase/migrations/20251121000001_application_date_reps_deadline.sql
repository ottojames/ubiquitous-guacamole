-- Migration: Add automatic calculation of reps_deadline from application_date
-- Representations deadline is always 28 days after the application date

-- Function to calculate reps_deadline from application_date
CREATE OR REPLACE FUNCTION calculate_reps_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- If application_date is set and reps_deadline is not manually set
  -- (or this is a new row), calculate reps_deadline as application_date + 28 days
  IF NEW.application_date IS NOT NULL THEN
    -- Only auto-calculate if:
    -- 1. This is an INSERT and reps_deadline is NULL
    -- 2. This is an UPDATE where application_date changed and reps_deadline wasn't manually changed
    IF (TG_OP = 'INSERT' AND NEW.reps_deadline IS NULL) OR
       (TG_OP = 'UPDATE' AND
        OLD.application_date IS DISTINCT FROM NEW.application_date AND
        OLD.reps_deadline IS NOT DISTINCT FROM NEW.reps_deadline) THEN
      NEW.reps_deadline := NEW.application_date + INTERVAL '28 days';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on notices table
DROP TRIGGER IF EXISTS set_reps_deadline_from_application_date ON notices;

CREATE TRIGGER set_reps_deadline_from_application_date
  BEFORE INSERT OR UPDATE ON notices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_reps_deadline();

-- First, migrate reps_deadline from consultation JSONB to the dedicated column
UPDATE notices
SET reps_deadline = (consultation->>'repsDeadline')::date
WHERE reps_deadline IS NULL
  AND consultation->>'repsDeadline' IS NOT NULL
  AND consultation->>'repsDeadline' != '';

-- Now backfill application_date for existing notices where reps_deadline exists
-- We calculate backwards: application_date = reps_deadline - 28 days
UPDATE notices
SET application_date = reps_deadline - INTERVAL '28 days'
WHERE application_date IS NULL
  AND reps_deadline IS NOT NULL;

-- For notices without reps_deadline, use created_at as a fallback application_date
-- This ensures existing notices have some date set
UPDATE notices
SET application_date = created_at::date
WHERE application_date IS NULL
  AND status IN ('published', 'submitted');

COMMENT ON FUNCTION calculate_reps_deadline() IS
  'Automatically calculates reps_deadline as application_date + 28 days.
   Allows manual override of reps_deadline if needed.';
