-- Fix Demo Authentication Directly in Supabase
-- This creates the demo user accounts properly

-- Create Westminster Council user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_sso_user,
  role,
  instance_id
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'licensing@westminster.gov.uk',
  crypt('testpass123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"organization_id": "0e536037-48c3-4196-8fb6-c31803621050", "portal": "council"}'::jsonb,
  FALSE,
  'authenticated',
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (email)
DO UPDATE SET
  encrypted_password = crypt('testpass123', gen_salt('bf')),
  raw_user_meta_data = '{"organization_id": "0e536037-48c3-4196-8fb6-c31803621050", "portal": "council"}'::jsonb;

-- Create Wilson Partners user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_sso_user,
  role,
  instance_id
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'solicitor@wilsonpartners.com',
  crypt('testpass123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"organization_id": "550e8400-e29b-41d4-b001-446655440001", "portal": "firm"}'::jsonb,
  FALSE,
  'authenticated',
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (email)
DO UPDATE SET
  encrypted_password = crypt('testpass123', gen_salt('bf')),
  raw_user_meta_data = '{"organization_id": "550e8400-e29b-41d4-b001-446655440001", "portal": "firm"}'::jsonb;

-- Create Sampletonborough user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_sso_user,
  role,
  instance_id
) VALUES (
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'licensing@sampletonborough.gov.uk',
  crypt('testpass123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"organization_id": "550e8400-e29b-41d4-c002-446655440002", "portal": "council"}'::jsonb,
  FALSE,
  'authenticated',
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (email)
DO UPDATE SET
  encrypted_password = crypt('testpass123', gen_salt('bf')),
  raw_user_meta_data = '{"organization_id": "550e8400-e29b-41d4-c002-446655440002", "portal": "council"}'::jsonb;

-- Verify users were created
SELECT email, email_confirmed_at, created_at FROM auth.users
WHERE email IN (
  'licensing@westminster.gov.uk',
  'solicitor@wilsonpartners.com',
  'licensing@sampletonborough.gov.uk'
);