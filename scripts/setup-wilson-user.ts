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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupWilsonUser() {
  console.log('🔧 Setting up Wilson Partners demo user...\n');

  const email = 'solicitor@wilsonpartners.com';
  const password = 'testpass123';
  const fullName = 'Emma Thompson';
  const organizationId = '550e8400-e29b-41d4-b001-446655440001';

  // First, try to find if user already exists
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
    filter: `email.eq.${email}`
  });

  let userId: string;

  if (existingUsers?.users && existingUsers.users.length > 0) {
    // User exists, update password
    userId = existingUsers.users[0].id;
    console.log(`✓ User found with ID: ${userId}`);

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (updateError) {
      console.log(`⚠️ Could not update user: ${updateError.message}`);
    } else {
      console.log('✓ User password and metadata updated');
    }
  } else {
    // Create new user
    console.log('Creating new user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (createError) {
      console.error('❌ Could not create user:', createError.message);

      // Try alternative approach - signUp
      console.log('Trying alternative approach...');
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (signupError) {
        console.error('❌ Signup also failed:', signupError.message);
        return;
      }

      if (signupData?.user) {
        userId = signupData.user.id;
        console.log(`✓ User created via signup with ID: ${userId}`);

        // Confirm email immediately
        await supabase.auth.admin.updateUserById(userId, {
          email_confirm: true
        });
      } else {
        console.error('❌ No user data returned from signup');
        return;
      }
    } else if (newUser?.user) {
      userId = newUser.user.id;
      console.log(`✓ User created with ID: ${userId}`);
    } else {
      console.error('❌ No user data returned');
      return;
    }
  }

  // Ensure profile exists
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      full_name: fullName
    }, {
      onConflict: 'id'
    });

  if (!profileError) {
    console.log('✓ Profile ensured');
  } else {
    console.log('⚠️ Profile error:', profileError.message);
  }

  // Create organization membership
  const { error: membershipError } = await supabase
    .from('organization_memberships')
    .upsert({
      organization_id: organizationId,
      user_id: userId,
      role: 'org_admin'
    }, {
      onConflict: 'organization_id,user_id'
    });

  if (!membershipError) {
    console.log('✓ Organization membership created');
  } else {
    console.log('⚠️ Membership error:', membershipError.message);
  }

  console.log('\n✅ Setup complete!');
  console.log('\n📋 Test credentials:');
  console.log('------------------------------------------');
  console.log('Professional Portal (Wilson & Partners):');
  console.log('  Email: solicitor@wilsonpartners.com');
  console.log('  Password: testpass123');
  console.log('------------------------------------------\n');
}

// Run the setup
setupWilsonUser().catch(console.error);