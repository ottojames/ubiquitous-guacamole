-- Probate Estates and Claims Tracking
-- Implements multi-property support and creditor claims tracking for Trustee Act 1925 s.27

-- Estate Properties Table (one estate can have multiple properties)
CREATE TABLE IF NOT EXISTS public.probate_estate_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  
  -- Property Details
  property_address TEXT NOT NULL,
  property_postcode TEXT,
  property_type TEXT, -- 'residential', 'commercial', 'land', 'mixed'
  property_value DECIMAL(12, 2),
  
  -- Newspaper Publication (s.27 requires newspaper in district where land is situate)
  newspaper_name TEXT,
  newspaper_publication_date DATE,
  newspaper_proof_url TEXT, -- URL to uploaded proof of publication
  
  -- Status tracking
  publication_status TEXT DEFAULT 'pending' CHECK (publication_status IN ('pending', 'submitted', 'published', 'proof_received')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_probate_properties_notice ON public.probate_estate_properties(notice_id);
CREATE INDEX idx_probate_properties_postcode ON public.probate_estate_properties(property_postcode);

-- Creditor Claims Table
CREATE TABLE IF NOT EXISTS public.probate_creditor_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  
  -- Claimant Details
  claimant_name TEXT NOT NULL,
  claimant_address TEXT,
  claimant_email TEXT,
  claimant_phone TEXT,
  claimant_reference TEXT, -- Their internal reference
  
  -- Claim Details
  claim_type TEXT NOT NULL CHECK (claim_type IN ('debt', 'charge', 'interest', 'beneficial_interest', 'other')),
  claim_description TEXT NOT NULL,
  claim_amount DECIMAL(12, 2),
  claim_currency TEXT DEFAULT 'GBP',
  supporting_documents JSONB DEFAULT '[]'::jsonb, -- Array of {name, url, uploaded_at}
  
  -- Workflow
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'under_review', 'verified', 'disputed', 'paid', 'rejected')),
  response_notes TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_probate_claims_notice ON public.probate_creditor_claims(notice_id);
CREATE INDEX idx_probate_claims_status ON public.probate_creditor_claims(status);

-- Gazette Submissions Table (tracking London Gazette submissions)
CREATE TABLE IF NOT EXISTS public.probate_gazette_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  
  -- Gazette Details
  gazette_type TEXT DEFAULT 'london' CHECK (gazette_type IN ('london', 'edinburgh', 'belfast')),
  submission_reference TEXT, -- Reference from Gazette API
  gazette_notice_id TEXT, -- ID returned by Gazette after publication
  gazette_url TEXT, -- Direct URL to notice on Gazette website
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pending_payment', 'published', 'rejected', 'cancelled')),
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Content (as submitted)
  notice_content JSONB NOT NULL, -- Full notice data as sent to Gazette
  gazette_response JSONB, -- Response from Gazette API
  
  -- Cost tracking
  fee_amount DECIMAL(8, 2),
  fee_currency TEXT DEFAULT 'GBP',
  payment_reference TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_gazette_submissions_notice ON public.probate_gazette_submissions(notice_id);
CREATE INDEX idx_gazette_submissions_status ON public.probate_gazette_submissions(status);

-- Newspaper Mapping Table (property postcode to suggested newspapers)
CREATE TABLE IF NOT EXISTS public.newspaper_coverage_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Newspaper Details
  newspaper_name TEXT NOT NULL,
  newspaper_code TEXT, -- JICREG code if available
  circulation_area TEXT, -- Description of coverage area
  
  -- Coverage (using postcode districts)
  postcode_areas TEXT[] NOT NULL, -- e.g., ['SW1', 'SW2', 'W1', 'EC']
  local_authority_codes TEXT[], -- ONS codes for local authorities covered
  
  -- Contact/Ordering
  advertising_email TEXT,
  advertising_phone TEXT,
  advertising_url TEXT,
  
  -- Pricing
  base_rate_per_line DECIMAL(6, 2),
  minimum_lines INTEGER DEFAULT 1,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_newspaper_areas ON public.newspaper_coverage_areas USING GIN (postcode_areas);

-- Function to find newspapers by postcode
CREATE OR REPLACE FUNCTION find_newspapers_for_postcode(p_postcode TEXT)
RETURNS TABLE (
  id UUID,
  newspaper_name TEXT,
  newspaper_code TEXT,
  circulation_area TEXT,
  advertising_email TEXT,
  advertising_phone TEXT,
  base_rate_per_line DECIMAL(6, 2)
) AS $$
DECLARE
  v_outward TEXT;
BEGIN
  -- Extract outward code (e.g., 'SW1' from 'SW1A 2AA')
  v_outward := UPPER(TRIM(SPLIT_PART(TRIM(p_postcode), ' ', 1)));
  
  -- Also try without trailing digit for broader match (e.g., 'SW' from 'SW1')
  RETURN QUERY
  SELECT 
    n.id,
    n.newspaper_name,
    n.newspaper_code,
    n.circulation_area,
    n.advertising_email,
    n.advertising_phone,
    n.base_rate_per_line
  FROM public.newspaper_coverage_areas n
  WHERE n.is_active = TRUE
    AND (
      v_outward = ANY(n.postcode_areas)
      OR REGEXP_REPLACE(v_outward, '[0-9]+$', '') = ANY(n.postcode_areas)
    )
  ORDER BY n.newspaper_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate safe distribution date
CREATE OR REPLACE FUNCTION calculate_safe_distribution_date(
  p_publication_date DATE,
  p_buffer_days INTEGER DEFAULT 7
)
RETURNS DATE AS $$
BEGIN
  -- Trustee Act s.27 requires 2 months notice
  -- Add buffer for safety
  RETURN p_publication_date + INTERVAL '2 months' + (p_buffer_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for probate notice summary
CREATE OR REPLACE VIEW public.probate_notice_summary AS
SELECT
  n.id AS notice_id,
  n.notice_type,
  n.status,
  n.created_at,
  n.published_at,
  (n.extras->>'tokens'->>'DECEASED_NAME')::TEXT AS deceased_name,
  (n.extras->>'tokens'->>'DATE_OF_DEATH')::TEXT AS date_of_death,
  (n.extras->>'tokens'->>'DEADLINE_DATE')::TEXT AS claims_deadline,
  calculate_safe_distribution_date(
    COALESCE(n.published_at::DATE, n.created_at::DATE)
  ) AS safe_distribution_date,
  COUNT(DISTINCT p.id) AS property_count,
  COUNT(DISTINCT c.id) AS claim_count,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'received') AS pending_claims,
  g.status AS gazette_status,
  g.gazette_url
FROM public.notices n
LEFT JOIN public.probate_estate_properties p ON p.notice_id = n.id
LEFT JOIN public.probate_creditor_claims c ON c.notice_id = n.id
LEFT JOIN public.probate_gazette_submissions g ON g.notice_id = n.id
WHERE n.notice_type LIKE 'probate%'
GROUP BY n.id, g.status, g.gazette_url;

-- RLS Policies
ALTER TABLE public.probate_estate_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.probate_creditor_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.probate_gazette_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newspaper_coverage_areas ENABLE ROW LEVEL SECURITY;

-- Estate Properties: Access via notice ownership
CREATE POLICY "Users can view their notices properties" ON public.probate_estate_properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notices n
      JOIN public.organization_memberships om ON om.organization_id = n.organization_id
      WHERE n.id = notice_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their notices properties" ON public.probate_estate_properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.notices n
      JOIN public.organization_memberships om ON om.organization_id = n.organization_id
      WHERE n.id = notice_id AND om.user_id = auth.uid()
    )
  );

-- Creditor Claims: Public can submit, firm can view/manage
CREATE POLICY "Anyone can submit claims" ON public.probate_creditor_claims
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Firm members can view claims" ON public.probate_creditor_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notices n
      JOIN public.organization_memberships om ON om.organization_id = (n.extras->>'published_by_organization_id')::UUID
      WHERE n.id = notice_id AND om.user_id = auth.uid()
    )
  );

-- Gazette Submissions: Firm access only
CREATE POLICY "Firm members can manage gazette submissions" ON public.probate_gazette_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.notices n
      JOIN public.organization_memberships om ON om.organization_id = (n.extras->>'published_by_organization_id')::UUID
      WHERE n.id = notice_id AND om.user_id = auth.uid()
    )
  );

-- Newspaper coverage areas: Public read
CREATE POLICY "Anyone can read newspaper coverage" ON public.newspaper_coverage_areas
  FOR SELECT USING (TRUE);

-- Grant permissions
GRANT ALL ON public.probate_estate_properties TO authenticated;
GRANT ALL ON public.probate_creditor_claims TO authenticated, anon;
GRANT ALL ON public.probate_gazette_submissions TO authenticated;
GRANT SELECT ON public.newspaper_coverage_areas TO authenticated, anon;
GRANT SELECT ON public.probate_notice_summary TO authenticated;
GRANT EXECUTE ON FUNCTION find_newspapers_for_postcode TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calculate_safe_distribution_date TO authenticated, anon;

-- Seed some initial newspaper coverage data
INSERT INTO public.newspaper_coverage_areas (newspaper_name, newspaper_code, circulation_area, postcode_areas, advertising_email)
VALUES
  ('Evening Standard', 'EVSTD', 'Greater London', ARRAY['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC'], 'advertising@standard.co.uk'),
  ('Manchester Evening News', 'MANEN', 'Greater Manchester', ARRAY['M', 'BL', 'OL', 'SK', 'WA', 'WN'], 'advertising@manchestereveningnews.co.uk'),
  ('Birmingham Mail', 'BIRML', 'West Midlands', ARRAY['B', 'CV', 'DY', 'WS', 'WV'], 'advertising@birminghammail.co.uk'),
  ('Yorkshire Post', 'YPOST', 'Yorkshire', ARRAY['BD', 'DN', 'HD', 'HG', 'HU', 'HX', 'LS', 'S', 'WF', 'YO'], 'advertising@yorkshirepost.co.uk'),
  ('Bristol Post', 'BRSTP', 'Bristol and Somerset', ARRAY['BS', 'BA'], 'advertising@bristolpost.co.uk'),
  ('Liverpool Echo', 'LIVEC', 'Merseyside', ARRAY['L', 'CH', 'PR', 'WA'], 'advertising@liverpoolecho.co.uk'),
  ('Newcastle Chronicle', 'NEWCH', 'North East', ARRAY['NE', 'DH', 'SR', 'TS'], 'advertising@chroniclelive.co.uk'),
  ('Scotsman', 'SCOTM', 'Edinburgh and Lothians', ARRAY['EH'], 'advertising@scotsman.com'),
  ('Glasgow Herald', 'GLASG', 'Greater Glasgow', ARRAY['G', 'PA'], 'advertising@heraldscotland.com'),
  ('South Wales Echo', 'SWECH', 'South Wales', ARRAY['CF', 'NP', 'SA'], 'advertising@walesonline.co.uk')
ON CONFLICT DO NOTHING;

-- Updated_at triggers
CREATE TRIGGER update_probate_properties_updated_at
  BEFORE UPDATE ON public.probate_estate_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_probate_claims_updated_at
  BEFORE UPDATE ON public.probate_creditor_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gazette_submissions_updated_at
  BEFORE UPDATE ON public.probate_gazette_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newspaper_areas_updated_at
  BEFORE UPDATE ON public.newspaper_coverage_areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
