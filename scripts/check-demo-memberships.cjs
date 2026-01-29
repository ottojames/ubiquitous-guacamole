const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMemberships() {
  try {
    // Get the demo user
    const { data: authUser } = await supabase.auth.admin.listUsers();
    const demoUser = authUser?.users?.find(u => u.email === 'licensing@westminster.gov.uk');

    if (!demoUser) {
      console.log('Demo user not found');
      return;
    }

    console.log('Demo user ID:', demoUser.id);

    // Check organization memberships
    const { data: orgMemberships, error: orgError } = await supabase
      .from('organization_memberships')
      .select('*')
      .eq('user_id', demoUser.id);

    console.log('Organization memberships:', orgMemberships || orgError);

    // Check department memberships
    const { data: deptMemberships, error: deptError } = await supabase
      .from('department_memberships')
      .select('*')
      .eq('user_id', demoUser.id);

    console.log('Department memberships:', deptMemberships || deptError);

    // Get Westminster org
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', 'westminster')
      .single();

    console.log('Westminster org ID:', org?.id);

    // Get Westminster departments
    if (org) {
      const { data: depts } = await supabase
        .from('departments')
        .select('*')
        .eq('organization_id', org.id);

      console.log('Westminster departments:', depts?.map(d => ({ id: d.id, name: d.name, slug: d.slug })));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkMemberships();