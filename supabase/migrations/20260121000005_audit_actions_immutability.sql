-- Migration: Add immutability trigger to audit_actions table
-- Date: 2026-01-21
-- Purpose: Security hardening - prevent modification/deletion of audit records
-- Reference: audit_logs table already has this protection (20251021000006_audit_logs.sql)

-- ============================================================================
-- PREVENT AUDIT_ACTIONS MODIFICATIONS (Append-only enforcement)
-- ============================================================================
-- The audit_actions table should be immutable like audit_logs to maintain
-- tamper-proof audit trail for compliance and security.

-- Use the same prevention function as audit_logs if it exists,
-- otherwise create a dedicated one for audit_actions
CREATE OR REPLACE FUNCTION prevent_audit_actions_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit action records are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists (idempotent)
DROP TRIGGER IF EXISTS audit_actions_immutable ON public.audit_actions;

-- Create the immutability trigger
CREATE TRIGGER audit_actions_immutable
  BEFORE UPDATE OR DELETE ON public.audit_actions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_actions_modification();

-- ============================================================================
-- ADD COMMENT
-- ============================================================================
COMMENT ON TABLE public.audit_actions IS 'Append-only immutable audit trail for system actions - cannot be modified or deleted';
COMMENT ON TRIGGER audit_actions_immutable ON public.audit_actions IS 'Prevents modification or deletion of audit action records for compliance';
