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

async function testCouncilSettings() {
  console.log('\n=== Testing Council Settings ===\n');

  // First, check if council_settings table has any data
  const { data: settings, error: settingsError } = await supabase
    .from('council_settings')
    .select('*')
    .limit(5);

  if (settingsError) {
    console.error('❌ Error fetching council_settings:', settingsError);
    return;
  }

  if (!settings || settings.length === 0) {
    console.log('⚠️  No council settings found in database');
    console.log('\n📝 Creating test council settings...\n');

    // Get some departments to create settings for
    const { data: departments, error: deptsError } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        type,
        contact_email,
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

    console.log(`Found ${departments.length} licensing departments\n`);

    for (const dept of departments) {
      const orgName = (dept.organizations as any).name;

      // Check if settings already exist
      const { data: existing } = await supabase
        .from('council_settings')
        .select('id')
        .eq('department_id', dept.id)
        .single();

      if (existing) {
        console.log(`✓ Settings already exist for ${orgName} - ${dept.name}`);
        continue;
      }

      const newSettings = {
        department_id: dept.id,
        authority_address: `Town Hall, ${orgName}, Main Street, AB1 2CD`,
        authority_email: dept.contact_email || `licensing@${orgName.toLowerCase().replace(/\s+/g, '')}.gov.uk`,
        authority_phone: '01234 567890',
        online_register_url: `https://licensing.${orgName.toLowerCase().replace(/\s+/g, '')}.gov.uk`,
        authority_name: `${orgName} - ${dept.name}`
      };

      const { data: created, error: createError } = await supabase
        .from('council_settings')
        .insert(newSettings)
        .select()
        .single();

      if (createError) {
        console.error(`❌ Failed to create settings for ${orgName}:`, createError);
      } else {
        console.log(`✅ Created settings for ${orgName} - ${dept.name}`);
        console.log('   Address:', newSettings.authority_address);
        console.log('   Email:', newSettings.authority_email);
        console.log('   URL:', newSettings.online_register_url);
      }
    }
  } else {
    console.log(`✅ Found ${settings.length} council settings in database:\n`);

    for (const setting of settings) {
      // Get department info
      const { data: dept } = await supabase
        .from('departments')
        .select(`
          name,
          organizations!inner (
            name
          )
        `)
        .eq('id', setting.department_id)
        .single();

      const orgName = dept ? (dept.organizations as any).name : 'Unknown';
      const deptName = dept?.name || 'Unknown';

      console.log(`📍 ${orgName} - ${deptName}`);
      console.log(`   Address: ${setting.authority_address}`);
      console.log(`   Email: ${setting.authority_email}`);
      console.log(`   URL: ${setting.online_register_url}`);
      console.log('');
    }
  }

  console.log('\n=== Testing Complete ===\n');
}

testCouncilSettings().catch(console.error);