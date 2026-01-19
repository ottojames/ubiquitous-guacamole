const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWilsonAuth() {
  console.log('Testing Wilson Partners authentication...');

  try {
    // Try to sign in with the demo account
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'solicitor@wilsonpartners.com',
      password: 'testpass123'
    });

    if (error) {
      console.error('Sign in failed:', error.message);
      return;
    }

    console.log('✅ Sign in successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Session token exists:', !!data.session);

    // Check organization access
    const { data: membership, error: memError } = await supabase
      .from('organization_memberships')
      .select('organization_id, role, organizations(name, slug, type)')
      .eq('user_id', data.user.id)
      .single();

    if (memError) {
      console.error('Failed to get organization:', memError);
    } else {
      console.log('✅ Organization access confirmed:');
      console.log('  - Name:', membership.organizations.name);
      console.log('  - Type:', membership.organizations.type);
      console.log('  - Slug:', membership.organizations.slug);
      console.log('  - Role:', membership.role);
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Sign out successful');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testWilsonAuth();