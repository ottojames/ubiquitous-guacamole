-- ============================================
-- DEMO AUTHENTICATION SETUP FOR CIVIC NOTICES
-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR TO SET UP DEMO ACCOUNTS
--
-- HOW TO RUN:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this ENTIRE file
-- 6. Click "Run" button
-- 7. Wait for completion

-- ============================================
-- ENSURE REQUIRED TABLES EXIST
-- ============================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create organizations table if it doesn't exist (should already exist)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('council', 'firm')),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  domain TEXT,
  status TEXT DEFAULT 'active',
  contact_email TEXT,
  registration_number TEXT,
  practice_areas TEXT[],
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT,
  email TEXT,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Create organization_memberships table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  role_id UUID REFERENCES public.roles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create department_memberships table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.department_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  role_id UUID REFERENCES public.roles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(department_id, user_id)
);

-- Create firm_clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.firm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  postcode TEXT,
  active_notices INTEGER DEFAULT 0,
  total_notices INTEGER DEFAULT 0,
  last_notice_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Create council_settings table for auto-population
CREATE TABLE IF NOT EXISTS public.council_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  authority_address TEXT NOT NULL,
  authority_email TEXT NOT NULL,
  authority_phone TEXT,
  online_register_url TEXT NOT NULL,
  licensing_email TEXT,
  planning_email TEXT,
  environmental_email TEXT,
  highways_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CLEAN UP EXISTING DEMO DATA (SAFE MODE)
-- ============================================

-- Delete existing demo organizations and their dependencies (cascades)
DELETE FROM public.organizations
WHERE slug IN ('sampletonborough-council', 'westminster-council', 'wilson-partners');

-- ============================================
-- CREATE ORGANIZATIONS
-- ============================================

-- Sampletonborough Council
INSERT INTO public.organizations (id, type, name, slug, domain, status, contact_email, settings)
VALUES (
  'e6fa3c45-5e2a-4f89-b1c2-d3e4f5a6b7c8'::UUID,
  'council',
  'Sampletonborough Council',
  'sampletonborough-council',
  'sampletonborough.gov.uk',
  'active',
  'info@sampletonborough.gov.uk',
  jsonb_build_object(
    'default_timezone', 'Europe/London',
    'branding_color', '#1e40af'
  )
);

-- Westminster Council (for testing department switching)
INSERT INTO public.organizations (id, type, name, slug, domain, status, contact_email, settings)
VALUES (
  '0e536037-48c3-4196-8fb6-c31803621050'::UUID,
  'council',
  'Westminster Council',
  'westminster-council',
  'westminster.gov.uk',
  'active',
  'info@westminster.gov.uk',
  jsonb_build_object(
    'default_timezone', 'Europe/London',
    'branding_color', '#991b1b'
  )
);

-- Wilson Partners (Law Firm)
INSERT INTO public.organizations (id, type, name, slug, domain, status, contact_email, practice_areas, settings)
VALUES (
  'a1b2c3d4-e5f6-4789-abcd-ef0123456789'::UUID,
  'firm',
  'Wilson & Partners LLP',
  'wilson-partners',
  'wilsonpartners.com',
  'active',
  'contact@wilsonpartners.com',
  ARRAY['licensing', 'planning', 'environmental_health'],
  jsonb_build_object(
    'default_timezone', 'Europe/London'
  )
);

-- ============================================
-- CREATE DEPARTMENTS
-- ============================================

-- Sampletonborough Departments
INSERT INTO public.departments (id, organization_id, name, slug, type, email, description, settings)
VALUES
  (
    'd1e2f3a4-b5c6-4789-9abc-def012345678'::UUID,
    'e6fa3c45-5e2a-4f89-b1c2-d3e4f5a6b7c8'::UUID,
    'Licensing Department',
    'licensing',
    'licensing',
    'licensing@sampletonborough.gov.uk',
    'Alcohol and entertainment licensing',
    jsonb_build_object(
      'default_representation_period_days', 28,
      'require_approval_for_publication', false,
      'allowed_notice_types', jsonb_build_array('premises-licence', 'variation', 'review', 'club-certificate')
    )
  ),
  (
    'd2e3f4a5-b6c7-4890-abcd-ef0123456789'::UUID,
    'e6fa3c45-5e2a-4f89-b1c2-d3e4f5a6b7c8'::UUID,
    'Planning Department',
    'planning',
    'planning',
    'planning@sampletonborough.gov.uk',
    'Development control and planning applications',
    jsonb_build_object(
      'default_representation_period_days', 21,
      'require_approval_for_publication', true,
      'allowed_notice_types', jsonb_build_array('planning-application', 'planning-appeal')
    )
  );

-- Westminster Departments
INSERT INTO public.departments (id, organization_id, name, slug, type, email, description, settings)
VALUES
  (
    '2145bf45-da2d-421d-8d8e-8ad46bc6bbef'::UUID,
    '0e536037-48c3-4196-8fb6-c31803621050'::UUID,
    'Licensing Department',
    'licensing',
    'licensing',
    'licensing@westminster.gov.uk',
    'Westminster licensing authority',
    jsonb_build_object(
      'default_representation_period_days', 28,
      'require_approval_for_publication', false
    )
  ),
  (
    '3256cg56-eb3e-532e-9e9f-9be57cd7ccfg'::UUID,
    '0e536037-48c3-4196-8fb6-c31803621050'::UUID,
    'Planning Department',
    'planning',
    'planning',
    'planning@westminster.gov.uk',
    'Westminster planning authority',
    jsonb_build_object(
      'default_representation_period_days', 21,
      'require_approval_for_publication', true
    )
  );

-- ============================================
-- ADD COUNCIL SETTINGS
-- ============================================

INSERT INTO public.council_settings (organization_id, authority_address, authority_email, authority_phone, online_register_url, licensing_email, planning_email)
VALUES
  (
    'e6fa3c45-5e2a-4f89-b1c2-d3e4f5a6b7c8'::UUID, -- Sampletonborough
    'Town Hall, High Street, Sampletonborough SB1 1AA',
    'info@sampletonborough.gov.uk',
    '01234 567890',
    'https://sampletonborough.gov.uk/licensing/register',
    'licensing@sampletonborough.gov.uk',
    'planning@sampletonborough.gov.uk'
  ),
  (
    '0e536037-48c3-4196-8fb6-c31803621050'::UUID, -- Westminster
    'Westminster City Hall, 64 Victoria Street, London SW1E 6QP',
    'info@westminster.gov.uk',
    '020 7641 6000',
    'https://westminster.gov.uk/licensing/register',
    'licensing@westminster.gov.uk',
    'planning@westminster.gov.uk'
  );

-- ============================================
-- CREATE FIRM CLIENTS
-- ============================================

INSERT INTO public.firm_clients (organization_id, name, slug, contact_person, contact_email, contact_phone, address, postcode, active_notices, total_notices, last_notice_date)
VALUES
  (
    'a1b2c3d4-e5f6-4789-abcd-ef0123456789'::UUID,
    'The Red Lion Pub',
    'red-lion-pub',
    'John Smith',
    'john@redlionpub.com',
    '020 7123 4567',
    '123 High Street, Westminster',
    'SW1A 1AA',
    2,
    5,
    now() - interval '3 days'
  ),
  (
    'a1b2c3d4-e5f6-4789-abcd-ef0123456789'::UUID,
    'Crown Hotel',
    'crown-hotel',
    'Sarah Johnson',
    'sarah@crownhotel.co.uk',
    '020 7234 5678',
    '456 Park Lane, Mayfair',
    'W1K 1PN',
    1,
    3,
    now() - interval '10 days'
  ),
  (
    'a1b2c3d4-e5f6-4789-abcd-ef0123456789'::UUID,
    'Blue Moon Restaurant',
    'blue-moon-restaurant',
    'Michael Chen',
    'michael@bluemoon.co.uk',
    '020 7345 6789',
    '789 Oxford Street',
    'W1D 2HJ',
    3,
    8,
    now() - interval '1 day'
  );

-- ============================================
-- CREATE DEMO USERS IN AUTH SCHEMA
-- ============================================

-- Function to create users (if not exists)
CREATE OR REPLACE FUNCTION create_demo_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    -- Create new user
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      v_user_id,
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('full_name', p_full_name),
      false,
      'authenticated'
    );

    -- Create profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (v_user_id, p_email, p_full_name)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create demo users
DO $$
DECLARE
  v_sarah_id UUID;
  v_licensing_id UUID;
  v_emma_id UUID;
BEGIN
  -- Council Users
  v_sarah_id := create_demo_user('licensing@sampletonborough.gov.uk', 'testpass123', 'Sarah Wilson');
  v_licensing_id := create_demo_user('licensing@westminster.gov.uk', 'testpass123', 'Westminster Licensing');

  -- Firm User
  v_emma_id := create_demo_user('solicitor@wilsonpartners.com', 'testpass123', 'Emma Thompson');

  -- Link Sarah to Sampletonborough Licensing Department
  INSERT INTO public.department_memberships (department_id, user_id, role)
  VALUES ('d1e2f3a4-b5c6-4789-9abc-def012345678'::UUID, v_sarah_id, 'dept_admin')
  ON CONFLICT (department_id, user_id) DO UPDATE SET role = 'dept_admin';

  -- Also give Sarah access to Planning for department switching demo
  INSERT INTO public.department_memberships (department_id, user_id, role)
  VALUES ('d2e3f4a5-b6c7-4890-abcd-ef0123456789'::UUID, v_sarah_id, 'officer')
  ON CONFLICT (department_id, user_id) DO UPDATE SET role = 'officer';

  -- Link Westminster user to Westminster departments
  INSERT INTO public.department_memberships (department_id, user_id, role)
  VALUES
    ('2145bf45-da2d-421d-8d8e-8ad46bc6bbef'::UUID, v_licensing_id, 'dept_admin'),
    ('3256cg56-eb3e-532e-9e9f-9be57cd7ccfg'::UUID, v_licensing_id, 'officer')
  ON CONFLICT (department_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Link Emma to Wilson Partners firm
  INSERT INTO public.organization_memberships (organization_id, user_id, role)
  VALUES ('a1b2c3d4-e5f6-4789-abcd-ef0123456789'::UUID, v_emma_id, 'org_admin')
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'org_admin';
END $$;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organizations: Public read, members can update
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations
  FOR SELECT USING (true);

CREATE POLICY "Organization members can update" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

-- Departments: Public read
CREATE POLICY "Departments are viewable by everyone" ON public.departments
  FOR SELECT USING (true);

-- Organization memberships: Members can view their org's memberships
CREATE POLICY "Members can view org memberships" ON public.organization_memberships
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Department memberships: Members can view their dept's memberships
CREATE POLICY "Members can view dept memberships" ON public.department_memberships
  FOR SELECT USING (
    department_id IN (
      SELECT department_id FROM public.department_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Council settings: Council members can view and update
CREATE POLICY "Council members can view settings" ON public.council_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id FROM public.departments d
      JOIN public.department_memberships dm ON dm.department_id = d.id
      WHERE dm.user_id = auth.uid()
    )
  );

CREATE POLICY "Council admins can update settings" ON public.council_settings
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid() AND role IN ('org_admin', 'dept_admin')
    )
  );

-- Firm clients: Firm members can manage
CREATE POLICY "Firm members can view clients" ON public.firm_clients
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can manage clients" ON public.firm_clients
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify users were created
SELECT 'Users created:' as status, count(*) as count
FROM auth.users
WHERE email IN (
  'licensing@sampletonborough.gov.uk',
  'licensing@westminster.gov.uk',
  'solicitor@wilsonpartners.com'
);

-- Verify organizations
SELECT 'Organizations created:' as status, count(*) as count
FROM public.organizations
WHERE slug IN ('sampletonborough-council', 'westminster-council', 'wilson-partners');

-- Verify departments
SELECT 'Departments created:' as status, count(*) as count
FROM public.departments
WHERE organization_id IN (
  SELECT id FROM public.organizations
  WHERE slug IN ('sampletonborough-council', 'westminster-council')
);

-- Verify memberships
SELECT 'Department memberships created:' as status, count(*) as count
FROM public.department_memberships;

SELECT 'Organization memberships created:' as status, count(*) as count
FROM public.organization_memberships;

-- Show demo accounts
SELECT
  u.email,
  'testpass123' as password,
  p.full_name,
  CASE
    WHEN dm.department_id IS NOT NULL THEN 'Council Portal'
    WHEN om.organization_id IS NOT NULL THEN 'Professional Portal'
    ELSE 'Unknown'
  END as portal_type
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.department_memberships dm ON dm.user_id = u.id
LEFT JOIN public.organization_memberships om ON om.user_id = u.id
WHERE u.email IN (
  'licensing@sampletonborough.gov.uk',
  'licensing@westminster.gov.uk',
  'solicitor@wilsonpartners.com'
);