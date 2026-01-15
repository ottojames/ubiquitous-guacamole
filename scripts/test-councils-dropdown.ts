#!/usr/bin/env npx tsx
/**
 * Test script to verify councils dropdown loads correctly
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

async function testCouncilsDropdown() {
  console.log('🔍 Testing councils dropdown data...\n');

  try {
    // 1. Test the query that the CouncilDepartmentSelect component uses
    const { data: departments, error } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        type,
        email,
        organization:organizations!inner (
          id,
          name
        )
      `)
      .eq('type', 'licensing')  // Test with licensing filter
      .order('organization(name)');

    if (error) {
      console.error('❌ Database query error:', error);
      process.exit(1);
    }

    if (!departments || departments.length === 0) {
      console.error('❌ No licensing departments found in database!');
      console.log('\nTrying to query all departments without filter...');

      const { data: allDepts, error: allError } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          type,
          email,
          organization:organizations!inner (
            id,
            name
          )
        `);

      if (allError) {
        console.error('❌ Error querying all departments:', allError);
      } else if (!allDepts || allDepts.length === 0) {
        console.error('❌ No departments at all in database!');
      } else {
        console.log('✅ Found departments:', allDepts.length);
        allDepts.forEach(dept => {
          console.log(`  - ${dept.organization.name} - ${dept.name} (${dept.type})`);
        });
      }

      process.exit(1);
    }

    console.log('✅ Found', departments.length, 'licensing departments:\n');

    // 2. Display the departments
    departments.forEach((dept: any) => {
      console.log(`📍 ${dept.organization.name} - ${dept.name}`);
      console.log(`   ID: ${dept.id}`);
      console.log(`   Type: ${dept.type}`);
      console.log(`   Email: ${dept.email || 'N/A'}`);
      console.log('');
    });

    // 3. Test what the wizard would see
    console.log('🧪 Simulating dropdown display:\n');
    console.log('Licensing Authority Name *');
    console.log('─────────────────────────────');
    departments.forEach((dept: any) => {
      const displayName = `${dept.organization.name} - ${dept.name}`;
      console.log(`• ${displayName}`);
    });
    console.log('');

    // 4. Check other department types
    console.log('📊 Checking all department types:\n');
    const { data: summary } = await supabase
      .from('departments')
      .select('type');

    const types = [...new Set(summary?.map((d: any) => d.type) || [])];
    for (const type of types) {
      const { count } = await supabase
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('type', type);
      console.log(`  ${type}: ${count} departments`);
    }

    console.log('\n✅ Councils dropdown should be working correctly!');
    console.log('\n📝 To test in browser:');
    console.log('1. Navigate to http://localhost:5173/publish/step-1');
    console.log('2. Select "New Premises Licence"');
    console.log('3. Choose "Enter details manually" on step 2');
    console.log('4. On step 3, the "Licensing Authority Name" dropdown should show:');
    console.log('   - Sampletonborough Council - Licensing Department');
    console.log('   - Westminster City Council - Licensing Department');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCouncilsDropdown();