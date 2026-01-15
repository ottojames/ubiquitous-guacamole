-- Create client_relationships table for firm-client associations
CREATE TABLE IF NOT EXISTS client_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),

  -- Prevent duplicate relationships
  UNIQUE(firm_id, client_id),

  -- Ensure firm and client are different organizations
  CHECK (firm_id != client_id)
);

-- Create indexes for performance
CREATE INDEX idx_client_relationships_firm_id ON client_relationships(firm_id);
CREATE INDEX idx_client_relationships_client_id ON client_relationships(client_id);
CREATE INDEX idx_client_relationships_status ON client_relationships(status);

-- Add organization columns if not exists for client management
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS is_client BOOLEAN DEFAULT FALSE;

-- Create a view for firm clients with aggregated data
CREATE OR REPLACE VIEW firm_clients AS
SELECT
  cr.id as relationship_id,
  cr.firm_id,
  cr.status as relationship_status,
  cr.notes as relationship_notes,
  cr.created_at as relationship_created_at,
  c.id as client_id,
  c.name as client_name,
  c.slug as client_slug,
  c.type as client_type,
  c.contact_name,
  c.contact_email,
  c.contact_phone,
  c.address,
  c.created_at as client_created_at,
  COALESCE(
    (SELECT COUNT(*) FROM notices WHERE published_by_organization_id = c.id),
    0
  ) as notice_count,
  COALESCE(
    (SELECT COUNT(*) FROM notices WHERE published_by_organization_id = c.id AND status = 'published'),
    0
  ) as active_notice_count
FROM client_relationships cr
JOIN organizations c ON c.id = cr.client_id;

-- Function to add a client to a firm
CREATE OR REPLACE FUNCTION add_client_to_firm(
  p_firm_id UUID,
  p_client_name TEXT,
  p_contact_name TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_address JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_client_id UUID;
  v_relationship_id UUID;
BEGIN
  -- Create the client organization
  INSERT INTO organizations (
    name,
    slug,
    type,
    contact_name,
    contact_email,
    contact_phone,
    address,
    is_client
  ) VALUES (
    p_client_name,
    LOWER(REPLACE(REPLACE(p_client_name, ' ', '-'), '[^a-z0-9-]', '')),
    'client',
    p_contact_name,
    p_contact_email,
    p_contact_phone,
    p_address,
    TRUE
  ) RETURNING id INTO v_client_id;

  -- Create the relationship
  INSERT INTO client_relationships (
    firm_id,
    client_id,
    notes,
    created_by
  ) VALUES (
    p_firm_id,
    v_client_id,
    p_notes,
    auth.uid()
  ) RETURNING id INTO v_relationship_id;

  RETURN v_relationship_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get quick publish data for a client
CREATE OR REPLACE FUNCTION get_client_quick_publish_data(
  p_firm_id UUID,
  p_client_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'client', row_to_json(c.*),
    'recent_premises', (
      SELECT jsonb_agg(DISTINCT premises)
      FROM notices
      WHERE published_by_organization_id = p_client_id
      AND premises IS NOT NULL
      ORDER BY premises->>'name'
      LIMIT 5
    ),
    'recent_applicants', (
      SELECT jsonb_agg(DISTINCT applicant)
      FROM notices
      WHERE published_by_organization_id = p_client_id
      AND applicant IS NOT NULL
      ORDER BY applicant->>'name'
      LIMIT 5
    ),
    'last_notice_type', (
      SELECT notice_type
      FROM notices
      WHERE published_by_organization_id = p_client_id
      ORDER BY created_at DESC
      LIMIT 1
    ),
    'can_use_allowance', (
      SELECT can_publish_notice
      FROM can_publish_notice(p_firm_id)
    )
  ) INTO v_result
  FROM organizations c
  WHERE c.id = p_client_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for client_relationships
ALTER TABLE client_relationships ENABLE ROW LEVEL SECURITY;

-- Firms can view and manage their own client relationships
CREATE POLICY "Firms can view own client relationships" ON client_relationships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = client_relationships.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm admins can insert client relationships" ON client_relationships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = client_relationships.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Firm admins can update client relationships" ON client_relationships
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = client_relationships.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Firm admins can delete client relationships" ON client_relationships
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = client_relationships.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Grant permissions
GRANT SELECT ON firm_clients TO authenticated;
GRANT ALL ON client_relationships TO authenticated;
GRANT EXECUTE ON FUNCTION add_client_to_firm TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_quick_publish_data TO authenticated;