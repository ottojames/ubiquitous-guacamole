#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

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

async function resetAdminPassword() {
  try {
    console.log('🔐 Resetting admin password...');
    console.log('──────────────────────────────────────────────────');

    const userId = '5340d1c7-4d8b-49cc-8e1d-23b13df31a66';
    const newPassword = 'ChangeMeImmediately123!';

    // Update the password
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      console.error('❌ Failed to reset password:', error);
      process.exit(1);
    }

    console.log('✅ Password reset successfully!');

    // Test the login
    console.log('\n📋 Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@civicnotices.co.uk',
      password: newPassword
    });

    if (authError) {
      console.error('❌ Authentication test failed:', authError);
      process.exit(1);
    }

    console.log('✅ Authentication test successful!');

    // Sign out after test
    await supabase.auth.signOut();

    console.log('\n══════════════════════════════════════════════════');
    console.log('🎉 PASSWORD RESET COMPLETE!');
    console.log('══════════════════════════════════════════════════');
    console.log('');
    console.log('📧 Email:      admin@civicnotices.co.uk');
    console.log('🔑 Password:   ChangeMeImmediately123!');
    console.log('');
    console.log('✨ You can now login at:');
    console.log('   http://localhost:5173/admin/login');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

resetAdminPassword();