const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createFreshWilsonUser() {
  try {
    console.log('Creating fresh Wilson Partners user...');

    // Generate a unique user ID
    const userId = crypto.randomUUID();
    console.log('Generated user ID:', userId);

    // Get Wilson & Partners organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', 'wilson-partners')
      .single();

    if (!org) {
      console.error('Wilson & Partners organization not found');
      return;
    }

    console.log('Organization found:', org.name);

    // 1. Create profile first (avoid auth issues)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: 'solicitor@wilsonpartners.com',
        full_name: 'Emma Thompson'
      });

    if (profileError) {
      console.log('Profile error:', profileError.message);
    } else {
      console.log('Profile created');
    }

    // 2. Create organization membership
    const { error: orgMembershipError } = await supabase
      .from('organization_memberships')
      .insert({
        user_id: userId,
        organization_id: org.id,
        role: 'firm_admin'
      });

    if (orgMembershipError) {
      console.log('Org membership error:', orgMembershipError.message);
    } else {
      console.log('Organization membership created');
    }

    // 3. Try to create auth user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      id: userId,
      email: 'solicitor@wilsonpartners.com',
      password: 'testpass123',
      email_confirm: true
    });

    if (userError) {
      console.error('Auth user creation error:', userError);
      console.log('\nNote: User profile and memberships created but auth user failed.');
      console.log('This might need manual intervention in Supabase Dashboard.');
    } else {
      console.log('Auth user created successfully');
    }

    console.log('\n✅ Wilson Partners user setup attempted!');
    console.log('User ID:', userId);
    console.log('Email: solicitor@wilsonpartners.com');
    console.log('Password: testpass123');
    console.log('URL: /f/wilson-partners/dashboard');
    console.log('\n⚠️  If login fails, the auth user might need to be created manually in Supabase Dashboard.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createFreshWilsonUser();