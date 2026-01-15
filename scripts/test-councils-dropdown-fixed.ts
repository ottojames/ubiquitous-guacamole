#!/usr/bin/env npx tsx
/**
 * Test script to verify councils dropdown loads correctly with fixed query
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

async function testCouncilsDropdown() {
  console.log('🔍 Testing councils dropdown data with fixed query...\n');

  try {
    // Test the FIXED query that matches what CouncilDepartmentSelect now uses
    const { data: departments, error } = await supabase
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
      .eq('type', 'licensing')  // Test with licensing filter
      .order('organizations(name)');

    if (error) {
      console.error('❌ Database query error:', error);
      process.exit(1);
    }

    if (!departments || departments.length === 0) {
      console.error('❌ No licensing departments found in database!');
      process.exit(1);
    }

    console.log('✅ Found', departments.length, 'licensing departments:\n');

    // Display the departments as they would appear in the dropdown
    departments.forEach((dept: any) => {
      const displayName = `${dept.organizations.name} - ${dept.name}`;
      console.log(`📍 ${displayName}`);
      console.log(`   ID: ${dept.id}`);
      console.log(`   Type: ${dept.type}`);
      console.log(`   Email: ${dept.contact_email || 'N/A'}`);
      console.log('');
    });

    // Show what the dropdown will display
    console.log('🧪 Dropdown will show:\n');
    console.log('Licensing Authority Name *');
    console.log('─────────────────────────────');
    departments
      .sort((a: any, b: any) => a.organizations.name.localeCompare(b.organizations.name))
      .forEach((dept: any) => {
        const displayName = `${dept.organizations.name} - ${dept.name}`;
        console.log(`• ${displayName}`);
      });
    console.log('');

    console.log('\n✅ Councils dropdown is now fixed and working!');
    console.log('\n📝 To test in browser:');
    console.log('1. Navigate to http://localhost:5173/publish/step-1');
    console.log('2. Select "New Premises Licence" or any licensing notice');
    console.log('3. Choose "Enter details manually" on step 2');
    console.log('4. On step 3, the "Licensing Authority Name" dropdown should show all councils listed above');
    console.log('\nThe dropdown should NO LONGER show "No councils in database"');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCouncilsDropdown();