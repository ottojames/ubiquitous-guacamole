#!/usr/bin/env tsx
/**
 * Verify admin login works end-to-end
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

async function verifyLogin() {
  console.log('🔐 Verifying admin login flow...\n');

  // Login with demo admin
  console.log('📋 Attempting login with demo.admin@civicnotices.co.uk...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'demo.admin@civicnotices.co.uk',
    password: 'DemoAdmin2024!'
  });

  if (error) {
    console.error('❌ Login failed:', error.message);
    return;
  }

  if (!data.user) {
    console.error('❌ No user data returned');
    return;
  }

  console.log('✅ Login successful!\n');

  // Check user details
  console.log('📊 User details:');
  console.log('  ID:', data.user.id);
  console.log('  Email:', data.user.email);
  console.log('  Created:', new Date(data.user.created_at).toLocaleString());

  // Check app metadata (this is what determines admin access)
  console.log('\n📋 App metadata (determines admin access):');
  const metadata = data.user.app_metadata;
  console.log('  is_platform_admin:', metadata?.is_platform_admin === true ? '✅ Yes' : '❌ No');
  console.log('  admin_role:', metadata?.admin_role || 'none');
  console.log('  role:', metadata?.role || 'none');

  // Check if this would pass canAccessAdmin() check
  const canAccessAdmin =
    metadata?.is_platform_admin === true ||
    metadata?.admin_role === 'super_admin' ||
    metadata?.admin_role === 'admin' ||
    metadata?.role === 'admin' ||
    metadata?.role === 'super_admin' ||
    data.user.email === 'admin@civic';

  console.log('\n🔒 Admin panel access:', canAccessAdmin ? '✅ GRANTED' : '❌ DENIED');

  if (!canAccessAdmin) {
    console.log('\n⚠️ This user will not be able to access the admin panel!');
    console.log('The following conditions must be met:');
    console.log('  - is_platform_admin: true (currently:', metadata?.is_platform_admin, ')');
    console.log('  - OR admin_role: super_admin/admin (currently:', metadata?.admin_role, ')');
    console.log('  - OR role: admin/super_admin (currently:', metadata?.role, ')');
  }

  // Sign out
  await supabase.auth.signOut();

  console.log('\n✨ Verification complete!');

  if (canAccessAdmin) {
    console.log('\n🎯 Ready to login at: http://localhost:5173/admin/login');
    console.log('  Email: demo.admin@civicnotices.co.uk');
    console.log('  Password: DemoAdmin2024!');
  }
}

verifyLogin().catch(console.error);