const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixWestminsterMemberships() {
  try {
    console.log('Finding Westminster demo user...');

    // Get user by email
    const { data: authData } = await supabase.auth.admin.listUsers();
    let user = authData?.users?.find(u => u.email === 'licensing@westminster.gov.uk');

    if (!user) {
      // Try sign in to get the user ID
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'licensing@westminster.gov.uk',
        password: 'testpass123'
      });

      if (signInData?.user) {
        user = signInData.user;
        console.log('Found user via sign in:', user.id);
        // Sign out immediately
        await supabase.auth.signOut();
      } else {
        console.error('Could not find user via sign in:', signInError);
        return;
      }
    } else {
      console.log('Found user in list:', user.id);
    }

    if (!user) {
      console.error('User still not found');
      return;
    }

    // Get Westminster organization
    let org;
    const { data: westminsterOrg } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', 'westminster')
      .single();

    if (westminsterOrg) {
      org = westminsterOrg;
    } else {
      // Try alternative slug
      const { data: altOrg } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', 'westminster-city-of-council')
        .single();

      if (altOrg) {
        org = altOrg;
      } else {
        console.error('Westminster organization not found');
        return;
      }
    }

    console.log('Organization found:', org.id, org.name, 'slug:', org.slug);

    // Get Westminster Licensing department
    const { data: dept } = await supabase
      .from('departments')
      .select('id, name, slug')
      .eq('organization_id', org.id)
      .eq('slug', 'licensing')
      .single();

    if (!dept) {
      console.error('Westminster Licensing department not found');
      return;
    }

    console.log('Department found:', dept.id, dept.name);

    // Ensure profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: 'licensing@westminster.gov.uk',
          full_name: 'Westminster Licensing Officer',
          role: 'council_admin'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      } else {
        console.log('Profile created');
      }
    } else {
      console.log('Profile already exists');
    }

    // Ensure organization membership exists
    const { data: existingOrgMembership } = await supabase
      .from('organization_memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', org.id)
      .single();

    if (!existingOrgMembership) {
      const { error: orgMembershipError } = await supabase
        .from('organization_memberships')
        .insert({
          user_id: user.id,
          organization_id: org.id,
          role: 'org_admin'
        });

      if (orgMembershipError) {
        console.error('Org membership error:', orgMembershipError);
      } else {
        console.log('Organization membership created');
      }
    } else {
      console.log('Organization membership already exists');
    }

    // Ensure department membership exists
    const { data: existingDeptMembership } = await supabase
      .from('department_memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('department_id', dept.id)
      .single();

    if (!existingDeptMembership) {
      const { error: deptMembershipError } = await supabase
        .from('department_memberships')
        .insert({
          user_id: user.id,
          department_id: dept.id,
          role: 'dept_admin'
        });

      if (deptMembershipError) {
        console.error('Dept membership error:', deptMembershipError);
      } else {
        console.log('Department membership created');
      }
    } else {
      console.log('Department membership already exists');
    }

    console.log('\n✅ Westminster demo user memberships fixed!');
    console.log('User ID:', user.id);
    console.log('Email: licensing@westminster.gov.uk');
    console.log('Organization:', org.name, `(slug: ${org.slug})`);
    console.log('Department:', dept.name, `(slug: ${dept.slug})`);
    console.log('\nLogin URL: /c/' + org.slug + '/' + dept.slug + '/dashboard');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixWestminsterMemberships();