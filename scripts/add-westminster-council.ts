#!/usr/bin/env npx tsx
/**
 * Script to create Westminster Council with licensing department
 * For testing FIX-006: Fix Councils Dropdown Not Loading
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env file.');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function createWestminsterCouncil() {
  try {
    // 1. Check if Westminster already exists by name
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, name')
      .or('name.eq.Westminster Council,name.eq.Westminster City Council,name.eq.Westminster (City of) Council')
      .single();

    if (existingOrg) {
      console.log('✅ Westminster Council already exists:', existingOrg.name, '(ID:', existingOrg.id, ')');

      // Check if departments exist
      const { data: depts } = await supabase
        .from('departments')
        .select('id, name, type')
        .eq('org_id', existingOrg.id);

      if (depts && depts.length > 0) {
        console.log('✅ Departments found:', depts.map(d => `${d.name} (${d.type})`).join(', '));
      }

      return existingOrg.id;
    }

    console.log('Creating Westminster Council...');

    // 2. Create organization
    const orgId = '0e536037-48c3-4196-8fb6-c31803621050'; // Use the ID from progress.txt
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: orgId,
        name: 'Westminster City Council',
        type: 'council',
        domain: 'westminster.gov.uk',
        status: 'active',
        contact_email: 'info@westminster.gov.uk',
        contact_phone: '020 7641 6000',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      throw orgError;
    }

    console.log('✅ Created organization');

    // 3. Create council entry
    const { error: councilError } = await supabase
      .from('councils')
      .insert({
        id: orgId,
        name: 'Westminster City Council',
        slug: 'westminster-city-council',
        website: 'https://www.westminster.gov.uk',
        reps_email: 'licensing@westminster.gov.uk',
        created_at: new Date().toISOString()
      });

    if (councilError) {
      console.error('Error creating council:', councilError);
      throw councilError;
    }

    console.log('✅ Created council');

    // 4. Create licensing department
    const licensingDeptId = '2145bf45-da2d-421d-8d8e-8ad46bc6bbef'; // Use the ID from progress.txt
    const { error: deptError } = await supabase
      .from('departments')
      .insert({
        id: licensingDeptId,
        org_id: orgId,
        name: 'Licensing Department',
        slug: 'licensing',
        type: 'licensing',
        email: 'licensing@westminster.gov.uk',
        phone: '020 7641 6500',
        created_at: new Date().toISOString()
      });

    if (deptError) {
      console.error('Error creating licensing department:', deptError);
      throw deptError;
    }

    console.log('✅ Created Licensing Department');

    // 5. Create planning department
    const planningDeptId = '2145bf45-da2d-421d-8d8e-8ad46bc6bbf0';
    const { error: planningError } = await supabase
      .from('departments')
      .insert({
        id: planningDeptId,
        org_id: orgId,
        name: 'Planning Department',
        slug: 'planning',
        type: 'planning',
        email: 'planning@westminster.gov.uk',
        phone: '020 7641 2513',
        created_at: new Date().toISOString()
      });

    if (planningError) {
      console.error('Error creating planning department:', planningError);
      throw planningError;
    }

    console.log('✅ Created Planning Department');

    console.log('\n🎉 Westminster Council setup complete!');
    console.log('\nCouncils now available in dropdown:');
    console.log('- Westminster City Council - Licensing Department');
    console.log('- Westminster City Council - Planning Department');

    return orgId;

  } catch (error) {
    console.error('❌ Failed to create Westminster Council:', error);
    process.exit(1);
  }
}

// Run the script
createWestminsterCouncil();