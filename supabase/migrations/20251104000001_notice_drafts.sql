-- Migration: Notice Draft Persistence System
-- Purpose: Store in-progress notice drafts with autosave
-- Author: System
-- Date: 2025-11-04

-- Create drafts table
CREATE TABLE IF NOT EXISTS public.drafts (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,

  -- Draft metadata
  notice_category text NOT NULL, -- 'licensing', 'gambling', 'gvol', 'planning', 'probate'
  notice_definition_id text, -- e.g., 'licensing-premises-new'
  template_key text, -- e.g., 'licensing_premises_new_v1'

  -- Draft data (JSONB for flexibility)
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- User-provided metadata
  draft_name text, -- Optional user-friendly name for the draft
  notes text, -- Optional notes about the draft

  -- Status and tracking
  version integer NOT NULL DEFAULT 1,
  last_saved_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Optional: Link to published notice (if draft was completed)
  published_notice_id uuid REFERENCES notices(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_drafts_user ON drafts(created_by, updated_at DESC);
CREATE INDEX idx_drafts_org ON drafts(organization_id, updated_at DESC);
CREATE INDEX idx_drafts_dept ON drafts(department_id, updated_at DESC);
CREATE INDEX idx_drafts_category ON drafts(notice_category);
CREATE INDEX idx_drafts_published ON drafts(published_notice_id) WHERE published_notice_id IS NOT NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_drafts_updated_at();

-- Row-Level Security (RLS)
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own drafts
CREATE POLICY "Users can view their own drafts"
  ON drafts
  FOR SELECT
  USING (
    auth.uid() = created_by
  );

-- Policy: Users can insert their own drafts
CREATE POLICY "Users can create drafts"
  ON drafts
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
  );

-- Policy: Users can update their own drafts
CREATE POLICY "Users can update their own drafts"
  ON drafts
  FOR UPDATE
  USING (
    auth.uid() = created_by
  )
  WITH CHECK (
    auth.uid() = created_by
  );

-- Policy: Users can delete their own drafts
CREATE POLICY "Users can delete their own drafts"
  ON drafts
  FOR DELETE
  USING (
    auth.uid() = created_by
  );

-- Policy: Organization admins can view all drafts in their organization
CREATE POLICY "Org admins can view organization drafts"
  ON drafts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = drafts.organization_id
        AND user_roles.role = 'org_admin'
    )
  );

-- Policy: Department admins can view drafts in their department
CREATE POLICY "Dept admins can view department drafts"
  ON drafts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.department_id = drafts.department_id
        AND user_roles.role = 'dept_admin'
    )
  );

-- Function: Auto-cleanup old drafts (older than 90 days with no activity)
CREATE OR REPLACE FUNCTION cleanup_old_drafts()
RETURNS void AS $$
BEGIN
  DELETE FROM drafts
  WHERE updated_at < now() - interval '90 days'
    AND published_notice_id IS NULL; -- Only delete unpublished drafts
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_old_drafts() TO authenticated;

COMMENT ON TABLE drafts IS 'Stores in-progress notice drafts with autosave functionality';
COMMENT ON COLUMN drafts.notice_category IS 'Notice category: licensing, gambling, gvol, planning, probate';
COMMENT ON COLUMN drafts.notice_definition_id IS 'Specific notice type (e.g., licensing-premises-new)';
COMMENT ON COLUMN drafts.form_data IS 'Complete form state as JSON';
COMMENT ON COLUMN drafts.version IS 'Incremented on each save for conflict detection';
COMMENT ON COLUMN drafts.published_notice_id IS 'Links to published notice if draft was completed';
