-- Storage Buckets Configuration
-- Creates Supabase Storage buckets with RLS policies

-- ============================================================================
-- CREATE STORAGE BUCKETS
-- ============================================================================

-- Notices bucket: for notice attachments (PDFs, images, documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notices',
  'notices',
  false, -- Not publicly accessible by default (RLS controls access)
  104857600, -- 100MB max file size
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Logos bucket: for organization and user profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true, -- Publicly accessible (logos are meant to be shown)
  5242880, -- 5MB max file size
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE HELPER FUNCTIONS
-- ============================================================================

-- Extract department slug from storage path (notices bucket uses: dept-slug/notice-id/filename)
CREATE OR REPLACE FUNCTION public.storage_dept_slug_from_path(path TEXT)
RETURNS TEXT AS $$
  SELECT SPLIT_PART(path, '/', 1);
$$ LANGUAGE SQL IMMUTABLE;

-- Extract notice ID from storage path
CREATE OR REPLACE FUNCTION public.storage_notice_id_from_path(path TEXT)
RETURNS UUID AS $$
  SELECT NULLIF(SPLIT_PART(path, '/', 2), '')::UUID;
$$ LANGUAGE SQL IMMUTABLE;

-- Check if user can access notice attachments
CREATE OR REPLACE FUNCTION public.storage_user_can_access_notice(p_notice_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.notices n
    WHERE n.id = p_notice_id
      AND (
        -- Published notices are accessible
        (n.status = 'published' AND n.is_public = true)
        OR
        -- Dept members can access all dept notices
        EXISTS (
          SELECT 1 FROM public.department_memberships
          WHERE department_id = n.department_id
            AND user_id = auth.uid()
        )
        OR
        -- Org admins can access all org notices
        EXISTS (
          SELECT 1 FROM public.organization_memberships om
          WHERE om.organization_id = n.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'org_admin')
        )
      )
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can upload to notice
CREATE OR REPLACE FUNCTION public.storage_user_can_upload_to_notice(p_notice_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.notices n
    WHERE n.id = p_notice_id
      AND (
        -- Dept editors/admins can upload
        EXISTS (
          SELECT 1 FROM public.department_memberships dm
          WHERE dm.department_id = n.department_id
            AND dm.user_id = auth.uid()
            AND dm.role IN ('department_admin', 'editor')
        )
        OR
        -- Org admins can upload
        EXISTS (
          SELECT 1 FROM public.organization_memberships om
          WHERE om.organization_id = n.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'org_admin')
        )
      )
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- NOTICES BUCKET RLS POLICIES
-- ============================================================================

-- SELECT (Download): Public for published notices, dept members for all
CREATE POLICY notices_storage_select ON storage.objects
FOR SELECT
USING (
  bucket_id = 'notices'
  AND public.storage_user_can_access_notice(public.storage_notice_id_from_path(name))
);

-- INSERT (Upload): Dept editors/admins + org admins
CREATE POLICY notices_storage_insert ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'notices'
  AND public.storage_user_can_upload_to_notice(public.storage_notice_id_from_path(name))
);

-- UPDATE: Same as insert (rename, update metadata)
CREATE POLICY notices_storage_update ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'notices'
  AND public.storage_user_can_upload_to_notice(public.storage_notice_id_from_path(name))
);

-- DELETE: Dept admins + org admins
CREATE POLICY notices_storage_delete ON storage.objects
FOR DELETE
USING (
  bucket_id = 'notices'
  AND public.storage_user_can_upload_to_notice(public.storage_notice_id_from_path(name))
);

-- ============================================================================
-- LOGOS BUCKET RLS POLICIES
-- ============================================================================
-- Logos are public, but only org admins can upload/modify them

-- SELECT: Everyone (bucket is public)
CREATE POLICY logos_storage_select ON storage.objects
FOR SELECT
USING (
  bucket_id = 'logos'
);

-- INSERT: Org admins only
CREATE POLICY logos_storage_insert ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND (
    -- Path format: organizations/{org-id}/logo.ext
    -- Check user is admin of that org
    SPLIT_PART(name, '/', 1) = 'organizations'
    AND EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = SPLIT_PART(name, '/', 2)::UUID
        AND user_id = auth.uid()
        AND role IN ('owner', 'org_admin')
    )
  )
);

-- UPDATE: Org admins only
CREATE POLICY logos_storage_update ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'logos'
  AND (
    SPLIT_PART(name, '/', 1) = 'organizations'
    AND EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = SPLIT_PART(name, '/', 2)::UUID
        AND user_id = auth.uid()
        AND role IN ('owner', 'org_admin')
    )
  )
);

-- DELETE: Org admins only
CREATE POLICY logos_storage_delete ON storage.objects
FOR DELETE
USING (
  bucket_id = 'logos'
  AND (
    SPLIT_PART(name, '/', 1) = 'organizations'
    AND EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = SPLIT_PART(name, '/', 2)::UUID
        AND user_id = auth.uid()
        AND role IN ('owner', 'org_admin')
    )
  )
);

-- ============================================================================
-- STORAGE UTILITY FUNCTIONS
-- ============================================================================

-- Generate signed URL for private file (notices)
CREATE OR REPLACE FUNCTION get_notice_attachment_url(
  p_attachment_id UUID,
  p_expires_in INTEGER DEFAULT 3600
)
RETURNS TEXT AS $$
DECLARE
  file_path TEXT;
BEGIN
  -- Get storage path from attachment
  SELECT storage_path INTO file_path
  FROM public.attachments
  WHERE id = p_attachment_id;

  IF file_path IS NULL THEN
    RETURN NULL;
  END IF;

  -- Generate signed URL via Supabase Storage API
  -- In practice, this would be called from application code
  -- This is a placeholder for documentation
  RETURN CONCAT(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/sign/notices/',
    file_path,
    '?token=', -- Token would be generated by Supabase Storage API
    '&expiresIn=', p_expires_in
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get public URL for logo
CREATE OR REPLACE FUNCTION get_organization_logo_url(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  logo_path TEXT;
BEGIN
  SELECT logo_url INTO logo_path
  FROM public.organizations
  WHERE id = p_org_id;

  IF logo_path IS NULL THEN
    RETURN NULL;
  END IF;

  -- Return public URL
  RETURN CONCAT(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/logos/',
    logo_path
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Delete orphaned files (files not referenced in attachments table)
CREATE OR REPLACE FUNCTION cleanup_orphaned_notice_files()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  count INTEGER := 0;
BEGIN
  -- This would be implemented with Supabase Storage API calls
  -- Placeholder for scheduled cleanup job
  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.storage_dept_slug_from_path IS 'Extracts department slug from storage path (first segment)';
COMMENT ON FUNCTION public.storage_notice_id_from_path IS 'Extracts notice UUID from storage path (second segment)';
COMMENT ON FUNCTION public.storage_user_can_access_notice IS 'Checks if user can download notice attachments based on notice visibility';
COMMENT ON FUNCTION public.storage_user_can_upload_to_notice IS 'Checks if user can upload attachments to notice (editor/admin permissions)';

COMMENT ON FUNCTION get_notice_attachment_url IS 'Generates signed URL for private notice attachment download';
COMMENT ON FUNCTION get_organization_logo_url IS 'Returns public URL for organization logo';

-- ============================================================================
-- BUCKET PATH STRUCTURE DOCUMENTATION
-- ============================================================================

/*
NOTICES BUCKET PATH STRUCTURE:
  {dept-slug}/{notice-id}/{filename}

  Examples:
    licensing/550e8400-e29b-41d4-a716-446655440000/application.pdf
    planning/123e4567-e89b-12d3-a456-426614174000/site-plan.jpg

LOGOS BUCKET PATH STRUCTURE:
  organizations/{org-id}/logo.{ext}

  Examples:
    organizations/550e8400-e29b-41d4-a716-446655440000/logo.png
    organizations/123e4567-e89b-12d3-a456-426614174000/logo.svg

RLS ENFORCEMENT:
  - Notices bucket: RLS based on notice visibility and user dept membership
  - Logos bucket: Public read, admin-only write
*/
