-- ============================================================================
-- Council Licensing Authority Requirements
-- ============================================================================
-- Stores licensing-specific requirements per council (350+ UK authorities)
-- Per PRD Section 2.2: Council database (350+ authorities with requirements)
-- ============================================================================

-- Create council_licensing_requirements table
CREATE TABLE IF NOT EXISTS public.council_licensing_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to council organization
  council_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Alternative: link by council name for flexibility
  council_name TEXT,
  
  -- Licensing contact details
  licensing_email TEXT,
  licensing_phone TEXT,
  licensing_address TEXT,
  licensing_department_name TEXT DEFAULT 'Licensing',
  
  -- Website and portals
  licensing_website_url TEXT,
  online_application_url TEXT,
  online_register_url TEXT,
  responsible_authorities_url TEXT,
  
  -- Premises licence specific
  premises_fee_new DECIMAL(10, 2),
  premises_fee_variation DECIMAL(10, 2),
  premises_fee_annual DECIMAL(10, 2),
  
  -- Consultation requirements
  consultation_period_days INTEGER DEFAULT 28, -- Standard LA2003 is 28 days
  requires_newspaper_advert BOOLEAN DEFAULT TRUE,
  newspaper_requirements TEXT, -- Any specific newspaper requirements
  
  -- Local requirements/notes
  local_requirements JSONB DEFAULT '{}', -- Flexible storage for council-specific rules
  special_policy_areas TEXT[], -- Cumulative Impact Zones, Late Night Levy areas, etc.
  
  -- DPS (Designated Premises Supervisor) requirements
  dps_requirements TEXT,
  
  -- Opening hours guidance
  framework_hours_guidance TEXT, -- Council's recommended terminal hours
  
  -- Processing times
  typical_processing_days INTEGER,
  hearing_lead_time_days INTEGER, -- Days notice before hearings
  
  -- Metadata
  last_verified_at TIMESTAMPTZ,
  verified_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per council
  UNIQUE(council_id),
  UNIQUE(council_name)
);

-- Indexes for common lookups
CREATE INDEX idx_council_licensing_council_id ON public.council_licensing_requirements(council_id);
CREATE INDEX idx_council_licensing_council_name ON public.council_licensing_requirements(council_name);
CREATE INDEX idx_council_licensing_email ON public.council_licensing_requirements(licensing_email);

-- Trigger for updated_at
CREATE TRIGGER update_council_licensing_requirements_updated_at
  BEFORE UPDATE ON public.council_licensing_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS - read access for all authenticated users, write for admins
ALTER TABLE public.council_licensing_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view council licensing requirements" 
  ON public.council_licensing_requirements
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Platform admins can manage council requirements"
  ON public.council_licensing_requirements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

GRANT SELECT ON public.council_licensing_requirements TO authenticated;
GRANT SELECT ON public.council_licensing_requirements TO anon;

-- ============================================================================
-- Sample data for major councils (to be expanded)
-- ============================================================================

INSERT INTO public.council_licensing_requirements (
  council_name,
  licensing_email,
  licensing_phone,
  licensing_website_url,
  consultation_period_days,
  requires_newspaper_advert,
  framework_hours_guidance,
  special_policy_areas
) VALUES
  ('Westminster City Council', 'licensing@westminster.gov.uk', '020 7641 6500', 
   'https://www.westminster.gov.uk/licensing', 28, TRUE,
   'Core hours: Mon-Thu 10:00-23:30, Fri-Sat 10:00-00:00, Sun 12:00-22:30',
   ARRAY['West End Cumulative Impact Zone', 'Edgware Road Cumulative Impact Zone']),
   
  ('City of London Corporation', 'licensing@cityoflondon.gov.uk', '020 7332 1406',
   'https://www.cityoflondon.gov.uk/services/licensing', 28, TRUE,
   'No standard framework hours - each application assessed on merits',
   ARRAY['Liverpool Street Cumulative Impact Zone']),
   
  ('Manchester City Council', 'licensing@manchester.gov.uk', '0161 234 4512',
   'https://www.manchester.gov.uk/licensing', 28, TRUE,
   'Guidance available in Statement of Licensing Policy',
   ARRAY['City Centre Cumulative Impact Zone']),
   
  ('Birmingham City Council', 'licensing@birmingham.gov.uk', '0121 303 6111',
   'https://www.birmingham.gov.uk/licensing', 28, TRUE,
   'Framework hours in Licensing Policy',
   ARRAY['Broad Street Cumulative Impact Zone', 'City Centre South Cumulative Impact Zone']),
   
  ('Bristol City Council', 'licensing@bristol.gov.uk', '0117 922 2000',
   'https://www.bristol.gov.uk/licensing', 28, TRUE,
   'Check Statement of Licensing Policy for guidance',
   ARRAY['Bristol City Centre Cumulative Impact Zone'])
   
ON CONFLICT (council_name) DO UPDATE SET
  licensing_email = EXCLUDED.licensing_email,
  licensing_phone = EXCLUDED.licensing_phone,
  licensing_website_url = EXCLUDED.licensing_website_url,
  updated_at = NOW();

-- ============================================================================
-- Function to lookup council licensing requirements by name or postcode
-- ============================================================================

CREATE OR REPLACE FUNCTION get_council_licensing_requirements(p_council_name TEXT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'council_name', council_name,
    'licensing_email', licensing_email,
    'licensing_phone', licensing_phone,
    'licensing_website_url', licensing_website_url,
    'online_register_url', online_register_url,
    'responsible_authorities_url', responsible_authorities_url,
    'consultation_period_days', consultation_period_days,
    'requires_newspaper_advert', requires_newspaper_advert,
    'framework_hours_guidance', framework_hours_guidance,
    'special_policy_areas', special_policy_areas,
    'local_requirements', local_requirements,
    'typical_processing_days', typical_processing_days,
    'last_verified_at', last_verified_at
  ) INTO v_result
  FROM public.council_licensing_requirements
  WHERE council_name ILIKE '%' || p_council_name || '%'
  LIMIT 1;
  
  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_council_licensing_requirements TO authenticated;
GRANT EXECUTE ON FUNCTION get_council_licensing_requirements TO anon;

-- Add comment
COMMENT ON TABLE public.council_licensing_requirements IS 
  'Licensing authority-specific requirements and contact details for UK councils. Per PRD Section 2.2.';
