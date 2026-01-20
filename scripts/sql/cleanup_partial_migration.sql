-- Cleanup script for partially applied multi-tenant migrations
-- This drops all new tables and functions created by the multi-tenant migrations

-- Drop tables (in reverse dependency order)
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

SELECT 'Cleanup complete - multi-tenant tables and functions dropped' AS status;
