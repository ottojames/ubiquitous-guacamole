import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperAdmin() {
  const email = 'admin@civicnotices.co.uk';
  const password = 'ChangeMeImmediately123!';

  console.log('🔐 Creating Super Admin Account...');
  console.log('─'.repeat(50));

  try {
    // 1. Check if admin user already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (existingAdmin && !checkError) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log('');
      console.log('To reset password, use the forgot password flow.');
      return;
    }

    // 2. Create auth user
    console.log('1️⃣  Creating auth user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        created_by: 'seed_script'
      }
    });

    if (authError) {
      // Check if user already exists in auth
      if (authError.message.includes('already exists')) {
        console.log('   Auth user already exists, continuing...');

        // Get the existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
          filter: `email.eq.${email}`
        });

        if (listError || !users || users.length === 0) {
          throw new Error('Failed to find existing auth user');
        }

        const existingUser = users[0];

        // Create admin_users record
        console.log('2️⃣  Creating admin_users record...');
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .insert({
            user_id: existingUser.id,
            email,
            role: 'super_admin',
            two_factor_enabled: false,
            status: 'active',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (adminError) {
          throw adminError;
        }

        console.log('   ✅ Admin user record created');
      } else {
        throw authError;
      }
    } else if (authUser) {
      console.log('   ✅ Auth user created');

      // 3. Create admin_users record
      console.log('2️⃣  Creating admin_users record...');
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .insert({
          user_id: authUser.user.id,
          email,
          role: 'super_admin',
          two_factor_enabled: false,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (adminError) {
        throw adminError;
      }

      console.log('   ✅ Admin user record created');
    }

    // 4. Log the action (without session since this is a seed script)
    console.log('3️⃣  Logging admin action...');
    const { error: logError } = await supabase.rpc('log_admin_action', {
      p_admin_user_id: null, // System action
      p_action: 'admin.created',
      p_action_category: 'account_management',
      p_target_type: 'admin_user',
      p_target_id: null,
      p_target_identifier: email,
      p_old_values: null,
      p_new_values: JSON.stringify({ email, role: 'super_admin' }),
      p_reason: 'Initial super admin account creation via seed script',
      p_ip_address: '127.0.0.1',
      p_session_id: null,
      p_severity: 'info'
    });

    if (logError) {
      console.log('   ⚠️  Warning: Could not log action (non-critical)');
    } else {
      console.log('   ✅ Action logged');
    }

    // 5. Display credentials
    console.log('');
    console.log('═'.repeat(50));
    console.log('🎉 SUPER ADMIN CREATED SUCCESSFULLY');
    console.log('═'.repeat(50));
    console.log('');
    console.log('📧 Email:    ', email);
    console.log('🔑 Password: ', password);
    console.log('');
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. Change password on first login');
    console.log('   2. Enable 2FA immediately');
    console.log('   3. Add IP allowlist for production');
    console.log('   4. This account has FULL admin privileges');
    console.log('');
    console.log('🔗 Login URL: http://localhost:5173/admin/login');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Failed to create super admin:');
    console.error('   ', error.message || error);

    if (error.code) {
      console.error('   Error code:', error.code);
    }

    if (error.details) {
      console.error('   Details:', error.details);
    }

    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Ensure database migrations have been run');
    console.error('2. Check SUPABASE_SERVICE_ROLE_KEY is correct');
    console.error('3. Verify admin_users table exists');

    process.exit(1);
  }
}

// Run the script
createSuperAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });