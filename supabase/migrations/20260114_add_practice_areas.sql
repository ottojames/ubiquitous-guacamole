-- Add practice_areas column to organizations table for firm notice type filtering
-- This allows firms to select which practice areas they work in (licensing, planning, etc.)
-- and filters the publish wizard to only show relevant notice types

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS practice_areas text[] DEFAULT NULL;

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_organizations_practice_areas
ON organizations USING GIN (practice_areas);

-- Add comment for documentation
COMMENT ON COLUMN organizations.practice_areas IS
'Array of practice area IDs that the firm works in. Used to filter notice types in publish wizard. Options: licensing, planning, highways, environmental, property, statutory';

-- Update existing firms with default practice areas for testing
UPDATE organizations
SET practice_areas = ARRAY['licensing', 'planning']::text[]
WHERE type = 'firm' AND practice_areas IS NULL;
