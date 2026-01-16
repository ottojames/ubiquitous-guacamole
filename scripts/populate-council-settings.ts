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

async function populateCouncilSettings() {
  console.log('\n=== Populating Council Settings for Auto-Population ===\n');

  // Get all organizations that are councils
  const { data: organizations, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .eq('type', 'council')
    .order('name');

  if (orgsError || !organizations) {
    console.error('❌ Error fetching organizations:', orgsError);
    return;
  }

  console.log(`Found ${organizations.length} council organizations\n`);

  let created = 0;
  let updated = 0;
  let existing = 0;

  for (const org of organizations) {
    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from('council_settings')
      .select('id')
      .eq('organization_id', org.id)
      .single();

    // Create appropriate settings based on organization name
    let authority_address = '';
    let authority_email = '';
    let online_register_url = '';

    // Set values based on organization name
    if (org.name.includes('Westminster')) {
      authority_address = 'Westminster City Hall, 64 Victoria Street, London SW1E 6QP';
      authority_email = 'info@westminster.gov.uk';
      online_register_url = 'https://www.westminster.gov.uk/licensing/register';
    } else if (org.name.includes('Sampletonborough')) {
      authority_address = '1 Town Hall Square, Sampletonborough SB1 1AA';
      authority_email = 'info@sampletonborough.gov.uk';
      online_register_url = 'https://www.sampletonborough.gov.uk/licensing/register';
    } else if (org.name.includes('Manchester')) {
      authority_address = 'Town Hall, Albert Square, Manchester M60 2LA';
      authority_email = 'info@manchester.gov.uk';
      online_register_url = 'https://www.manchester.gov.uk/licensing/register';
    } else if (org.name.includes('Birmingham')) {
      authority_address = 'Council House, Victoria Square, Birmingham B1 1BB';
      authority_email = 'info@birmingham.gov.uk';
      online_register_url = 'https://www.birmingham.gov.uk/licensing/register';
    } else if (org.name.includes('Leeds')) {
      authority_address = 'Civic Hall, Calverley Street, Leeds LS1 1UR';
      authority_email = 'info@leeds.gov.uk';
      online_register_url = 'https://www.leeds.gov.uk/licensing/register';
    } else if (org.name.includes('Liverpool')) {
      authority_address = 'Cunard Building, Water Street, Liverpool L3 1AH';
      authority_email = 'info@liverpool.gov.uk';
      online_register_url = 'https://www.liverpool.gov.uk/licensing/register';
    } else if (org.name.includes('Bristol')) {
      authority_address = 'City Hall, College Green, Bristol BS1 5TR';
      authority_email = 'info@bristol.gov.uk';
      online_register_url = 'https://www.bristol.gov.uk/licensing/register';
    } else if (org.name.includes('Sheffield')) {
      authority_address = 'Town Hall, Pinstone Street, Sheffield S1 2HH';
      authority_email = 'info@sheffield.gov.uk';
      online_register_url = 'https://www.sheffield.gov.uk/licensing/register';
    } else if (org.name.includes('Edinburgh')) {
      authority_address = 'City Chambers, High Street, Edinburgh EH1 1YJ';
      authority_email = 'info@edinburgh.gov.uk';
      online_register_url = 'https://www.edinburgh.gov.uk/licensing/register';
    } else if (org.name.includes('Cardiff')) {
      authority_address = 'County Hall, Atlantic Wharf, Cardiff CF10 4UW';
      authority_email = 'info@cardiff.gov.uk';
      online_register_url = 'https://www.cardiff.gov.uk/licensing/register';
    } else if (org.name.includes('North Yorkshire')) {
      authority_address = 'County Hall, Northallerton DL7 8AD';
      authority_email = 'info@northyorks.gov.uk';
      online_register_url = 'https://www.northyorks.gov.uk/licensing/register';
    } else {
      // Generic fallback
      const cleanOrgName = org.name.toLowerCase().replace(/\s*(city|council|borough|district)\s*/g, '').trim();
      authority_address = `Town Hall, ${org.name}, Main Street, AB1 2CD`;
      authority_email = `info@${cleanOrgName}.gov.uk`;
      online_register_url = `https://www.${cleanOrgName}.gov.uk/licensing/register`;
    }

    const councilSettings = {
      organization_id: org.id,
      authority_address,
      authority_email,
      authority_phone: '01234 567890', // Generic phone number
      online_register_url,
      licensing_email: `licensing@${org.name.toLowerCase().replace(/\s*(city|council|borough|district)\s*/g, '').trim()}.gov.uk`,
      planning_email: `planning@${org.name.toLowerCase().replace(/\s*(city|council|borough|district)\s*/g, '').trim()}.gov.uk`,
      environmental_email: `environmental@${org.name.toLowerCase().replace(/\s*(city|council|borough|district)\s*/g, '').trim()}.gov.uk`,
      highways_email: `highways@${org.name.toLowerCase().replace(/\s*(city|council|borough|district)\s*/g, '').trim()}.gov.uk`,
    };

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('council_settings')
        .update(councilSettings)
        .eq('organization_id', org.id);

      if (updateError) {
        console.error(`❌ Failed to update settings for ${org.name}:`, updateError.message);
      } else {
        updated++;
        console.log(`✅ Updated settings for ${org.name}`);
        console.log(`   Address: ${authority_address}`);
        console.log(`   Email: ${authority_email}`);
        console.log(`   URL: ${online_register_url}\n`);
      }
    } else {
      // Create new settings
      const { error: createError } = await supabase
        .from('council_settings')
        .insert(councilSettings);

      if (createError) {
        console.error(`❌ Failed to create settings for ${org.name}:`, createError.message);
      } else {
        created++;
        console.log(`✅ Created settings for ${org.name}`);
        console.log(`   Address: ${authority_address}`);
        console.log(`   Email: ${authority_email}`);
        console.log(`   URL: ${online_register_url}\n`);
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`✅ Created: ${created} new council settings`);
  console.log(`✅ Updated: ${updated} existing council settings`);
  console.log(`Total organizations: ${organizations.length}\n`);
}

populateCouncilSettings().catch(console.error);