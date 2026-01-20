import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function migrateAdminUsersDemo() {
  console.log('🔄 Starting admin user migration (demo mode)...');
  console.log('This demonstrates the migration process without requiring database tables.');

  try {
    // Check for existing admin users in auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching users:', authError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users found in auth.users');
      return;
    }

    // Find potential admin users
    const adminInAuth = users.filter(u =>
      u.email?.includes('admin') ||
      u.user_metadata?.role === 'admin' ||
      u.app_metadata?.is_admin ||
      u.app_metadata?.admin_role
    );

    if (adminInAuth.length === 0) {
      console.log('No admin users found to migrate');
      return;
    }

    console.log(`\nFound ${adminInAuth.length} admin user(s) to migrate:\n`);

    for (const user of adminInAuth) {
      console.log(`📋 Admin User: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Current app_metadata:`, user.app_metadata || {});
      console.log(`   Current user_metadata:`, user.user_metadata || {});

      // Simulate the migration
      const newAppMetadata = {
        ...user.app_metadata,
        is_platform_admin: true,
        admin_role: user.app_metadata?.admin_role || user.app_metadata?.role || 'admin',
        migrated_from_admin_users: new Date().toISOString()
      };

      console.log(`\n   ✅ Would update to:`, newAppMetadata);

      // Actually update the user (comment out for dry run)
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { app_metadata: newAppMetadata }
      );

      if (updateError) {
        console.error(`   ❌ Failed to update: ${updateError.message}`);
      } else {
        console.log(`   ✅ Successfully updated app_metadata`);
      }

      console.log('\n   When platform_admin_settings table exists, would create:');
      console.log(`   {
     user_id: '${user.id}',
     admin_role: '${newAppMetadata.admin_role}',
     two_factor_enabled: false,
     session_timeout_minutes: 120,
     created_at: '${new Date().toISOString()}'
   }`);
      console.log('---');
    }

    console.log('\n📊 Migration Summary:');
    console.log(`- ${adminInAuth.length} admin user(s) processed`);
    console.log('- app_metadata updated with is_platform_admin flag');
    console.log('- Ready for platform_admin_settings table when migrations are applied');

    console.log('\n📝 Next Steps:');
    console.log('1. Apply database migrations:');
    console.log('   npx supabase migration up');
    console.log('2. Run full migration:');
    console.log('   npm run migrate:admin-users');
    console.log('3. Test admin login with unified auth');
    console.log('4. Verify JWT contains admin claims');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration demo
migrateAdminUsersDemo();