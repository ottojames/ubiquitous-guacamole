import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SAMPLETON_DEPT_ID = 'a654ac45-77b3-4431-bc39-9a99a7461ad5';

async function main() {
  console.log('Fixing Sampleton department membership...');

  // Get user by email
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users?.find(u => u.email === 'licensing@sampletonborough.gov.uk');

  if (!user) {
    console.error('User not found!');
    return;
  }

  console.log('Found user:', user.id, user.email);

  // Check existing membership
  const { data: existing } = await supabase
    .from('department_memberships')
    .select('*')
    .eq('user_id', user.id)
    .eq('department_id', SAMPLETON_DEPT_ID);

  console.log('Existing memberships:', existing);

  if (!existing || existing.length === 0) {
    // Create membership
    const { error } = await supabase
      .from('department_memberships')
      .insert({
        department_id: SAMPLETON_DEPT_ID,
        user_id: user.id,
        role: 'dept_admin'
      });

    if (error) {
      console.error('Error creating membership:', error);
    } else {
      console.log('Membership created successfully!');
    }
  } else {
    console.log('Membership already exists');
  }

  // Verify final state
  const { data: memberships } = await supabase
    .from('department_memberships')
    .select('*, departments(name, organization_id)')
    .eq('user_id', user.id);

  console.log('\nUser memberships:');
  console.log(JSON.stringify(memberships, null, 2));
}

main().catch(console.error);
