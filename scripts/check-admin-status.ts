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

async function checkAdminStatus() {
  try {
    console.log('🔍 Checking admin status...');
    console.log('──────────────────────────────────────────────────');

    // Check auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      '5340d1c7-4d8b-49cc-8e1d-23b13df31a66'
    );

    if (authError) {
      console.error('❌ Error fetching auth user:', authError);
    } else {
      console.log('✅ Auth user exists:');
      console.log('   Email:', authUser.user.email);
      console.log('   Created:', authUser.user.created_at);
    }

    // Check admin_users table
    console.log('\n📋 Checking admin_users table...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@civicnotices.co.uk');

    if (adminError) {
      console.error('❌ Error fetching admin user:', adminError);
    } else if (adminUsers && adminUsers.length > 0) {
      console.log('✅ Admin user record found:');
      adminUsers.forEach(admin => {
        console.log('   ID:', admin.id);
        console.log('   User ID:', admin.user_id);
        console.log('   Email:', admin.email);
        console.log('   Role:', admin.role);
        console.log('   Status:', admin.status);
        console.log('   2FA Enabled:', admin.two_factor_enabled);
        console.log('   Failed Attempts:', admin.failed_login_attempts);
        console.log('   Locked Until:', admin.locked_until);
      });
    } else {
      console.log('⚠️  No admin user found in admin_users table');
    }

    // Test authentication directly
    console.log('\n🔐 Testing direct authentication...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@civicnotices.co.uk',
      password: 'ChangeMeImmediately123!'
    });

    if (signInError) {
      console.error('❌ Direct auth failed:', signInError.message);
    } else {
      console.log('✅ Direct auth successful!');
      console.log('   User ID:', signInData.user?.id);
      await supabase.auth.signOut();
    }

    // Check if admin tables exist
    console.log('\n📊 Checking database tables...');
    const { data: tables, error: tableError } = await supabase.rpc('get_tables_list', {});

    if (!tableError && tables) {
      const adminTables = ['admin_users', 'admin_sessions', 'admin_actions'];
      adminTables.forEach(table => {
        const exists = tables.some((t: any) => t.table_name === table);
        console.log(`   ${table}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
      });
    } else {
      // Try a simpler check
      const { count, error } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log('   admin_users: ✅ EXISTS');
      } else {
        console.log('   admin_users: ❌ Error -', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

checkAdminStatus();