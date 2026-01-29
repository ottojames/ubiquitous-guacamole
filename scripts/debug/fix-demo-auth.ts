import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'set' : 'missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'set' : 'missing');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixDemoAuth() {
  console.log('Fixing Demo Authentication...\n');

  const accounts = [
    {
      email: 'licensing@westminster.gov.uk',
      password: 'testpass123',
      full_name: 'Westminster Licensing',
      type: 'council',
      organization_id: '0e536037-48c3-4196-8fb6-c31803621050',
      department_id: '2145bf45-da2d-421d-8d8e-8ad46bc6bbef'
    },
    {
      email: 'licensing@sampletonborough.gov.uk',
      password: 'testpass123',
      full_name: 'Sarah Wilson',
      type: 'council',
      organization_id: 'e6fa3c45-5e2a-4f89-b1c2-d3e4f5a6b7c8',
      department_id: null // Will be created
    },
    {
      email: 'solicitor@wilsonpartners.com',
      password: 'testpass123',
      full_name: 'Emma Thompson',
      type: 'firm',
      organization_id: null // Will be created
    }
  ];

  // First, ensure organizations exist
  console.log('Ensuring organizations exist...\n');

  // Check Westminster
  const { data: westminster } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', '0e536037-48c3-4196-8fb6-c31803621050')
    .single();

  if (!westminster) {
    console.log('Creating Westminster Council...');
    await supabase.from('organizations').insert({
      id: '0e536037-48c3-4196-8fb6-c31803621050',
      type: 'council',
      name: 'Westminster Council',
      slug: 'westminster-council'
    });
  }

  // Check/Create Sampletonborough
  const { data: sampletonborough } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'sampletonborough-council')
    .single();

  if (!sampletonborough) {
    console.log('Creating Sampletonborough Council...');
    const { data: newOrg } = await supabase
      .from('organizations')
      .insert({
        id: 'e6fa3c45-5e2a-4f89-b1c2-d3e4f5a6b7c8',
        type: 'council',
        name: 'Sampletonborough Council',
        slug: 'sampletonborough-council'
      })
      .select()
      .single();

    if (newOrg) {
      // Create department
      const { data: dept } = await supabase
        .from('departments')
        .insert({
          organization_id: newOrg.id,
          name: 'Licensing Department',
          slug: 'licensing'
        })
        .select()
        .single();

      if (dept) {
        accounts[1].department_id = dept.id;
      }
    }
  } else {
    // Get existing department
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('organization_id', sampletonborough.id)
      .eq('slug', 'licensing')
      .single();

    if (dept) {
      accounts[1].department_id = dept.id;
    }
  }

  // Check/Create Wilson Partners
  const { data: wilson } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'wilson-partners')
    .single();

  if (!wilson) {
    console.log('Creating Wilson & Partners...');
    const { data: newOrg } = await supabase
      .from('organizations')
      .insert({
        type: 'firm',
        name: 'Wilson & Partners LLP',
        slug: 'wilson-partners'
      })
      .select()
      .single();

    if (newOrg) {
      accounts[2].organization_id = newOrg.id;
    }
  } else {
    accounts[2].organization_id = wilson.id;
  }

  console.log('\nCreating/updating user accounts...\n');

  for (const account of accounts) {
    try {
      console.log(`Processing ${account.type} account: ${account.email}`);

      // First, try to get existing user by email
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users?.find(u => u.email === account.email);

      let userId: string;

      if (existingUser) {
        console.log(`  User exists, updating password...`);

        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password: account.password }
        );

        if (updateError) {
          console.log(`  ✗ Error updating password: ${updateError.message}`);
          continue;
        }

        userId = existingUser.id;
        console.log(`  ✓ Password updated`);
      } else {
        console.log(`  Creating new user...`);

        // Create new user
        const { data, error } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            full_name: account.full_name
          }
        });

        if (error) {
          console.log(`  ✗ Error creating user: ${error.message}`);
          continue;
        }

        userId = data.user!.id;
        console.log(`  ✓ User created`);
      }

      // Create/update profile
      await supabase.from('profiles').upsert({
        id: userId,
        email: account.email,
        full_name: account.full_name
      });
      console.log(`  ✓ Profile updated`);

      // Create memberships
      if (account.type === 'council' && account.department_id) {
        await supabase.from('department_memberships').upsert({
          department_id: account.department_id,
          user_id: userId,
          role: 'dept_admin'
        });
        console.log(`  ✓ Department membership created`);
      } else if (account.type === 'firm' && account.organization_id) {
        await supabase.from('organization_memberships').upsert({
          organization_id: account.organization_id,
          user_id: userId,
          role: 'org_admin'
        });
        console.log(`  ✓ Organization membership created`);
      }

      console.log(`  ✓ Account ready: ${account.email} / ${account.password}`);

    } catch (err) {
      console.log(`  ✗ Error: ${err}`);
    }

    console.log();
  }

  console.log('Demo authentication fix complete!');
  console.log('\nYou can now login with:');
  console.log('  Council: licensing@westminster.gov.uk / testpass123');
  console.log('  Council: licensing@sampletonborough.gov.uk / testpass123');
  console.log('  Firm: solicitor@wilsonpartners.com / testpass123');
}

fixDemoAuth().catch(console.error);