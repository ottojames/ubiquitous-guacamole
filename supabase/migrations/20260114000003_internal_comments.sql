-- Create internal_comments table for council officers to comment on representations
CREATE TABLE IF NOT EXISTS internal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representation_id UUID NOT NULL REFERENCES representations(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  comment_text TEXT NOT NULL CHECK (char_length(comment_text) >= 1),
  visibility TEXT NOT NULL DEFAULT 'own' CHECK (visibility IN ('own', 'department', 'all')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_internal_comments_representation ON internal_comments(representation_id);
CREATE INDEX IF NOT EXISTS idx_internal_comments_department ON internal_comments(department_id);
CREATE INDEX IF NOT EXISTS idx_internal_comments_author ON internal_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_internal_comments_created ON internal_comments(created_at DESC);

-- Function to determine comment visibility based on user role
CREATE OR REPLACE FUNCTION can_view_internal_comment(
  comment_author_id UUID,
  comment_author_role TEXT,
  viewer_id UUID,
  viewer_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Head/Admin can see all comments
  IF viewer_role IN ('head', 'admin', 'owner') THEN
    RETURN TRUE;
  END IF;

  -- Senior officers can see own + junior officers' comments
  IF viewer_role IN ('senior', 'editor') THEN
    RETURN TRUE; -- For now, seniors see all in department
  END IF;

  -- Junior officers see only their own comments
  IF viewer_role IN ('junior', 'viewer', 'member') THEN
    RETURN comment_author_id = viewer_id;
  END IF;

  -- Default: deny access
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RLS policies for internal_comments
ALTER TABLE internal_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert comments into their department
CREATE POLICY insert_own_department_comments ON internal_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM department_memberships
      WHERE department_id = internal_comments.department_id
      AND user_id = auth.uid()
    )
  );

-- Policy: Users can view comments based on visibility rules
CREATE POLICY view_comments_by_role ON internal_comments
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM department_memberships dm
      WHERE dm.department_id = internal_comments.department_id
      AND dm.user_id = auth.uid()
      AND can_view_internal_comment(
        internal_comments.author_id,
        internal_comments.author_role,
        auth.uid(),
        dm.role
      )
    )
  );

-- Policy: Users can update only their own comments within 24 hours
CREATE POLICY update_own_comments ON internal_comments
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND deleted_at IS NULL
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Policy: Heads/admins can soft-delete any comment
CREATE POLICY delete_comments_as_admin ON internal_comments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM department_memberships
      WHERE department_id = internal_comments.department_id
      AND user_id = auth.uid()
      AND role IN ('head', 'admin', 'owner')
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_internal_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER internal_comments_updated_at
  BEFORE UPDATE ON internal_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_internal_comment_timestamp();

-- Comments
COMMENT ON TABLE internal_comments IS 'Internal comments on representations visible only to council officers based on role';
COMMENT ON COLUMN internal_comments.visibility IS 'Visibility level: own (author only), department (all in dept), all (all council)';
COMMENT ON FUNCTION can_view_internal_comment IS 'Determines if a user can view a comment based on roles: head sees all, senior sees all in dept, junior sees own';
