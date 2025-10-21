-- Cleanup and reapply migration
-- This migration cleans up any partially applied tables/functions and allows migrations to be reapplied

-- Drop all partially created tables if they exist
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.representations CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.attachments CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.department_memberships CASCADE;
DROP TABLE IF EXISTS public.organization_memberships CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.validate_department_organization() CASCADE;
DROP FUNCTION IF EXISTS public.validate_org_has_owner() CASCADE;
DROP FUNCTION IF EXISTS public.validate_dept_has_admin() CASCADE;
DROP FUNCTION IF EXISTS public.auto_assign_org_owner() CASCADE;
DROP FUNCTION IF EXISTS public.auto_assign_dept_admin() CASCADE;
DROP FUNCTION IF EXISTS public.update_department_access(UUID, UUID) CASCADE;

-- Mark previous migration versions as reverted in the schema_migrations table
UPDATE supabase_migrations.schema_migrations
SET statements = NULL
WHERE version IN ('20250121000000', '20250121000001');

SELECT 'Cleanup complete - ready for clean migration application' AS status;
