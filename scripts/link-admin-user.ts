#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function linkAdminUser() {
  try {
    console.log('🔗 Linking existing auth user to admin_users table...');
    console.log('──────────────────────────────────────────────────');

    const userId = '5340d1c7-4d8b-49cc-8e1d-23b13df31a66';
    const email = 'admin@civicnotices.co.uk';

    // Check if admin_users record already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingAdmin) {
      console.log('✅ Admin user already exists in admin_users table!');
      console.log('   You can now login at: http://localhost:5173/admin/login');
      return;
    }

    // Create admin_users record
    const { data: adminUser, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        email: email,
        role: 'super_admin',
        two_factor_enabled: false,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create admin_users record:', insertError);
      process.exit(1);
    }

    console.log('✅ Admin user successfully linked!');
    console.log('');
    console.log('══════════════════════════════════════════════════');
    console.log('🎉 SUPER ADMIN READY!');
    console.log('══════════════════════════════════════════════════');
    console.log('');
    console.log('📧 Email:      admin@civicnotices.co.uk');
    console.log('🔑 Password:   ChangeMeImmediately123!');
    console.log('🆔 Admin ID:   ' + adminUser.id);
    console.log('👤 User ID:    ' + userId);
    console.log('');
    console.log('✨ You can now login with full admin privileges at:');
    console.log('   http://localhost:5173/admin/login');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

linkAdminUser();