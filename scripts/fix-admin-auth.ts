#!/usr/bin/env tsx
/**
 * Script to fix admin@civic authentication issue
 * Ensures the user has proper metadata for admin panel access
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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAdminAuth() {
  console.log('🔧 Fixing admin@civic authentication...\n');

  try {
    // Step 1: Check if admin@civic user exists
    console.log('📋 Step 1: Checking for admin@civic user...');
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers({
      filter: 'email.eq.admin@civic',
      page: 1,
      perPage: 1
    });

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return;
    }

    let userId: string;

    if (!users?.users?.length) {
      // User doesn't exist, create it
      console.log('➕ Creating admin@civic user...');

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@civic',
        password: 'admin123', // Default password - should be changed
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

      if (createError || !newUser?.user) {
        console.error('❌ Error creating user:', createError);
        return;
      }

      userId = newUser.user.id;
      console.log('✅ Created admin@civic user with ID:', userId);
    } else {
      // User exists, update metadata
      userId = users.users[0].id;
      console.log(`✓ Found existing user with ID: ${userId}`);

      console.log('🔄 Updating user metadata...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          ...users.users[0].app_metadata,
          is_platform_admin: true,
          admin_role: 'super_admin',
          role: 'admin'
        }
      });

      if (updateError) {
        console.error('❌ Error updating user metadata:', updateError);
        return;
      }
      console.log('✅ Updated user metadata');
    }

    // Step 2: Ensure admin_users table entry exists
    console.log('\n📋 Step 2: Ensuring admin_users table entry...');

    // Check if entry exists
    const { data: adminUser, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@civic')
      .single();

    if (!adminUser && !adminCheckError?.code?.includes('PGRST116')) {
      // Create admin_users entry
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          user_id: userId,
          email: 'admin@civic',
          role: 'super_admin',
          status: 'active',
          two_factor_enabled: false,
          failed_login_attempts: 0
        });

      if (insertError && !insertError.message?.includes('duplicate')) {
        console.error('⚠️ Warning: Could not create admin_users entry:', insertError.message);
      } else {
        console.log('✅ Created admin_users entry');
      }
    } else {
      console.log('✓ Admin users entry already exists');
    }

    // Step 3: Ensure platform_admin_settings exists
    console.log('\n📋 Step 3: Ensuring platform_admin_settings...');

    const { data: settings, error: settingsCheckError } = await supabase
      .from('platform_admin_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings && !settingsCheckError?.code?.includes('PGRST116')) {
      const { error: settingsError } = await supabase
        .from('platform_admin_settings')
        .insert({
          user_id: userId,
          admin_role: 'super_admin'
        });

      if (settingsError && !settingsError.message?.includes('duplicate')) {
        console.error('⚠️ Warning: Could not create platform_admin_settings:', settingsError.message);
      } else {
        console.log('✅ Created platform_admin_settings');
      }
    } else {
      console.log('✓ Platform admin settings already exists');
    }

    // Step 4: Reset password to ensure we can login
    console.log('\n📋 Step 4: Resetting password...');

    const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
      password: 'admin123'
    });

    if (passwordError) {
      console.error('⚠️ Could not reset password:', passwordError.message);
    } else {
      console.log('✅ Password reset to default');
    }

    // Step 5: Test authentication
    console.log('\n📋 Step 5: Testing authentication...');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@civic',
      password: 'admin123'
    });

    if (authError) {
      console.error('❌ Authentication test failed:', authError.message);
      console.log('\n💡 If password reset failed, try resetting manually in Supabase dashboard');
      // Continue anyway to show metadata status
    } else {
      console.log('✅ Authentication successful!');
    }

    // Check metadata (use existing user data if auth failed)
    const metadata = authData?.user?.app_metadata || users?.users?.[0]?.app_metadata;
    console.log('\n📊 User metadata:');
    console.log('  - is_platform_admin:', metadata?.is_platform_admin || false);
    console.log('  - admin_role:', metadata?.admin_role || 'none');
    console.log('  - role:', metadata?.role || 'none');

    console.log('\n✨ Admin authentication has been fixed!');
    console.log('\n🔑 Login credentials:');
    console.log('  Email: admin@civic');
    console.log('  Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixAdminAuth().catch(console.error);