-- P1-007: Unified Audit View
-- This migration creates a unified view of both audit tables
-- until they can be properly consolidated

-- Create a view that combines audit_logs and audit_actions tables
CREATE OR REPLACE VIEW unified_audit_logs AS

-- From audit_logs table (primary audit system with triggers)
SELECT
  id,
  organization_id,
  department_id,
  user_id,
  user_email,
  action,
  action_category,
  resource_type,
  resource_id,
  old_values,
  new_values,
  metadata,
  severity,
  created_at,
  'audit_logs' as source_table
FROM public.audit_logs

UNION ALL

-- From audit_actions table (server-side RPC logging)
SELECT
  id,
  organization_id,
  NULL as department_id, -- audit_actions doesn't have department_id
  actor_id as user_id,
  actor_email as user_email,
  action_type as action,
  CASE
    WHEN action_type LIKE 'notice.%' THEN 'notice'
    WHEN action_type LIKE 'representation.%' THEN 'representation'
    WHEN action_type LIKE 'team.%' OR action_type LIKE 'member.%' THEN 'team'
    WHEN action_type LIKE 'comment.%' THEN 'representation'
    ELSE 'settings'
  END as action_category,
  resource_type,
  resource_id,
  NULL as old_values,
  NULL as new_values,
  metadata,
  'info' as severity,
  created_at,
  'audit_actions' as source_table
FROM public.audit_actions

ORDER BY created_at DESC;

-- Add index hint comment
COMMENT ON VIEW unified_audit_logs IS 'Unified view combining audit_logs and audit_actions tables. Use this for comprehensive audit history until tables are consolidated.';

-- Grant access to the view (same as audit_logs table)
-- Note: RLS on underlying tables still applies
