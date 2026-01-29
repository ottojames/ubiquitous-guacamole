const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createWestminsterDemoUser() {
  try {
    console.log('Creating Westminster demo user...');

    // 1. Create the user in auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'licensing@westminster.gov.uk',
      password: 'testpass123',
      email_confirm: true
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return;
    }

    console.log('User created:', userData.user.id);

    // 2. Get Westminster organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', 'westminster')
      .single();

    if (orgError || !org) {
      // If Westminster doesn't exist, check for westminster-city-of-council
      const { data: altOrg } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', 'westminster-city-of-council')
        .single();

      if (altOrg) {
        console.log('Using Westminster (City of) Council:', altOrg.id);
        org = altOrg;
      } else {
        console.error('Westminster organization not found');
        return;
      }
    }

    console.log('Organization found:', org.id, org.name);

    // 3. Get Westminster Licensing department
    const { data: dept, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('organization_id', org.id)
      .eq('slug', 'licensing')
      .single();

    if (deptError || !dept) {
      console.error('Westminster Licensing department not found:', deptError);
      return;
    }

    console.log('Department found:', dept.id, dept.name);

    // 4. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        email: 'licensing@westminster.gov.uk',
        full_name: 'Westminster Licensing Officer',
        role: 'council_admin'
      });

    if (profileError) {
      console.log('Profile error (might already exist):', profileError.message);
    } else {
      console.log('Profile created');
    }

    // 5. Create organization membership
    const { error: orgMembershipError } = await supabase
      .from('organization_memberships')
      .insert({
        user_id: userData.user.id,
        organization_id: org.id,
        role: 'org_admin'
      });

    if (orgMembershipError) {
      console.log('Org membership error (might already exist):', orgMembershipError.message);
    } else {
      console.log('Organization membership created');
    }

    // 6. Create department membership
    const { error: deptMembershipError } = await supabase
      .from('department_memberships')
      .insert({
        user_id: userData.user.id,
        department_id: dept.id,
        role: 'dept_admin'
      });

    if (deptMembershipError) {
      console.log('Dept membership error (might already exist):', deptMembershipError.message);
    } else {
      console.log('Department membership created');
    }

    console.log('\n✅ Westminster demo user created successfully!');
    console.log('Email: licensing@westminster.gov.uk');
    console.log('Password: testpass123');
    console.log('Organization:', org.name);
    console.log('Department:', dept.name);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createWestminsterDemoUser();