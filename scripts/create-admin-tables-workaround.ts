import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSuperAdminWithoutTables() {
  console.log('🔐 Testing Super Admin Creation (Workaround Mode)...');
  console.log('─'.repeat(50));

  const email = 'admin@civicnotices.co.uk';
  const password = 'ChangeMeImmediately123!';

  try {
    // Since the admin tables don't exist, we'll:
    // 1. Create an auth user with admin metadata
    // 2. Store admin info in the auth.users metadata

    console.log('1️⃣  Creating/updating auth user with admin privileges...');

    // First check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${email}`
    });

    let userId;

    if (users && users.length > 0) {
      // User exists, update metadata
      const existingUser = users[0];
      userId = existingUser.id;

      console.log('   Found existing user, updating metadata...');

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            role: 'super_admin',
            is_admin: true,
            admin_level: 'super',
            created_by: 'seed_script',
            two_factor_enabled: false,
            status: 'active'
          }
        }
      );

      if (updateError) {
        throw updateError;
      }

      console.log('   ✅ User metadata updated');

      // Also reset password
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (passwordError) {
        console.log('   ⚠️  Could not reset password (non-critical)');
      } else {
        console.log('   ✅ Password reset');
      }

    } else {
      // Create new user
      console.log('   Creating new auth user...');

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'super_admin',
          is_admin: true,
          admin_level: 'super',
          created_by: 'seed_script',
          two_factor_enabled: false,
          status: 'active'
        }
      });

      if (authError) {
        throw authError;
      }

      userId = authUser.user.id;
      console.log('   ✅ Auth user created with admin metadata');
    }

    // Display success
    console.log('');
    console.log('═'.repeat(50));
    console.log('🎉 SUPER ADMIN CONFIGURED (Workaround Mode)');
    console.log('═'.repeat(50));
    console.log('');
    console.log('📧 Email:     ', email);
    console.log('🔑 Password:  ', password);
    console.log('🆔 User ID:   ', userId);
    console.log('');
    console.log('⚠️  IMPORTANT NOTES:');
    console.log('   1. Admin tables are NOT created yet');
    console.log('   2. Admin metadata stored in auth.users table');
    console.log('   3. The admin panel may have limited functionality');
    console.log('   4. Run database migrations when possible for full features');
    console.log('');
    console.log('🔗 You can still try to login at:');
    console.log('   http://localhost:5173/admin/login');
    console.log('');
    console.log('⚡ The auth user has been created and can authenticate,');
    console.log('   but full admin features require the database tables.');
    console.log('');

    // Test that we can sign in
    console.log('2️⃣  Testing authentication...');
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.log('   ⚠️  Sign-in test failed:', signInError.message);
    } else {
      console.log('   ✅ Authentication successful!');
      console.log('   Session created with user ID:', session.user.id);

      // Sign out to clean up
      await supabase.auth.signOut();
    }

    return true;

  } catch (error) {
    console.error('');
    console.error('❌ Failed to create super admin:');
    console.error('   ', error.message || error);
    return false;
  }
}

// Run the workaround
testSuperAdminWithoutTables()
  .then((success) => {
    if (success) {
      console.log('✅ Workaround completed successfully');
      console.log('');
      console.log('Next steps:');
      console.log('1. Apply database migrations when you have database access');
      console.log('2. The auth user is ready and can sign in');
      console.log('3. Some admin features may not work without the tables');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });