import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Check all organizations
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .ilike('slug', '%sampleton%');

  console.log('Organizations with "sampleton" in slug:');
  console.log(JSON.stringify(orgs, null, 2));

  // Check departments for each
  for (const org of orgs || []) {
    const { data: depts } = await supabase
      .from('departments')
      .select('id, name, slug')
      .eq('organization_id', org.id);

    console.log('\nDepartments for ' + org.name + ' (' + org.slug + '):');
    console.log(JSON.stringify(depts, null, 2));
  }

  // Check notices with department IDs
  const { data: notices } = await supabase
    .from('notices')
    .select('id, department_id')
    .not('department_id', 'is', null)
    .limit(10);

  console.log('\n\nNotices with department_id:');
  console.log(JSON.stringify(notices, null, 2));

  // Check what department the user has access to
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users?.find(u => u.email === 'licensing@sampletonborough.gov.uk');

  if (user) {
    const { data: memberships } = await supabase
      .from('department_memberships')
      .select('department_id')
      .eq('user_id', user.id);

    console.log('\n\nUser membership department_id:', memberships);
  }
}

main().catch(console.error);
