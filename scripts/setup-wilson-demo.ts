#!/usr/bin/env tsx

/**
 * Setup Wilson & Partners Demo Account
 * Creates demo user and verifies organization membership
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const DEMO_EMAIL = 'demo@wilsonpartners.com';
const DEMO_PASSWORD = 'WilsonDemo123!';
const WILSON_ORG_ID = '00000000-0000-0000-0000-000000000101';

async function main() {
  console.log('🔍 Checking for existing demo user...');

  // Check if user exists
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError);
    process.exit(1);
  }

  let demoUser = users.users.find(u => u.email === DEMO_EMAIL);

  if (!demoUser) {
    console.log('📝 Creating demo user account...');

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Wilson Demo User'
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      process.exit(1);
    }

    demoUser = newUser.user;
    console.log('✅ User created:', demoUser.id);
  } else {
    console.log('✅ User already exists:', demoUser.id);
  }

  // Check organization exists
  console.log('\n🔍 Checking Wilson & Partners organization...');
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', WILSON_ORG_ID)
    .single();

  if (orgError || !org) {
    console.error('❌ Wilson & Partners organization not found!');
    console.error('   Organization ID:', WILSON_ORG_ID);
    console.error('   Error:', orgError);

    // List organizations to help debug
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, slug, type')
      .eq('type', 'firm')
      .limit(5);

    console.log('\n📋 Available firms:');
    orgs?.forEach(o => {
      console.log(`   - ${o.name} (${o.slug}) - ${o.id}`);
    });

    process.exit(1);
  }

  console.log('✅ Organization found:', org.name);

  // Check/create organization membership
  console.log('\n🔍 Checking organization membership...');
  const { data: membership, error: memError } = await supabase
    .from('organization_memberships')
    .select('*')
    .eq('user_id', demoUser.id)
    .eq('organization_id', WILSON_ORG_ID)
    .maybeSingle();

  if (!membership) {
    console.log('📝 Creating organization membership...');

    const { data: newMem, error: createMemError } = await supabase
      .from('organization_memberships')
      .insert({
        user_id: demoUser.id,
        organization_id: WILSON_ORG_ID,
        role: 'firm_admin'
      })
      .select()
      .single();

    if (createMemError) {
      console.error('❌ Error creating membership:', createMemError);
      process.exit(1);
    }

    console.log('✅ Membership created with role:', newMem.role);
  } else {
    console.log('✅ Membership already exists with role:', membership.role);
  }

  // Verify final setup
  console.log('\n🎉 Setup complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:        ', DEMO_EMAIL);
  console.log('🔑 Password:     ', DEMO_PASSWORD);
  console.log('👤 User ID:      ', demoUser.id);
  console.log('🏢 Organization: ', org.name);
  console.log('🆔 Org ID:       ', org.id);
  console.log('👔 Role:         ', membership?.role || 'firm_admin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nYou can now login at: http://localhost:5173/login');
}

main().catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});
