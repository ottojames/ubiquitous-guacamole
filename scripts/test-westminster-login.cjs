const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY // Use anon key for authentication
);

async function testWestminsterLogin() {
  try {
    console.log('Testing Westminster demo login...');
    console.log('Email: licensing@westminster.gov.uk');
    console.log('Password: testpass123');
    console.log('');

    // 1. Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'licensing@westminster.gov.uk',
      password: 'testpass123'
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }

    console.log('✅ Sign in successful!');
    console.log('User ID:', signInData.user.id);
    console.log('Email:', signInData.user.email);
    console.log('');

    // 2. Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error fetching profile:', profileError.message);
    } else if (profile) {
      console.log('✅ Profile found:', profile.full_name);
    } else {
      console.log('⚠️  No profile found');
    }

    // 3. Check organization memberships
    const { data: orgMemberships, error: orgError } = await supabase
      .from('organization_memberships')
      .select(`
        role,
        organization:organizations(id, name, slug)
      `)
      .eq('user_id', signInData.user.id);

    if (orgError) {
      console.error('❌ Error fetching org memberships:', orgError.message);
    } else if (orgMemberships && orgMemberships.length > 0) {
      console.log('✅ Organization memberships:');
      orgMemberships.forEach(m => {
        console.log(`   - ${m.organization.name} (${m.organization.slug}) - Role: ${m.role}`);
      });
    } else {
      console.log('⚠️  No organization memberships');
    }

    // 4. Check department memberships
    const { data: deptMemberships, error: deptError } = await supabase
      .from('department_memberships')
      .select(`
        role,
        department:departments(id, name, slug, organization_id)
      `)
      .eq('user_id', signInData.user.id);

    if (deptError) {
      console.error('❌ Error fetching dept memberships:', deptError.message);
    } else if (deptMemberships && deptMemberships.length > 0) {
      console.log('✅ Department memberships:');
      for (const m of deptMemberships) {
        // Get org name for each department
        const { data: org } = await supabase
          .from('organizations')
          .select('name, slug')
          .eq('id', m.department.organization_id)
          .single();

        console.log(`   - ${m.department.name} (${m.department.slug}) at ${org?.name || 'Unknown'} - Role: ${m.role}`);
        if (org) {
          console.log(`     Portal URL: /c/${org.slug}/${m.department.slug}/dashboard`);
        }
      }
    } else {
      console.log('⚠️  No department memberships');
    }

    console.log('\n✅ Login test complete! User has proper access configuration.');

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testWestminsterLogin();