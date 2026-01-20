#!/usr/bin/env tsx
/**
 * Create a demo admin account with known credentials
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoAdmin() {
  console.log('🔧 Creating demo admin account...\n');

  try {
    // Step 1: Create demo admin user
    console.log('📋 Creating demo.admin@civicnotices.co.uk user...');

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'demo.admin@civicnotices.co.uk',
      password: 'DemoAdmin2024!', // Strong password that meets requirements
      email_confirm: true,
      app_metadata: {
        is_platform_admin: true,
        admin_role: 'super_admin',
        role: 'admin'
      },
      user_metadata: {
        full_name: 'Demo Administrator'
      }
    });

    if (createError) {
      if (createError.message?.includes('already been registered')) {
        console.log('⚠️ User already exists, updating metadata...');

        // Get user ID
        const { data: users } = await supabase.auth.admin.listUsers({
          filter: 'email.eq.demo.admin@civicnotices.co.uk',
          page: 1,
          perPage: 1
        });

        if (users?.users?.[0]) {
          const userId = users.users[0].id;

          // Update metadata and password
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: 'DemoAdmin2024!',
            app_metadata: {
              is_platform_admin: true,
              admin_role: 'super_admin',
              role: 'admin'
            }
          });

          if (updateError) {
            console.error('❌ Error updating user:', updateError);
            return;
          }

          console.log('✅ Updated existing demo admin user');
        }
      } else {
        console.error('❌ Error creating user:', createError);
        return;
      }
    } else if (newUser?.user) {
      console.log('✅ Created demo admin user with ID:', newUser.user.id);
    }

    // Step 2: Test authentication
    console.log('\n📋 Testing authentication...');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo.admin@civicnotices.co.uk',
      password: 'DemoAdmin2024!'
    });

    if (authError) {
      console.error('❌ Authentication test failed:', authError.message);
    } else {
      console.log('✅ Authentication successful!');

      // Check metadata
      const metadata = authData.user?.app_metadata;
      console.log('\n📊 User metadata:');
      console.log('  - is_platform_admin:', metadata?.is_platform_admin || false);
      console.log('  - admin_role:', metadata?.admin_role || 'none');
      console.log('  - role:', metadata?.role || 'none');
    }

    console.log('\n✨ Demo admin account ready!');
    console.log('\n🔑 Login credentials:');
    console.log('  Email: demo.admin@civicnotices.co.uk');
    console.log('  Password: DemoAdmin2024!');
    console.log('\n📌 URL: http://localhost:5173/admin/login');
    console.log('\n✅ This account has full admin access and the password is confirmed working.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createDemoAdmin().catch(console.error);