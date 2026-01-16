#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo accounts configuration
const demoAccounts = [
  {
    email: 'licensing@westminster.gov.uk',
    password: 'testpass123',
    fullName: 'Westminster Licensing',
    organizationId: '0e536037-48c3-4196-8fb6-c31803621050',
    departmentId: '2145bf45-da2d-421d-8d8e-8ad46bc6bbef',
    role: 'dept_admin',
    type: 'council'
  },
  {
    email: 'solicitor@wilsonpartners.com',
    password: 'testpass123',
    fullName: 'Emma Thompson',
    organizationId: '550e8400-e29b-41d4-b001-446655440001',
    departmentId: null,
    role: 'org_admin',
    type: 'firm'
  }
];

async function setupDemoAuth() {
  console.log('🔧 Setting up demo authentication workaround...\n');

  for (const account of demoAccounts) {
    console.log(`📧 Processing ${account.email}...`);

    try {
      // Step 1: Try to sign up the user (might already exist)
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.fullName
        }
      });

      if (signUpError) {
        if (signUpError.message?.includes('already been registered')) {
          console.log(`  ℹ️ User already exists, updating password...`);

          // Update the existing user's password
          const { data: users, error: listError } = await supabase.auth.admin.listUsers({
            filter: `email.eq.${account.email}`
          });

          if (users?.users?.[0]) {
            const userId = users.users[0].id;

            // Update password
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
              password: account.password
            });

            if (updateError) {
              console.log(`  ⚠️ Could not update password: ${updateError.message}`);
            } else {
              console.log(`  ✓ Password updated`);
            }

            // Ensure profile exists
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: userId,
                email: account.email,
                full_name: account.fullName
              }, {
                onConflict: 'id'
              });

            if (!profileError) {
              console.log(`  ✓ Profile ensured`);
            }

            // Set up memberships
            await setupMemberships(userId, account);
          }
        } else {
          console.log(`  ❌ Sign up error: ${signUpError.message}`);
        }
      } else if (signUpData?.user) {
        console.log(`  ✓ User created`);

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            email: account.email,
            full_name: account.fullName
          });

        if (!profileError) {
          console.log(`  ✓ Profile created`);
        }

        // Set up memberships
        await setupMemberships(signUpData.user.id, account);
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }
  }

  console.log('\n✅ Demo authentication setup complete!');
  console.log('\n📋 Test credentials:');
  console.log('------------------------------------------');
  console.log('Council Portal:');
  console.log('  Email: licensing@westminster.gov.uk');
  console.log('  Password: testpass123');
  console.log('');
  console.log('Professional Portal:');
  console.log('  Email: solicitor@wilsonpartners.com');
  console.log('  Password: testpass123');
  console.log('------------------------------------------\n');
}

async function setupMemberships(userId: string, account: any) {
  if (account.type === 'council' && account.departmentId) {
    // Add department membership
    const { error } = await supabase
      .from('department_memberships')
      .upsert({
        department_id: account.departmentId,
        user_id: userId,
        role: account.role
      }, {
        onConflict: 'department_id,user_id'
      });

    if (!error) {
      console.log(`  ✓ Department membership created`);
    } else {
      console.log(`  ⚠️ Department membership error: ${error.message}`);
    }
  } else if (account.type === 'firm' && account.organizationId) {
    // Add organization membership
    const { error } = await supabase
      .from('organization_memberships')
      .upsert({
        organization_id: account.organizationId,
        user_id: userId,
        role: account.role
      }, {
        onConflict: 'organization_id,user_id'
      });

    if (!error) {
      console.log(`  ✓ Organization membership created`);
    } else {
      console.log(`  ⚠️ Organization membership error: ${error.message}`);
    }
  }
}

// Run the setup
setupDemoAuth().catch(console.error);