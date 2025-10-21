-- Seed Data Migration
-- Creates sample organizations and departments for testing

-- ============================================================================
-- SAMPLE COUNCILS
-- ============================================================================

-- Insert sample councils
INSERT INTO public.organizations (id, type, name, domain, status, contact_email, settings)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'council',
    'Sampleton Borough Council',
    'sampleton.gov.uk',
    'active',
    'info@sampleton.gov.uk',
    '{"default_timezone": "Europe/London", "branding_color": "#1e3a8a"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002'::UUID,
    'council',
    'Riverside City Council',
    'riverside.gov.uk',
    'active',
    'contact@riverside.gov.uk',
    '{"default_timezone": "Europe/London", "branding_color": "#059669"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE DEPARTMENTS
-- ============================================================================

-- Sampleton Borough Council Departments
INSERT INTO public.departments (id, organization_id, name, slug, type, email, description, settings)
VALUES
  (
    '00000000-0000-0000-0001-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Licensing Department',
    'licensing',
    'licensing',
    'licensing@sampleton.gov.uk',
    'Alcohol and entertainment licensing for Sampleton Borough',
    '{
      "default_representation_period_days": 28,
      "require_approval_for_publication": false,
      "allowed_notice_types": ["premises-licence", "variation", "review", "club-certificate"],
      "default_newspaper": "Sampleton Gazette"
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Planning Department',
    'planning',
    'planning',
    'planning@sampleton.gov.uk',
    'Development control and planning applications',
    '{
      "default_representation_period_days": 21,
      "require_approval_for_publication": true,
      "allowed_notice_types": ["planning-application", "planning-appeal"],
      "default_newspaper": "Sampleton Gazette"
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000003'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Traffic Management',
    'traffic',
    'traffic',
    'traffic@sampleton.gov.uk',
    'Road closures, traffic orders, and parking',
    '{
      "default_representation_period_days": 14,
      "require_approval_for_publication": false,
      "allowed_notice_types": ["traffic-order", "road-closure"]
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Riverside City Council Departments
INSERT INTO public.departments (id, organization_id, name, slug, type, email, description, settings)
VALUES
  (
    '00000000-0000-0000-0002-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    'Licensing Authority',
    'licensing',
    'licensing',
    'licensing@riverside.gov.uk',
    'Licensing services for Riverside City',
    '{
      "default_representation_period_days": 28,
      "require_approval_for_publication": false,
      "allowed_notice_types": ["premises-licence", "variation"]
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0002-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    'Environmental Health',
    'environmental-health',
    'environmental_health',
    'envhealth@riverside.gov.uk',
    'Food safety, pollution control, and health inspections',
    '{
      "default_representation_period_days": 21,
      "require_approval_for_publication": true
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE FIRMS
-- ============================================================================

INSERT INTO public.organizations (id, type, name, domain, status, contact_email, registration_number, settings)
VALUES
  (
    '00000000-0000-0000-0000-000000000101'::UUID,
    'firm',
    'Wilson & Partners LLP',
    'wilsonpartners.com',
    'active',
    'contact@wilsonpartners.com',
    '12345678',
    '{"default_timezone": "Europe/London"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000102'::UUID,
    'firm',
    'Thompson Legal Services',
    'thompsonlegal.co.uk',
    'active',
    'info@thompsonlegal.co.uk',
    '87654321',
    '{"default_timezone": "Europe/London"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE NOTICE TEMPLATES
-- ============================================================================

-- Template for Sampleton Licensing
INSERT INTO public.templates (id, department_id, name, description, notice_type, default_values, use_count)
VALUES
  (
    '00000000-0000-0001-0001-000000000001'::UUID,
    '00000000-0000-0000-0001-000000000001'::UUID,
    'Standard Pub Licence',
    'Template for typical pub/bar premises licence applications',
    'premises-licence',
    '{
      "consultation": {
        "authority": "Sampleton Borough Council",
        "newspaper": "Sampleton Gazette"
      },
      "extras": {
        "operating_hours": {
          "monday": {"open": "10:00", "close": "23:00"},
          "tuesday": {"open": "10:00", "close": "23:00"},
          "wednesday": {"open": "10:00", "close": "23:00"},
          "thursday": {"open": "10:00", "close": "23:00"},
          "friday": {"open": "10:00", "close": "00:00"},
          "saturday": {"open": "10:00", "close": "00:00"},
          "sunday": {"open": "12:00", "close": "22:30"}
        }
      }
    }'::jsonb,
    0
  ),
  (
    '00000000-0000-0001-0001-000000000002'::UUID,
    '00000000-0000-0000-0001-000000000001'::UUID,
    'Off-Licence Template',
    'Template for off-licence (alcohol sales only)',
    'premises-licence',
    '{
      "consultation": {
        "authority": "Sampleton Borough Council",
        "newspaper": "Sampleton Gazette"
      },
      "extras": {
        "licensable_activities": ["sale_of_alcohol_off"],
        "operating_hours": {
          "all_days": {"open": "08:00", "close": "23:00"}
        }
      }
    }'::jsonb,
    0
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.organizations.id IS 'Sample IDs use pattern: 00000000-0000-0000-00XX-0000000000YY where XX=org type (00=council, 01=firm), YY=sequence';
COMMENT ON COLUMN public.departments.id IS 'Sample IDs use pattern: 00000000-0000-0000-XXYY-0000000000ZZ where XX=org, YY=dept type, ZZ=sequence';

-- Seed data complete
SELECT
  'Seed data loaded: ' ||
  (SELECT COUNT(*) FROM organizations WHERE type = 'council') || ' councils, ' ||
  (SELECT COUNT(*) FROM organizations WHERE type = 'firm') || ' firms, ' ||
  (SELECT COUNT(*) FROM departments) || ' departments, ' ||
  (SELECT COUNT(*) FROM templates) || ' templates'
AS seed_summary;
