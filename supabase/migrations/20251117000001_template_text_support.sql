-- Template Text Support Migration
-- Adds custom template text functionality with placeholder validation

-- ============================================================================
-- ADD COLUMNS TO TEMPLATES TABLE
-- ============================================================================

-- Template text with placeholders
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS template_text TEXT;

-- Placeholder metadata
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS placeholders TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS required_placeholders TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Validation status
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT FALSE;

ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS validation_warnings TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Active status
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add comments
COMMENT ON COLUMN public.templates.template_text IS 'Custom template text with {{PLACEHOLDER}} tokens for rendering';
COMMENT ON COLUMN public.templates.placeholders IS 'Array of placeholder tokens found in template_text (e.g., ["APPLICANT_NAME", "PREMISES_ADDRESS"])';
COMMENT ON COLUMN public.templates.required_placeholders IS 'Array of required placeholder tokens that must be present for the notice type';
COMMENT ON COLUMN public.templates.is_validated IS 'Whether template has all required placeholders and passes validation';
COMMENT ON COLUMN public.templates.validation_warnings IS 'Array of validation warning messages (e.g., ["Missing required placeholder: DEADLINE_DATE"])';
COMMENT ON COLUMN public.templates.is_active IS 'Whether this template is active and available for use';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_templates_active ON public.templates(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_templates_validated ON public.templates(is_validated) WHERE is_validated = TRUE;

-- ============================================================================
-- VALIDATION FUNCTION
-- ============================================================================
-- Validates template placeholders and updates validation status

CREATE OR REPLACE FUNCTION validate_template_placeholders()
RETURNS TRIGGER AS $$
DECLARE
  found_placeholders TEXT[];
  required_set TEXT[];
  missing_placeholders TEXT[];
  warnings TEXT[] := ARRAY[]::TEXT[];
  has_statutory_clause BOOLEAN;
BEGIN
  -- Skip validation if template_text is NULL or empty
  IF NEW.template_text IS NULL OR LENGTH(TRIM(NEW.template_text)) = 0 THEN
    NEW.placeholders := ARRAY[]::TEXT[];
    NEW.validation_warnings := ARRAY[]::TEXT[];
    NEW.is_validated := FALSE;
    RETURN NEW;
  END IF;

  -- Extract placeholders from template_text using regex
  -- Matches {{PLACEHOLDER_NAME}} pattern
  SELECT ARRAY_AGG(DISTINCT match[1])
  INTO found_placeholders
  FROM regexp_matches(NEW.template_text, '\{\{([A-Z_]+)\}\}', 'g') AS match;

  -- Handle case where no placeholders found
  IF found_placeholders IS NULL THEN
    found_placeholders := ARRAY[]::TEXT[];
  END IF;

  -- Store found placeholders
  NEW.placeholders := found_placeholders;

  -- Define required placeholders based on notice_type
  -- These must match the placeholder registry in the frontend
  CASE NEW.notice_type
    WHEN 'licensing-premises-new' THEN
      required_set := ARRAY[
        'APPLICANT_NAME',
        'PREMISES_NAME',
        'PREMISES_ADDRESS',
        'LICENSABLE_ACTIVITIES',
        'AUTHORITY_NAME',
        'DEADLINE_DATE',
        'REPRESENTATION_ADDRESS'
      ];
    WHEN 'licensing-premises-variation' THEN
      required_set := ARRAY[
        'APPLICANT_NAME',
        'PREMISES_NAME',
        'PREMISES_ADDRESS',
        'NATURE_OF_VARIATION',
        'AUTHORITY_NAME',
        'DEADLINE_DATE',
        'REPRESENTATION_ADDRESS'
      ];
    WHEN 'licensing-premises-review' THEN
      required_set := ARRAY[
        'REVIEW_APPLICANT_NAME',
        'PREMISES_NAME',
        'PREMISES_ADDRESS',
        'REVIEW_GROUNDS',
        'AUTHORITY_NAME',
        'DEADLINE_DATE',
        'REPRESENTATION_ADDRESS'
      ];
    ELSE
      -- Default required placeholders for other notice types
      required_set := ARRAY['AUTHORITY_NAME'];
  END CASE;

  -- Store required placeholders
  NEW.required_placeholders := required_set;

  -- Find missing required placeholders
  SELECT ARRAY_AGG(rp)
  INTO missing_placeholders
  FROM UNNEST(required_set) AS rp
  WHERE NOT (rp = ANY(found_placeholders));

  -- Handle case where no missing placeholders
  IF missing_placeholders IS NULL THEN
    missing_placeholders := ARRAY[]::TEXT[];
  END IF;

  -- Check for statutory clause (licensing notices)
  IF NEW.notice_type LIKE 'licensing-%' THEN
    has_statutory_clause := NEW.template_text ~* 'Licensing Act 2003';
    IF NOT has_statutory_clause THEN
      warnings := array_append(warnings, 'Template should reference "Licensing Act 2003" for legal compliance');
    END IF;
  END IF;

  -- Build validation warnings
  IF array_length(missing_placeholders, 1) > 0 THEN
    warnings := array_append(
      warnings,
      'Missing required placeholders: ' || array_to_string(missing_placeholders, ', ')
    );
  END IF;

  -- Update validation status
  NEW.validation_warnings := warnings;
  NEW.is_validated := (array_length(warnings, 1) IS NULL OR array_length(warnings, 1) = 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VALIDATION TRIGGER
-- ============================================================================
-- Auto-validates template whenever template_text or notice_type changes

DROP TRIGGER IF EXISTS templates_validate_placeholders ON public.templates;

CREATE TRIGGER templates_validate_placeholders
  BEFORE INSERT OR UPDATE OF template_text, notice_type ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION validate_template_placeholders();

-- ============================================================================
-- HELPER FUNCTION: GET ACTIVE TEMPLATE
-- ============================================================================
-- Retrieves the active, validated template for a department and notice type

CREATE OR REPLACE FUNCTION get_active_template(
  p_department_id UUID,
  p_notice_type TEXT
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  template_text TEXT,
  placeholders TEXT[],
  required_placeholders TEXT[],
  is_validated BOOLEAN,
  validation_warnings TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.description,
    t.template_text,
    t.placeholders,
    t.required_placeholders,
    t.is_validated,
    t.validation_warnings
  FROM public.templates t
  WHERE
    t.department_id = p_department_id
    AND t.notice_type = p_notice_type
    AND t.is_active = TRUE
    AND t.template_text IS NOT NULL
    AND LENGTH(TRIM(t.template_text)) > 0
  ORDER BY
    t.is_validated DESC,  -- Prefer validated templates
    t.updated_at DESC     -- Most recently updated
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_active_template IS 'Returns the active template for a department and notice type, preferring validated templates';

-- ============================================================================
-- VALIDATION REPORT FUNCTION
-- ============================================================================
-- Generates a validation report for all templates

CREATE OR REPLACE FUNCTION get_template_validation_report()
RETURNS TABLE(
  template_id UUID,
  template_name TEXT,
  notice_type TEXT,
  department_name TEXT,
  is_active BOOLEAN,
  is_validated BOOLEAN,
  has_template_text BOOLEAN,
  found_placeholders_count INT,
  required_placeholders_count INT,
  validation_warnings TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS template_id,
    t.name AS template_name,
    t.notice_type,
    d.name AS department_name,
    t.is_active,
    t.is_validated,
    (t.template_text IS NOT NULL AND LENGTH(TRIM(t.template_text)) > 0) AS has_template_text,
    COALESCE(array_length(t.placeholders, 1), 0) AS found_placeholders_count,
    COALESCE(array_length(t.required_placeholders, 1), 0) AS required_placeholders_count,
    t.validation_warnings
  FROM public.templates t
  JOIN public.departments d ON t.department_id = d.id
  ORDER BY
    t.is_active DESC,
    t.is_validated DESC,
    d.name,
    t.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_template_validation_report IS 'Returns validation status for all templates - useful for admin dashboards';

-- ============================================================================
-- BACKFILL EXISTING TEMPLATES
-- ============================================================================
-- Trigger validation for existing templates (will populate new columns)

DO $$
DECLARE
  template_record RECORD;
BEGIN
  FOR template_record IN
    SELECT id, template_text, notice_type
    FROM public.templates
    WHERE template_text IS NOT NULL
  LOOP
    -- Update to trigger validation
    UPDATE public.templates
    SET updated_at = NOW()
    WHERE id = template_record.id;
  END LOOP;

  RAISE NOTICE 'Backfilled validation for % templates', (SELECT COUNT(*) FROM public.templates WHERE template_text IS NOT NULL);
END $$;
