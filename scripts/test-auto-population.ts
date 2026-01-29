import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function testAutoPopulation() {
  console.log('\n=== Testing Council Settings Auto-Population ===\n');

  // Get a sample department
  const { data: departments, error: deptsError } = await supabase
    .from('departments')
    .select(`
      id,
      name,
      type,
      organization_id,
      organizations!inner (
        id,
        name
      )
    `)
    .eq('type', 'licensing')
    .limit(3);

  if (deptsError || !departments || departments.length === 0) {
    console.error('❌ No departments found:', deptsError);
    return;
  }

  console.log(`Testing with ${departments.length} departments:\n`);

  for (const dept of departments) {
    const orgName = (dept.organizations as any).name;
    const orgId = dept.organization_id;

    console.log(`\n📍 Testing: ${orgName} - ${dept.name}`);
    console.log(`   Department ID: ${dept.id}`);
    console.log(`   Organization ID: ${orgId}`);

    // Try to fetch council settings using organization_id (correct way)
    const { data: councilSettings, error } = await supabase
      .from('council_settings')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (error) {
      console.error(`   ❌ Error fetching settings:`, error.message);
      continue;
    }

    if (councilSettings) {
      console.log(`   ✅ Council settings found!`);
      console.log(`      Authority Address: ${councilSettings.authority_address}`);
      console.log(`      Authority Email: ${councilSettings.authority_email}`);
      console.log(`      Authority Phone: ${councilSettings.authority_phone || 'Not set'}`);
      console.log(`      Online Register URL: ${councilSettings.online_register_url}`);

      // These fields would be auto-populated in the form
      console.log(`\n   📝 Fields that will auto-populate:`);
      console.log(`      AUTHORITY_ADDRESS → "${councilSettings.authority_address}"`);
      console.log(`      AUTHORITY_EMAIL → "${councilSettings.authority_email}"`);
      console.log(`      ONLINE_REGISTER_URL → "${councilSettings.online_register_url}"`);
    } else {
      console.log(`   ⚠️  No council settings found for this organization`);
    }
  }

  console.log('\n\n=== Test Complete ===');
  console.log('\nWhen a user selects a council in the publish wizard:');
  console.log('1. The CouncilDepartmentSelect component returns the department with organizationId');
  console.log('2. TemplateBuilderForm fetches council_settings using that organizationId');
  console.log('3. The authority fields are auto-populated from the settings\n');
}

testAutoPopulation().catch(console.error);