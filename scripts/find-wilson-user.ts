#!/usr/bin/env tsx

/**
 * Find Wilson & Partners user email
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WILSON_ORG_ID = '00000000-0000-0000-0000-000000000101';

async function main() {
  // Get the user ID from organization_memberships
  const { data: memberships } = await supabase
    .from('organization_memberships')
    .select('user_id, role')
    .eq('organization_id', WILSON_ORG_ID);

  if (!memberships || memberships.length === 0) {
    console.log('❌ No users found for Wilson & Partners');
    return;
  }

  console.log('👥 Wilson & Partners users:\n');

  for (const m of memberships) {
    try {
      // Try to get user details from auth.users
      const { data: { user }, error } = await supabase.auth.admin.getUserById(m.user_id);

      if (error || !user) {
        console.log(`User ID: ${m.user_id}`);
        console.log(`Role: ${m.role}`);
        console.log(`Email: [Could not retrieve - ${error?.message}]`);
        console.log('---');
      } else {
        console.log(`📧 Email: ${user.email}`);
        console.log(`👤 User ID: ${user.id}`);
        console.log(`👔 Role: ${m.role}`);
        console.log(`✅ Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`📅 Created: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log('---');
      }
    } catch (err: any) {
      console.log(`User ID: ${m.user_id} (Role: ${m.role})`);
      console.log(`Error: ${err.message}`);
      console.log('---');
    }
  }

  console.log('\n💡 If you need to reset the password:');
  console.log('   1. Go to Supabase Dashboard > Authentication > Users');
  console.log('   2. Find the user by email');
  console.log('   3. Click actions menu (…) > Reset Password');
  console.log('   4. Or manually set: WilsonDemo123!');
}

main().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});
