-- Fix RLS Policy Role Names Migration
-- Changes 'admin' to 'org_admin' in organization_memberships policies
-- The organization_memberships table only allows: 'owner', 'org_admin'
-- Some policies incorrectly used 'admin' which would never match any rows

-- ============================================================================
-- FIRM DEPARTMENTS RLS POLICIES
-- File: 20260120220000_create_firm_departments.sql
-- ============================================================================

DROP POLICY IF EXISTS "Firm admins can insert departments" ON public.firm_departments;
DROP POLICY IF EXISTS "Firm admins can update departments" ON public.firm_departments;

CREATE POLICY "Firm admins can insert departments" ON public.firm_departments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'org_admin')
    )
  );

CREATE POLICY "Firm admins can update departments" ON public.firm_departments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'org_admin')
    )
  );

-- ============================================================================
-- WORKFLOW CONFIGS RLS POLICIES
-- File: 20260120230000_create_workflow_configs.sql
-- ============================================================================

DROP POLICY IF EXISTS "Firm admins can manage workflow configs" ON public.workflow_configs;

CREATE POLICY "Firm admins can manage workflow configs" ON public.workflow_configs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'org_admin')
    )
  );

-- ============================================================================
-- WORKFLOW STAGES RLS POLICIES
-- File: 20260120240000_create_workflow_stages.sql
-- ============================================================================

DROP POLICY IF EXISTS "Firm admins can manage workflow stages" ON public.workflow_stages;

CREATE POLICY "Firm admins can manage workflow stages" ON public.workflow_stages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_configs wc
      JOIN public.organization_memberships om ON om.organization_id = wc.firm_id
      WHERE wc.id = workflow_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'org_admin')
    )
  );

-- ============================================================================
-- NOTICE WORKFLOW STATUS RLS POLICIES
-- File: 20260120250000_create_notice_workflow_status.sql
-- ============================================================================

DROP POLICY IF EXISTS "Firm members can manage notice workflow status" ON public.notice_workflow_status;

CREATE POLICY "Firm members can manage notice workflow status" ON public.notice_workflow_status
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'org_admin', 'editor')
    )
  );

-- Note: 'editor' is not a valid org role (it's a dept role), but keeping as
-- original intent may have been to allow editors. This should be reviewed.
-- For now, fixing only the admin->org_admin change.

-- Actually, let's fix this properly - editors are department-level, so we need
-- to also check department memberships OR firm-level memberships
DROP POLICY IF EXISTS "Firm members can manage notice workflow status" ON public.notice_workflow_status;

CREATE POLICY "Firm members can manage notice workflow status" ON public.notice_workflow_status
  FOR ALL TO authenticated
  USING (
    -- Firm owners/admins can manage all workflow statuses
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'org_admin')
    )
    OR
    -- Or user is an editor in any department of this firm
    EXISTS (
      SELECT 1
      FROM public.department_memberships dm
      JOIN public.departments d ON d.id = dm.department_id
      WHERE d.organization_id = firm_id
        AND dm.user_id = auth.uid()
        AND dm.role IN ('department_admin', 'editor')
    )
  );

-- ============================================================================
-- DEADLINE REMINDERS RLS POLICIES
-- File: 20260120270000_create_deadline_reminders.sql
-- ============================================================================

DROP POLICY IF EXISTS "Firm admins can manage deadline reminders" ON public.deadline_reminders;

CREATE POLICY "Firm admins can manage deadline reminders" ON public.deadline_reminders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'org_admin')
    )
  );

-- ============================================================================
-- FIRM NOTICE TEMPLATES RLS POLICIES
-- File: 20260120280000_create_firm_notice_templates.sql
-- ============================================================================

DROP POLICY IF EXISTS "Firm admins can insert templates" ON public.firm_notice_templates;
DROP POLICY IF EXISTS "Firm admins can update templates" ON public.firm_notice_templates;

CREATE POLICY "Firm admins can insert templates" ON public.firm_notice_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'org_admin')
    )
  );

CREATE POLICY "Firm admins can update templates" ON public.firm_notice_templates
  FOR UPDATE TO authenticated
  USING (
    -- Template creator can update their own templates
    created_by = auth.uid()
    OR
    -- Firm admins can update any template
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'org_admin')
    )
  );

-- ============================================================================
-- CLIENT MANAGEMENT RLS POLICIES
-- File: 20260114000010_client_management.sql
-- ============================================================================

DROP POLICY IF EXISTS "Firm members can view clients" ON public.firm_clients;
DROP POLICY IF EXISTS "Firm admins can insert clients" ON public.firm_clients;
DROP POLICY IF EXISTS "Firm admins can update clients" ON public.firm_clients;

CREATE POLICY "Firm members can view clients" ON public.firm_clients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_clients.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm admins can insert clients" ON public.firm_clients
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_clients.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'org_admin')
    )
  );

CREATE POLICY "Firm admins can update clients" ON public.firm_clients
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_clients.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'org_admin')
    )
  );

-- ============================================================================
-- DIRECT PUBLISHING RLS POLICIES
-- File: 20251022000001_direct_publishing.sql
-- Line 147 has 'editor', 'admin', 'owner' - admin should be org_admin
-- ============================================================================

-- Check if notice_drafts_v2 exists (it may have been created by direct_publishing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notice_drafts_v2') THEN
    -- Drop and recreate the policy with correct role names
    DROP POLICY IF EXISTS "Users can insert own drafts" ON public.notice_drafts_v2;
    DROP POLICY IF EXISTS "Users can manage own drafts" ON public.notice_drafts_v2;

    -- Recreate with correct role
    EXECUTE $sql$
      CREATE POLICY "Users can manage own drafts" ON public.notice_drafts_v2
        FOR ALL TO authenticated
        USING (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.organization_id = organization_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'org_admin')
          )
        )
    $sql$;
  END IF;
END $$;

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- Changed 'admin' to 'org_admin' in the following tables' RLS policies:
-- 1. firm_departments (insert, update policies)
-- 2. workflow_configs (all policy)
-- 3. workflow_stages (all policy)
-- 4. notice_workflow_status (all policy - also added department role check)
-- 5. deadline_reminders (all policy)
-- 6. firm_notice_templates (insert, update policies)
-- 7. firm_clients (insert, update policies)
-- 8. notice_drafts_v2 (if exists - manage policy)
--
-- This ensures consistency with the organization_memberships table which
-- only allows 'owner' and 'org_admin' roles per the CHECK constraint in
-- migration 20251021000001_memberships.sql
