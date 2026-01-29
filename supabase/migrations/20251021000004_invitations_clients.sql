-- Invitations and Clients Migration
-- Team invitation system and firm client management

-- ============================================================================
-- INVITATIONS TABLE
-- ============================================================================
-- Email invitations to join organizations or departments

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target (either org-level or dept-level)
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,

  -- Invitee
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- org role or dept role depending on scope

  -- Token
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL, -- Bcrypt hash for validation

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

  -- Message
  personal_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_scope CHECK (
    (organization_id IS NOT NULL AND department_id IS NULL) OR
    (organization_id IS NULL AND department_id IS NOT NULL)
  ),
  CONSTRAINT valid_org_role CHECK (
    organization_id IS NULL OR role IN ('owner', 'org_admin')
  ),
  CONSTRAINT valid_dept_role CHECK (
    department_id IS NULL OR role IN ('department_admin', 'editor', 'viewer')
  )
);

-- Invitations Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_dept ON public.invitations(department_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON public.invitations(expires_at ASC)
  WHERE status = 'pending';

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
-- Client records for firms (solicitors, consultants)

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner (firm organization)
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Client Info
  name TEXT NOT NULL, -- Company or individual name
  type TEXT NOT NULL DEFAULT 'business'
    CHECK (type IN ('business', 'individual')),

  -- Contact Details
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB, -- { street, city, postcode, country }

  -- Business Details (for companies)
  company_number TEXT, -- Companies House number
  vat_number TEXT,

  -- Relationship
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_client_name CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 200),
  CONSTRAINT valid_email CHECK (
    contact_email IS NULL OR
    contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Clients Indexes
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_org_status ON public.clients(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_created ON public.clients(created_at DESC);

-- Clients Updated At Trigger
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VALIDATION: Ensure clients only for firms
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_client_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = NEW.organization_id AND type = 'firm'
  ) THEN
    RAISE EXCEPTION 'Clients can only be created for firm organizations';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_validate_org
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION validate_client_organization();

-- ============================================================================
-- AUTO-EXPIRE INVITATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN QUERY SELECT updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_invitations IS 'Marks pending invitations as expired after expires_at. Run via cron job.';

-- ============================================================================
-- INVITATION TOKEN GENERATION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate random 32-character token (URL-safe)
  token := encode(gen_random_bytes(24), 'base64');
  token := REPLACE(token, '/', '_');
  token := REPLACE(token, '+', '-');
  token := REPLACE(token, '=', '');
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate token on insert if not provided
CREATE OR REPLACE FUNCTION set_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invitations_set_token
  BEFORE INSERT ON public.invitations
  FOR EACH ROW
  WHEN (NEW.token IS NULL OR NEW.token = '')
  EXECUTE FUNCTION set_invitation_token();

-- ============================================================================
-- ACCEPT INVITATION FUNCTION
-- ============================================================================
-- Called when user accepts invitation via token

CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, membership_type TEXT, id UUID) AS $$
DECLARE
  inv_record RECORD;
  new_membership_id UUID;
BEGIN
  -- Find valid invitation
  SELECT * INTO inv_record
  FROM public.invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Create membership based on invitation type
  IF inv_record.organization_id IS NOT NULL THEN
    -- Organization-level invitation
    INSERT INTO public.organization_memberships (organization_id, user_id, role, invited_by)
    VALUES (inv_record.organization_id, p_user_id, inv_record.role, inv_record.invited_by)
    ON CONFLICT (organization_id, user_id) DO NOTHING
    RETURNING id INTO new_membership_id;

    membership_type := 'organization';
  ELSE
    -- Department-level invitation
    INSERT INTO public.department_memberships (department_id, user_id, role, invited_by)
    VALUES (inv_record.department_id, p_user_id, inv_record.role, inv_record.invited_by)
    ON CONFLICT (department_id, user_id) DO NOTHING
    RETURNING id INTO new_membership_id;

    membership_type := 'department';
  END IF;

  -- Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = NOW(), accepted_by = p_user_id
  WHERE id = inv_record.id;

  RETURN QUERY SELECT true, membership_type, new_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get pending invitations for an organization
CREATE OR REPLACE FUNCTION get_pending_org_invitations(p_org_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  role TEXT,
  scope TEXT,
  invited_by_email TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) AS $$
  SELECT
    i.id,
    i.email,
    i.role,
    CASE
      WHEN i.department_id IS NOT NULL THEN 'department'
      ELSE 'organization'
    END as scope,
    u.email as invited_by_email,
    i.created_at,
    i.expires_at
  FROM public.invitations i
  JOIN auth.users u ON i.invited_by = u.id
  WHERE i.organization_id = p_org_id
    AND i.status = 'pending'
  ORDER BY i.created_at DESC;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.invitations IS 'Email invitations to join organizations or departments - expire after 7 days';
COMMENT ON TABLE public.clients IS 'Client records for firms - businesses or individuals represented by solicitors/consultants';

COMMENT ON COLUMN public.invitations.token IS 'URL-safe random token sent in invitation email link';
COMMENT ON COLUMN public.invitations.token_hash IS 'Bcrypt hash for additional security validation';
COMMENT ON COLUMN public.invitations.personal_message IS 'Optional welcome message from inviter to invitee';

COMMENT ON COLUMN public.clients.type IS 'business: company/organization, individual: single person';
COMMENT ON COLUMN public.clients.company_number IS 'Companies House registration number for UK businesses';

COMMENT ON FUNCTION accept_invitation IS 'Validates invitation token and creates membership. Returns success status and membership details.';
COMMENT ON FUNCTION get_pending_org_invitations IS 'Lists all pending invitations for an organization (org-level and dept-level)';
