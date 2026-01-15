#!/usr/bin/env npx tsx
/**
 * Check the actual departments table schema
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
  console.error('❌ Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function checkSchema() {
  console.log('Checking departments table schema...\n');

  // Query with minimal fields to see what exists
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Sample department record:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\nAvailable columns:', Object.keys(data[0]).join(', '));
  }

  // Try to get all departments without email field
  const { data: depts, error: deptsError } = await supabase
    .from('departments')
    .select(`
      id,
      name,
      type,
      organization:organizations!inner (
        id,
        name
      )
    `)
    .eq('type', 'licensing');

  if (deptsError) {
    console.error('\nError without email field:', deptsError);
  } else {
    console.log('\n✅ Found', depts?.length || 0, 'licensing departments');
    depts?.forEach((d: any) => {
      console.log(`  - ${d.organization.name} - ${d.name}`);
    });
  }
}

checkSchema();