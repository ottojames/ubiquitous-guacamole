const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDemoUser(email, password, fullName, orgSlug, deptSlug = null, isFirm = false) {
  try {
    console.log(`\nCreating ${email}...`);

    // 1. Check if user already exists by attempting sign in
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    let userId;
    if (existingUser?.user) {
      console.log('User already exists:', existingUser.user.id);
      userId = existingUser.user.id;
      await supabase.auth.signOut();
    } else {
      // Create new user
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (userError && userError.code !== 'email_exists') {
        console.error('Error creating user:', userError);
        return false;
      }

      if (userData?.user) {
        userId = userData.user.id;
        console.log('User created:', userId);
      } else {
        // User exists but password might be different
        console.log('User exists, attempting to get ID...');
        return false;
      }
    }

    // 2. Get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', orgSlug)
      .single();

    if (orgError || !org) {
      console.error(`Organization ${orgSlug} not found`);
      return false;
    }

    console.log('Organization found:', org.name);

    // 3. Ensure profile exists
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
          email,
          full_name: fullName
        });

      if (profileError) {
        console.log('Profile error:', profileError.message);
      } else {
        console.log('Profile created');
      }
    } else {
      console.log('Profile already exists');
    }

    // 4. Ensure organization membership
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
          role: isFirm ? 'firm_admin' : 'org_admin'
        });

      if (orgMembershipError) {
        console.log('Org membership error:', orgMembershipError.message);
      } else {
        console.log('Organization membership created');
      }
    } else {
      console.log('Organization membership already exists');
    }

    // 5. For council users, create department membership
    if (!isFirm && deptSlug) {
      const { data: dept } = await supabase
        .from('departments')
        .select('id, name')
        .eq('organization_id', org.id)
        .eq('slug', deptSlug)
        .single();

      if (dept) {
        console.log('Department found:', dept.name);

        const { data: existingDeptMembership } = await supabase
          .from('department_memberships')
          .select('*')
          .eq('user_id', userId)
          .eq('department_id', dept.id)
          .single();

        if (!existingDeptMembership) {
          const { error: deptMembershipError } = await supabase
            .from('department_memberships')
            .insert({
              user_id: userId,
              department_id: dept.id,
              role: 'dept_admin'
            });

          if (deptMembershipError) {
            console.log('Dept membership error:', deptMembershipError.message);
          } else {
            console.log('Department membership created');
          }
        } else {
          console.log('Department membership already exists');
        }
      }
    }

    console.log(`✅ ${email} setup complete!`);
    return true;

  } catch (error) {
    console.error(`Error setting up ${email}:`, error);
    return false;
  }
}

async function createAllDemoUsers() {
  console.log('Setting up all demo users...\n');

  // 1. Westminster Council
  await createDemoUser(
    'licensing@westminster.gov.uk',
    'testpass123',
    'Westminster Licensing Officer',
    'westminster',
    'licensing',
    false
  );

  // 2. Wilson Partners (Law Firm)
  await createDemoUser(
    'solicitor@wilsonpartners.com',
    'testpass123',
    'Emma Thompson',
    'wilson-partners',
    null,
    true
  );

  // 3. Sampletonborough Council
  await createDemoUser(
    'licensing@sampletonborough.gov.uk',
    'testpass123',
    'Sarah Johnson',
    'sampletonborough',
    'licensing',
    false
  );

  console.log('\n========================================');
  console.log('Demo User Setup Complete!');
  console.log('========================================');
  console.log('\nDemo Accounts:');
  console.log('1. Westminster Council:');
  console.log('   Email: licensing@westminster.gov.uk');
  console.log('   Password: testpass123');
  console.log('   URL: /c/westminster/licensing/dashboard');
  console.log('');
  console.log('2. Wilson Partners (Law Firm):');
  console.log('   Email: solicitor@wilsonpartners.com');
  console.log('   Password: testpass123');
  console.log('   URL: /f/wilson-partners/dashboard');
  console.log('');
  console.log('3. Sampletonborough Council:');
  console.log('   Email: licensing@sampletonborough.gov.uk');
  console.log('   Password: testpass123');
  console.log('   URL: /c/sampletonborough/licensing/dashboard');
}

createAllDemoUsers();