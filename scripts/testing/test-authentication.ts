import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthentication() {
  console.log('Testing Demo Authentication...\n');

  const testAccounts = [
    {
      email: 'licensing@westminster.gov.uk',
      password: 'testpass123',
      type: 'Council'
    },
    {
      email: 'licensing@sampletonborough.gov.uk',
      password: 'testpass123',
      type: 'Council'
    },
    {
      email: 'solicitor@wilsonpartners.com',
      password: 'testpass123',
      type: 'Firm'
    }
  ];

  for (const account of testAccounts) {
    console.log(`Testing ${account.type} account: ${account.email}`);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });

      if (error) {
        console.log(`  ✗ Login failed: ${error.message}`);
      } else if (data.user) {
        console.log(`  ✓ Login successful!`);
        console.log(`    User ID: ${data.user.id}`);
        console.log(`    Email: ${data.user.email}`);

        // Test department/organization membership
        if (account.type === 'Council') {
          const { data: membership } = await supabase
            .from('department_memberships')
            .select(`
              department:departments (
                id,
                name,
                slug,
                organization:organizations (
                  id,
                  name,
                  slug
                )
              )
            `)
            .eq('user_id', data.user.id)
            .limit(1)
            .single();

          if (membership) {
            console.log(`    Department: ${(membership as any).department.name}`);
            console.log(`    Organization: ${(membership as any).department.organization.name}`);
          }
        } else {
          const { data: membership } = await supabase
            .from('organization_memberships')
            .select(`
              organization:organizations (
                id,
                name,
                slug
              )
            `)
            .eq('user_id', data.user.id)
            .limit(1)
            .single();

          if (membership) {
            console.log(`    Organization: ${(membership as any).organization.name}`);
          }
        }

        // Sign out
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err}`);
    }

    console.log();
  }

  console.log('Authentication test complete!');
}

testAuthentication().catch(console.error);