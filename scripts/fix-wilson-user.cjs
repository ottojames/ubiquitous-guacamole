const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixWilsonUser() {
  try {
    console.log('Finding Wilson Partners user...');

    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'solicitor@wilsonpartners.com',
      password: 'testpass123'
    });

    let userId;
    if (signInData?.user) {
      userId = signInData.user.id;
      console.log('User found via sign in:', userId);
      await supabase.auth.signOut();
    } else {
      console.log('Sign in failed, user might not exist or wrong password');
      console.log('Error:', signInError?.message);

      // Check if user exists with different password
      const { data: authData } = await supabase.auth.admin.listUsers();
      const existingUser = authData?.users?.find(u => u.email === 'solicitor@wilsonpartners.com');

      if (existingUser) {
        userId = existingUser.id;
        console.log('User exists with ID:', userId);
      } else {
        console.log('User does not exist at all');
        return;
      }
    }

    // Get Wilson Partners organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .or('slug.eq.wilson-partners,slug.eq.wilsonpartners')
      .single();

    if (!org) {
      console.error('Wilson Partners organization not found');

      // List all firm organizations
      const { data: firms } = await supabase
        .from('organizations')
        .select('id, name, slug, type')
        .eq('type', 'firm');

      console.log('Available firm organizations:', firms);
      return;
    }

    console.log('Organization found:', org.name, `(${org.slug})`);

    // Ensure profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
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
    } else {
      console.log('Profile already exists');
    }

    // Ensure organization membership
    const { data: existingOrgMembership } = await supabase
      .from('organization_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', org.id)
      .single();

    if (!existingOrgMembership) {
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
    } else {
      console.log('Organization membership already exists');
    }

    console.log('\n✅ Wilson Partners user setup complete!');
    console.log('Email: solicitor@wilsonpartners.com');
    console.log('Password: testpass123');
    console.log(`URL: /f/${org.slug}/dashboard`);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixWilsonUser();