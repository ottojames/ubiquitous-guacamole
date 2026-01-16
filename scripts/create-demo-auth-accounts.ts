import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

// Create Supabase admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoAccounts() {
  console.log('🚀 Creating demo authentication accounts...\n');

  // Demo accounts to create
  const demoAccounts = [
    {
      email: 'licensing@westminster.gov.uk',
      password: 'testpass123',
      name: 'Westminster Licensing',
      type: 'council',
      organizationSlug: 'westminster',  // Match the actual slug in DB
      departmentSlug: 'licensing'
    },
    {
      email: 'solicitor@wilsonpartners.com',
      password: 'testpass123',
      name: 'Wilson & Partners Solicitor',
      type: 'firm',
      organizationSlug: 'wilson-partners',
      departmentSlug: null
    }
  ];

  for (const account of demoAccounts) {
    console.log(`\n📧 Processing: ${account.email}`);

    try {
      // Step 1: Create or update auth user
      console.log('   Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: account.name,
          account_type: account.type
        }
      });

      if (authError) {
        // Check if user already exists
        if (authError.message?.includes('already been registered')) {
          console.log('   ⚠️ User already exists, updating password...');

          // Update existing user's password
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existingUser = listData?.users.find(u => u.email === account.email);

          if (existingUser) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { password: account.password }
            );

            if (updateError) {
              console.error('   ❌ Failed to update password:', updateError.message);
              continue;
            } else {
              console.log('   ✅ Password updated successfully');
            }
          }
        } else {
          throw authError;
        }
      } else {
        console.log('   ✅ Auth user created');
      }

      // Get the user ID (either from creation or existing)
      const { data: listData } = await supabase.auth.admin.listUsers();
      const user = listData?.users.find(u => u.email === account.email);

      if (!user) {
        console.error('   ❌ Could not find user after creation');
        continue;
      }

      console.log(`   User ID: ${user.id}`);

      // Step 2: Create or update profile
      console.log('   Creating/updating profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: account.email,
          full_name: account.name,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('   ⚠️ Profile error (may be okay):', profileError.message);
      } else {
        console.log('   ✅ Profile created/updated');
      }

      // Step 3: Get organization
      console.log(`   Finding organization: ${account.organizationSlug}...`);
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, type')
        .eq('slug', account.organizationSlug)
        .single();

      if (orgError || !orgData) {
        console.error(`   ❌ Organization '${account.organizationSlug}' not found`);
        console.log('   ℹ️ Run the appropriate setup script first');
        continue;
      }

      console.log(`   ✅ Found organization: ${orgData.name} (${orgData.type})`);

      if (account.type === 'council') {
        // Step 4a: For council accounts, create department membership
        console.log(`   Finding department: ${account.departmentSlug}...`);
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, name')
          .eq('organization_id', orgData.id)
          .eq('slug', account.departmentSlug)
          .single();

        if (deptError || !deptData) {
          console.error(`   ❌ Department '${account.departmentSlug}' not found`);
          continue;
        }

        console.log(`   ✅ Found department: ${deptData.name}`);

        // Create department membership
        console.log('   Creating department membership...');
        const { error: membershipError } = await supabase
          .from('department_memberships')
          .upsert({
            user_id: user.id,
            department_id: deptData.id,
            role: 'admin',
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,department_id'
          });

        if (membershipError) {
          console.error('   ❌ Failed to create department membership:', membershipError.message);
        } else {
          console.log('   ✅ Department membership created');
        }

      } else if (account.type === 'firm') {
        // Step 4b: For firm accounts, create organization membership
        console.log('   Creating organization membership...');
        const { error: membershipError } = await supabase
          .from('organization_memberships')
          .upsert({
            user_id: user.id,
            organization_id: orgData.id,
            role: 'admin',
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,organization_id'
          });

        if (membershipError) {
          console.error('   ❌ Failed to create organization membership:', membershipError.message);
        } else {
          console.log('   ✅ Organization membership created');
        }
      }

      console.log(`   ✅ Account setup complete for ${account.email}`);

    } catch (error) {
      console.error(`   ❌ Error processing ${account.email}:`, error);
    }
  }

  console.log('\n✅ Demo account creation complete!');
  console.log('\n📝 Test the accounts:');
  console.log('   - Westminster: licensing@westminster.gov.uk / testpass123');
  console.log('   - Wilson Partners: solicitor@wilsonpartners.com / testpass123');
  console.log('\nMake sure VITE_DEMO_MODE=true is set in your .env file');
}

// Run the script
createDemoAccounts().catch(console.error);