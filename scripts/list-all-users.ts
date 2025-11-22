#!/usr/bin/env tsx

/**
 * List all users via SQL query (bypassing Auth API)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('📋 Checking organization memberships...\n');

  // Get all memberships with organization details
  const { data: memberships, error } = await supabase
    .from('organization_memberships')
    .select(`
      user_id,
      role,
      organization:organizations(name, slug, type)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${memberships?.length || 0} recent memberships:\n`);

  for (const m of memberships || []) {
    const org = m.organization as any;
    console.log(`👤 User: ${m.user_id}`);
    console.log(`🏢 Org: ${org?.name} (${org?.slug}) [${org?.type}]`);
    console.log(`👔 Role: ${m.role}`);
    console.log('---');
  }

  // Check if westminster demo exists
  console.log('\n🔍 Checking Westminster demo...');
  const { data: westminster } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'westminster')
    .single();

  if (westminster) {
    const { data: westMembers } = await supabase
      .from('organization_memberships')
      .select('user_id, role')
      .eq('organization_id', westminster.id);

    console.log(`Westminster users: ${westMembers?.length || 0}`);
    westMembers?.forEach(m => {
      console.log(`  - ${m.user_id} (${m.role})`);
    });
  }

  // Check Wilson & Partners
  console.log('\n🔍 Checking Wilson & Partners...');
  const { data: wilson } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', '00000000-0000-0000-0000-000000000101')
    .single();

  if (wilson) {
    const { data: wilsonMembers } = await supabase
      .from('organization_memberships')
      .select('user_id, role')
      .eq('organization_id', wilson.id);

    console.log(`Wilson & Partners users: ${wilsonMembers?.length || 0}`);
    wilsonMembers?.forEach(m => {
      console.log(`  - ${m.user_id} (${m.role})`);
    });
  }

  console.log('\n💡 Note: Cannot retrieve emails due to Auth API restrictions.');
  console.log('   Please check Supabase Dashboard > Authentication > Users manually.');
}

main().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});
