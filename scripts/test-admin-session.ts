#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import crypto from 'crypto';

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

async function testSessionCreation() {
  try {
    console.log('🔍 Testing admin session creation...');
    console.log('──────────────────────────────────────────────────');

    // Get admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@civicnotices.co.uk')
      .single();

    if (adminError || !adminUser) {
      console.error('❌ Admin user not found:', adminError);
      process.exit(1);
    }

    console.log('✅ Admin user found:', adminUser.id);

    // Try to create a test session
    const testToken = crypto.randomBytes(32).toString('hex');
    const { data: sessionData, error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        admin_user_id: adminUser.id,
        session_token: testToken,
        ip_address: '127.0.0.1',
        user_agent: 'Test Script',
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Failed to create session:', sessionError);
      console.log('\n⚠️  The RLS policies are still blocking session creation.');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log('\n----------------------------------------');
      console.log('ALTER TABLE public.admin_sessions DISABLE ROW LEVEL SECURITY;');
      console.log('ALTER TABLE public.admin_actions DISABLE ROW LEVEL SECURITY;');
      console.log('ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;');
      console.log('----------------------------------------\n');
      process.exit(1);
    }

    console.log('✅ Session created successfully!');
    console.log('   Session ID:', sessionData.id);
    console.log('   Token:', testToken.substring(0, 10) + '...');

    // Clean up test session
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('id', sessionData.id);

    console.log('✅ Test session cleaned up');
    console.log('\n🎉 Admin authentication should now work!');
    console.log('   Try logging in at: http://localhost:5173/admin/login');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

testSessionCreation();