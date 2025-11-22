#!/usr/bin/env tsx

/**
 * Check Wilson & Partners Setup
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WILSON_ORG_ID = '00000000-0000-0000-0000-000000000101';
const DEMO_EMAIL = 'demo@wilsonpartners.com';

async function main() {
  console.log('🔍 Checking Wilson & Partners setup...\n');

  // Check if organization exists
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', WILSON_ORG_ID)
    .single();

  if (orgError) {
    console.log('❌ Wilson & Partners NOT found with ID:', WILSON_ORG_ID);
    console.log('   Error:', orgError.message);

    // Check if it exists with a different ID
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, slug, type')
      .ilike('name', '%wilson%')
      .limit(5);

    if (orgs && orgs.length > 0) {
      console.log('\n📋 Found organizations matching "wilson":');
      orgs.forEach(o => {
        console.log(`   - ${o.name} (${o.slug}) - ${o.id} [${o.type}]`);
      });
    } else {
      console.log('\n📋 No organizations found matching "wilson"');
      console.log('\n💡 You need to create Wilson & Partners organization:');
      console.log('   1. Go to Supabase Dashboard');
      console.log('   2. SQL Editor');
      console.log('   3. Run:');
      console.log(`      INSERT INTO organizations (id, name, slug, type, contact_email)`);
      console.log(`      VALUES ('${WILSON_ORG_ID}', 'Wilson & Partners LLP', 'wilson-partners', 'firm', 'info@wilsonpartners.com');`);
    }

    return;
  }

  console.log('✅ Organization exists:');
  console.log('   Name:', org.name);
  console.log('   Slug:', org.slug);
  console.log('   Type:', org.type);
  console.log('   ID:', org.id);

  // Check if any users are members
  const { data: memberships } = await supabase
    .from('organization_memberships')
    .select('user_id, role')
    .eq('organization_id', WILSON_ORG_ID);

  console.log('\n👥 Organization members:', memberships?.length || 0);

  if (memberships && memberships.length > 0) {
    memberships.forEach((m, i) => {
      console.log(`   ${i + 1}. User ${m.user_id} (${m.role})`);
    });
  } else {
    console.log('   No members found');
    console.log('\n💡 You need to create a demo user:');
    console.log('   1. Go to Supabase Dashboard > Authentication > Users');
    console.log('   2. Create new user:');
    console.log(`      Email: ${DEMO_EMAIL}`);
    console.log(`      Password: WilsonDemo123!`);
    console.log(`      Confirm Email: Yes`);
    console.log('   3. Copy the user ID');
    console.log('   4. Go to SQL Editor and run:');
    console.log(`      INSERT INTO organization_memberships (user_id, organization_id, role)`);
    console.log(`      VALUES ('<USER_ID>', '${WILSON_ORG_ID}', 'firm_admin');`);
  }
}

main().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});
