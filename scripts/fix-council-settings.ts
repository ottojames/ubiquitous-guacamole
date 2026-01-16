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

async function fixCouncilSettings() {
  console.log('\n=== Fixing Council Settings for Auto-Population ===\n');

  // Get all departments that don't have settings yet
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
    .order('organizations(name)');

  if (deptsError || !departments) {
    console.error('❌ Error fetching departments:', deptsError);
    return;
  }

  console.log(`Found ${departments.length} departments total\n`);

  let created = 0;
  let existing = 0;

  for (const dept of departments) {
    const orgName = (dept.organizations as any).name;

    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from('council_settings')
      .select('id')
      .eq('department_id', dept.id)
      .single();

    if (existingSettings) {
      existing++;
      console.log(`✓ Settings already exist for ${orgName} - ${dept.name} (${dept.type})`);
      continue;
    }

    // Create appropriate settings based on organization and department type
    let authority_address = '';
    let authority_email = '';
    let online_register_url = '';

    // Set values based on organization name
    if (orgName.includes('Westminster')) {
      authority_address = 'Westminster City Hall, 64 Victoria Street, London SW1E 6QP';
      authority_email = dept.contact_email || `${dept.type}@westminster.gov.uk`;
      online_register_url = `https://www.westminster.gov.uk/${dept.type}/register`;
    } else if (orgName.includes('Sampletonborough')) {
      authority_address = '1 Town Hall Square, Sampletonborough SB1 1AA';
      authority_email = dept.contact_email || `${dept.type}@sampletonborough.gov.uk`;
      online_register_url = `https://www.sampletonborough.gov.uk/${dept.type}/register`;
    } else if (orgName.includes('Manchester')) {
      authority_address = 'Town Hall, Albert Square, Manchester M60 2LA';
      authority_email = dept.contact_email || `${dept.type}@manchester.gov.uk`;
      online_register_url = `https://www.manchester.gov.uk/${dept.type}/register`;
    } else if (orgName.includes('Birmingham')) {
      authority_address = 'Council House, Victoria Square, Birmingham B1 1BB';
      authority_email = dept.contact_email || `${dept.type}@birmingham.gov.uk`;
      online_register_url = `https://www.birmingham.gov.uk/${dept.type}/register`;
    } else if (orgName.includes('Leeds')) {
      authority_address = 'Civic Hall, Calverley Street, Leeds LS1 1UR';
      authority_email = dept.contact_email || `${dept.type}@leeds.gov.uk`;
      online_register_url = `https://www.leeds.gov.uk/${dept.type}/register`;
    } else if (orgName.includes('Liverpool')) {
      authority_address = 'Cunard Building, Water Street, Liverpool L3 1AH';
      authority_email = dept.contact_email || `${dept.type}@liverpool.gov.uk`;
      online_register_url = `https://www.liverpool.gov.uk/${dept.type}/register`;
    } else if (orgName.includes('Bristol')) {
      authority_address = 'City Hall, College Green, Bristol BS1 5TR';
      authority_email = dept.contact_email || `${dept.type}@bristol.gov.uk`;
      online_register_url = `https://www.bristol.gov.uk/${dept.type}/register`;
    } else if (orgName.includes('Sheffield')) {
      authority_address = 'Town Hall, Pinstone Street, Sheffield S1 2HH';
      authority_email = dept.contact_email || `${dept.type}@sheffield.gov.uk`;
      online_register_url = `https://www.sheffield.gov.uk/${dept.type}/register`;
    } else {
      // Generic fallback
      const cleanOrgName = orgName.toLowerCase().replace(/\s*(city|council|borough|district)\s*/g, '').trim();
      authority_address = `Town Hall, ${orgName}, Main Street, AB1 2CD`;
      authority_email = dept.contact_email || `${dept.type}@${cleanOrgName}.gov.uk`;
      online_register_url = `https://www.${cleanOrgName}.gov.uk/${dept.type}/register`;
    }

    const newSettings = {
      department_id: dept.id,
      authority_address,
      authority_email,
      authority_phone: '01234 567890', // Generic phone number
      online_register_url,
      authority_name: `${orgName} - ${dept.name}`
    };

    const { error: createError } = await supabase
      .from('council_settings')
      .insert(newSettings);

    if (createError) {
      console.error(`❌ Failed to create settings for ${orgName} - ${dept.name}:`, createError.message);
    } else {
      created++;
      console.log(`✅ Created settings for ${orgName} - ${dept.name} (${dept.type})`);
      console.log(`   Address: ${authority_address}`);
      console.log(`   Email: ${authority_email}`);
      console.log(`   URL: ${online_register_url}\n`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`✅ Created: ${created} new council settings`);
  console.log(`✓ Existing: ${existing} departments already had settings`);
  console.log(`Total departments: ${departments.length}\n`);
}

fixCouncilSettings().catch(console.error);