#!/usr/bin/env tsx
/**
 * Create admin account with the documented credentials
 * Email: admin@civicnotices.co.uk
 * Password: ChangeMeImmediately123!
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdmin() {
  console.log('🔧 Setting up admin account...\n');

  const email = 'admin@civicnotices.co.uk';
  const password = 'ChangeMeImmediately123!';

  try {
    // First, try to list users to find if admin exists
    console.log('📋 Checking for existing admin user...');

    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log('✅ Found existing user, updating password and metadata...');

      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: password,
        email_confirm: true,
        app_metadata: {
          is_platform_admin: true,
          admin_role: 'super_admin',
          role: 'admin'
        },
        user_metadata: {
          full_name: 'Platform Administrator'
        }
      });

      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        return;
      }
      console.log('✅ User updated successfully');
    } else {
      console.log('📋 Creating new admin user...');

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        app_metadata: {
          is_platform_admin: true,
          admin_role: 'super_admin',
          role: 'admin'
        },
        user_metadata: {
          full_name: 'Platform Administrator'
        }
      });

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return;
      }
      console.log('✅ User created with ID:', newUser?.user?.id);
    }

    // Test login
    console.log('\n📋 Testing login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Login test failed:', authError.message);
      return;
    }

    console.log('✅ Login successful!');
    console.log('\n📊 User metadata:');
    console.log('  - is_platform_admin:', authData.user?.app_metadata?.is_platform_admin);
    console.log('  - admin_role:', authData.user?.app_metadata?.admin_role);
    console.log('  - role:', authData.user?.app_metadata?.role);

    console.log('\n✨ Admin account ready!');
    console.log('\n🔑 Login credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log('\n📌 URL: http://localhost:5173/admin/login');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupAdmin().catch(console.error);
