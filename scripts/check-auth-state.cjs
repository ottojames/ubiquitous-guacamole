const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://puemqhpqxgrvrukyrfkm.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZW1xaHBxeGdydnJ1a3lyZmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTE5NTIsImV4cCI6MjA3MDQ4Nzk1Mn0.nL0AW6pWGGfpS64mKd4wuqVfudOtiW4M7_wydIjzMsc';

const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuth() {
  console.log('🔍 Checking auth state in your app...\n');

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.log('Error getting session:', error.message);
  } else if (session) {
    console.log('⚠️  YOU ARE LOGGED IN!');
    console.log('User ID:', session.user.id);
    console.log('Email:', session.user.email);
    console.log('\nThis is the problem! When you\'re logged in, the RLS policy');
    console.log('expects source_organization_id to be in your memberships.');
    console.log('But applicants set source_organization_id to NULL.');
    console.log('\n✅ SOLUTION: Log out or open in incognito mode!');
  } else {
    console.log('✅ No session found - you should be anonymous');
    console.log('\nIf the app is still failing, the issue is in the code.');
    console.log('The Supabase client in the app might be using a different configuration.');
  }
}

checkAuth();
