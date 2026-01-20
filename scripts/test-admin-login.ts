#!/usr/bin/env tsx
/**
 * Test admin login flow
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

// Create Supabase client with anon key (like the frontend does)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

async function testLogin() {
  console.log('🔐 Testing admin login flow...\n');

  // Test different passwords to find which one works
  const passwords = ['admin123', 'Admin123!', 'admin', 'password', 'civic123'];

  for (const password of passwords) {
    console.log(`Trying password: ${password}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@civic',
      password: password
    });

    if (!error && data.user) {
      console.log(`\n✅ SUCCESS! Login worked with password: ${password}`);
      console.log('\n📊 User details:');
      console.log('  ID:', data.user.id);
      console.log('  Email:', data.user.email);
      console.log('\n📋 App metadata:');
      console.log('  is_platform_admin:', data.user.app_metadata?.is_platform_admin);
      console.log('  admin_role:', data.user.app_metadata?.admin_role);
      console.log('  role:', data.user.app_metadata?.role);

      // Sign out
      await supabase.auth.signOut();

      console.log('\n🎯 Use these credentials to login:');
      console.log('  Email: admin@civic');
      console.log(`  Password: ${password}`);
      return;
    } else {
      console.log(`  ❌ Failed: ${error?.message || 'Unknown error'}`);
    }
  }

  console.log('\n❌ None of the common passwords worked.');
  console.log('\n💡 Next steps:');
  console.log('1. Go to Supabase dashboard > Authentication > Users');
  console.log('2. Find the admin@civic user');
  console.log('3. Click "Send reset password email" or update password directly');
  console.log('4. Set password to: admin123');
}

testLogin().catch(console.error);