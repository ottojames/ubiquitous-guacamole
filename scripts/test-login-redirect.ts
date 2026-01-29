/**
 * Test script to verify login redirect logic works with actual database data
 * Run with: npx tsx scripts/test-login-redirect.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_USER_ID = '8ef09955-a1d1-4399-88b7-26ed402de8b2';
const TEST_EMAIL = 'ottoclarke@icloud.com';

async function testCouncilPortalRedirect() {
  console.log('\n=== Testing COUNCIL Portal Redirect ===\n');

  // Step 1: Get user's department membership
  console.log('1. Fetching department membership for user:', TEST_USER_ID);
  const { data: membership, error: membershipError } = await supabase
    .from('department_memberships')
    .select('department_id')
    .eq('user_id', TEST_USER_ID)
    .limit(1)
    .single();

  if (membershipError) {
    console.error('   ERROR: No department membership found:', membershipError.message);
    return false;
  }

  console.log('   Found department_id:', membership.department_id);

  // Step 2: Get department details
  console.log('2. Fetching department details...');
  const { data: department, error: deptError } = await supabase
    .from('departments')
    .select('slug, organization_id')
    .eq('id', membership.department_id)
    .single();

  if (deptError || !department) {
    console.error('   ERROR: Department not found:', deptError?.message);
    return false;
  }

  console.log('   Department slug:', department.slug);
  console.log('   Organization ID:', department.organization_id);

  // Step 3: Get organization details
  console.log('3. Fetching organization details...');
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('slug, type')
    .eq('id', department.organization_id)
    .single();

  if (orgError || !organization) {
    console.error('   ERROR: Organization not found:', orgError?.message);
    return false;
  }

  console.log('   Organization slug:', organization.slug);
  console.log('   Organization type:', organization.type);

  if (organization.type !== 'council') {
    console.error('   ERROR: Organization is not a council!');
    return false;
  }

  const redirectUrl = `/c/${organization.slug}/${department.slug}/dashboard`;
  console.log('\n   SUCCESS! Would redirect to:', redirectUrl);
  return true;
}

async function testProfessionalPortalRedirect() {
  console.log('\n=== Testing PROFESSIONAL Portal Redirect ===\n');

  // Step 1: Get all user's organization memberships
  console.log('1. Fetching organization memberships for user:', TEST_USER_ID);
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', TEST_USER_ID);

  if (membershipError || !memberships || memberships.length === 0) {
    console.error('   ERROR: No organization memberships found:', membershipError?.message);
    return false;
  }

  console.log('   Found', memberships.length, 'organization memberships');

  // Step 2: Find a firm organization
  console.log('2. Looking for a firm organization...');
  let firmOrg = null;

  for (const membership of memberships) {
    const { data: org } = await supabase
      .from('organizations')
      .select('slug, type, name')
      .eq('id', membership.organization_id)
      .single();

    console.log('   - Checking org:', org?.name, '(type:', org?.type + ')');

    if (org && org.type === 'firm') {
      firmOrg = org;
      break;
    }
  }

  if (!firmOrg) {
    console.error('   ERROR: No firm organization found for user');
    return false;
  }

  const redirectUrl = `/f/${firmOrg.slug}/dashboard`;
  console.log('\n   SUCCESS! Would redirect to:', redirectUrl);
  return true;
}

async function main() {
  console.log('Testing login redirect logic for:', TEST_EMAIL);
  console.log('User ID:', TEST_USER_ID);

  const councilResult = await testCouncilPortalRedirect();
  const professionalResult = await testProfessionalPortalRedirect();

  console.log('\n=== SUMMARY ===');
  console.log('Council Portal:', councilResult ? '✓ PASS' : '✗ FAIL');
  console.log('Professional Portal:', professionalResult ? '✓ PASS' : '✗ FAIL');

  if (councilResult && professionalResult) {
    console.log('\nAll tests passed! The login redirect logic should work.');
  } else {
    console.log('\nSome tests failed. Please fix the database data.');
    process.exit(1);
  }
}

main();
