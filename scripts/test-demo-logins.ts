#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(email: string, password: string, portal: string) {
  console.log(`\n🔐 Testing ${portal} login...`);
  console.log(`   Email: ${email}`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.log(`   ❌ Login failed: ${error.message}`);
    return false;
  }

  if (data?.user) {
    console.log(`   ✅ Login successful!`);
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Full Name: ${data.user.user_metadata?.full_name || 'Not set'}`);

    // Sign out for next test
    await supabase.auth.signOut();
    return true;
  }

  return false;
}

async function runTests() {
  console.log('🧪 Testing Demo Authentication\n');
  console.log('='.repeat(40));

  let councilWorks = await testLogin(
    'licensing@westminster.gov.uk',
    'testpass123',
    'Council Portal (Westminster)'
  );

  let firmWorks = await testLogin(
    'solicitor@wilsonpartners.com',
    'testpass123',
    'Professional Portal (Wilson Partners)'
  );

  console.log('\n' + '='.repeat(40));
  console.log('\n📊 Results Summary:');
  console.log('   Council Portal: ' + (councilWorks ? '✅ WORKING' : '❌ FAILED'));
  console.log('   Professional Portal: ' + (firmWorks ? '✅ WORKING' : '❌ FAILED'));

  if (councilWorks && firmWorks) {
    console.log('\n🎉 All demo accounts are working!');
  } else {
    console.log('\n⚠️ Some accounts are not working. Please check the SQL migration.');
  }
}

// Run the tests
runTests().catch(console.error);