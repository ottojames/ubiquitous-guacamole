-- Migration: Fix get_active_template RPC function
-- The original function expects columns that don't exist in the actual table
-- This migration updates it to work with the actual schema

-- Drop the old function first
DROP FUNCTION IF EXISTS get_active_template(UUID, TEXT);

-- Create the corrected function
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
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.description,
    t.template_text,
    -- Extract placeholders from template_text using regex
    (SELECT array_agg(DISTINCT match[1]) FROM regexp_matches(t.template_text, '\{\{([A-Z_]+)\}\}', 'g') AS match) AS placeholders,
    -- For now, return empty array for required_placeholders
    ARRAY[]::TEXT[] AS required_placeholders,
    -- Templates are considered validated if they have text
    (t.template_text IS NOT NULL AND LENGTH(TRIM(t.template_text)) > 0) AS is_validated,
    -- No validation warnings for now
    ARRAY[]::TEXT[] AS validation_warnings
  FROM
    public.templates t
  WHERE
    t.department_id = p_department_id
    AND t.notice_type = p_notice_type
    AND t.template_text IS NOT NULL
    AND LENGTH(TRIM(t.template_text)) > 0
  ORDER BY
    t.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_active_template IS 'Returns the active template for a department and notice type';
