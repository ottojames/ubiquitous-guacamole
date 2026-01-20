import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function migrateAdminUsers() {
  console.log('🔄 Starting admin user migration...');

  try {
    // First check if platform_admin_settings table exists
    const { error: tableCheckError } = await supabase
      .from('platform_admin_settings')
      .select('user_id')
      .limit(0);

    if (tableCheckError && tableCheckError.code === 'PGRST205') {
      console.log('⚠️ platform_admin_settings table does not exist.');
      console.log('Please run the following migrations first:');
      console.log('1. supabase/migrations/20260122000001_unified_auth_system.sql');
      console.log('2. supabase/migrations/20260122000002_jwt_custom_claims.sql');
      console.log('\nYou can apply them with: npx supabase migration up');
      process.exit(1);
    }

    // 1. Get all admin users
    const { data: adminUsers, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      console.log('⚠️ No admin_users table found or empty, checking auth.users...');

      // Fallback: Check for admin metadata in auth.users
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

      if (!authError && users) {
        const adminInAuth = users.filter(u =>
          u.email?.includes('admin') ||
          u.user_metadata?.role === 'admin' ||
          u.app_metadata?.is_admin
        );

        if (adminInAuth.length > 0) {
          console.log(`Found ${adminInAuth.length} potential admin users in auth.users`);

          for (const user of adminInAuth) {
            // Create platform_admin_settings record
            const { error: insertError } = await supabase
              .from('platform_admin_settings')
              .insert({
                user_id: user.id,
                admin_role: user.app_metadata?.admin_role || 'admin',
                two_factor_enabled: false,
                created_at: new Date().toISOString()
              })
              .select();

            if (!insertError) {
              console.log(`✅ Migrated admin: ${user.email}`);
            } else if (insertError.code === '23505') {
              console.log(`⏭️ Admin already migrated: ${user.email}`);
            } else {
              console.error(`❌ Failed to migrate ${user.email}:`, insertError);
            }
          }
        }
      }
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users to migrate');
      return;
    }

    console.log(`Found ${adminUsers.length} admin users to migrate`);

    // 2. Migrate each admin
    for (const admin of adminUsers) {
      console.log(`Migrating admin: ${admin.email}`);

      // Check if auth user exists
      const { data: authUser } = await supabase.auth.admin.getUserById(admin.user_id);

      if (!authUser) {
        console.error(`❌ No auth user found for ${admin.email}, skipping...`);
        continue;
      }

      // Update auth user metadata
      await supabase.auth.admin.updateUserById(admin.user_id, {
        app_metadata: {
          is_platform_admin: true,
          admin_role: admin.role
        }
      });

      // Create platform_admin_settings record
      const { error: insertError } = await supabase
        .from('platform_admin_settings')
        .insert({
          user_id: admin.user_id,
          admin_role: admin.role,
          two_factor_enabled: admin.two_factor_enabled,
          two_factor_secret: admin.two_factor_secret,
          backup_codes: admin.backup_codes,
          ip_allowlist: admin.ip_allowlist,
          session_timeout_minutes: 120,
          failed_login_attempts: admin.failed_login_attempts || 0,
          locked_until: admin.locked_until,
          created_at: admin.created_at
        })
        .select();

      if (!insertError) {
        console.log(`✅ Migrated admin: ${admin.email}`);
      } else if (insertError.code === '23505') {
        console.log(`⏭️ Admin already migrated: ${admin.email}`);
      } else {
        console.error(`❌ Failed to migrate ${admin.email}:`, insertError);
      }
    }

    // 3. Archive old admin tables (don't delete yet)
    console.log('\n📦 Archiving old admin tables...');
    // Note: Table archiving would need to be done via direct SQL as Supabase doesn't support DDL via RPC
    console.log('Note: To archive old admin tables, run the following SQL manually:');
    console.log(`
      ALTER TABLE IF EXISTS public.admin_users RENAME TO admin_users_archived;
      ALTER TABLE IF EXISTS public.admin_sessions RENAME TO admin_sessions_archived;
      ALTER TABLE IF EXISTS public.admin_actions RENAME TO admin_actions_archived;
    `);

    console.log('\n✅ Migration complete!');
    console.log('Next steps:');
    console.log('1. Test admin login with unified auth');
    console.log('2. Verify JWT contains admin claims');
    console.log('3. Remove AdminAuthContext from codebase');
    console.log('4. After 30 days, drop archived tables');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAdminUsers();