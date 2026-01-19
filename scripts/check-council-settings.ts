#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function checkCouncilSettings() {
  console.log('Checking council settings data...\n');

  // First get all organizations of type council
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('type', 'council')
    .order('name');

  if (orgError) {
    console.error('Error fetching organizations:', orgError);
    return;
  }

  console.log(`Found ${orgs.length} council organizations\n`);

  // Check each organization for council_settings
  for (const org of orgs) {
    console.log(`Organization: ${org.name} (${org.slug})`);
    console.log(`  ID: ${org.id}`);

    const { data: settings, error: settingsError } = await supabase
      .from('council_settings')
      .select('*')
      .eq('organization_id', org.id)
      .single();

    if (settingsError) {
      console.log('  Settings: ❌ NOT FOUND');
      console.log(`  Error: ${settingsError.message}`);
    } else if (settings) {
      console.log('  Settings: ✓ FOUND');
      console.log(`    - Authority Address: ${settings.authority_address || '❌ MISSING'}`);
      console.log(`    - Authority Email: ${settings.authority_email || '❌ MISSING'}`);
      console.log(`    - Online Register URL: ${settings.online_register_url || '❌ MISSING'}`);
    }
    console.log('');
  }

  // Specifically check Sampletonborough
  console.log('\n--- SAMPLETONBOROUGH SPECIFIC CHECK ---\n');
  const { data: sampleOrg, error: sampleError } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .or('name.ilike.%sampletonborough%,slug.eq.sampletonborough')
    .single();

  if (sampleError) {
    console.log('❌ Sampletonborough organization not found!');
    console.log('Error:', sampleError);
  } else {
    console.log(`Found: ${sampleOrg.name} (${sampleOrg.slug})`);
    console.log(`ID: ${sampleOrg.id}`);

    const { data: settings, error: settingsError } = await supabase
      .from('council_settings')
      .select('*')
      .eq('organization_id', sampleOrg.id)
      .single();

    if (settings) {
      console.log('\nCouncil Settings:');
      console.log(JSON.stringify(settings, null, 2));
    } else {
      console.log('\n❌ No council settings found for Sampletonborough!');
      console.log('Creating default settings...');

      // Create default settings for Sampletonborough
      const { data: newSettings, error: createError } = await supabase
        .from('council_settings')
        .insert({
          organization_id: sampleOrg.id,
          authority_address: 'Town Hall, High Street, Sampletonborough, ST1 1AA',
          authority_email: 'licensing@sampletonborough.gov.uk',
          online_register_url: 'https://www.sampletonborough.gov.uk/licensing/register'
        })
        .select()
        .single();

      if (createError) {
        console.log('Failed to create settings:', createError);
      } else {
        console.log('✓ Created default settings:', newSettings);
      }
    }
  }
}

checkCouncilSettings().catch(console.error);