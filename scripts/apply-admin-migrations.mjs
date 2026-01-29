import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Extract project ID from URL
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectId) {
  console.error('❌ Could not extract project ID from Supabase URL');
  process.exit(1);
}

console.log('🔧 Applying Admin Migrations to Supabase');
console.log(`📍 Project: ${projectId}`);
console.log('─'.repeat(50));

// Since we can't execute raw SQL through the client library,
// we'll create the tables using the Supabase client by executing
// the individual table creation statements

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function createAdminTables() {
  try {
    // First, check if the tables already exist
    const { error: checkError1 } = await supabase
      .from('admin_users')
      .select('id')
      .limit(0);

    if (!checkError1) {
      console.log('✅ admin_users table already exists');
      return true;
    }

    console.log('⚠️  Admin tables not found in database');
    console.log('');
    console.log('The admin tables need to be created manually.');
    console.log('');
    console.log('Please run the following command with your database credentials:');
    console.log('');
    console.log('Using Supabase CLI (recommended):');
    console.log('  npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.' + projectId + '.supabase.co:5432/postgres"');
    console.log('');
    console.log('Or using psql directly:');
    console.log('  PGPASSWORD="[YOUR-PASSWORD]" psql \\');
    console.log('    -h db.' + projectId + '.supabase.co \\');
    console.log('    -p 5432 -U postgres -d postgres \\');
    console.log('    -f supabase/migrations/20260120000001_admin_users.sql');
    console.log('');
    console.log('Then run the other two migrations:');
    console.log('  - 20260120000002_admin_sessions.sql');
    console.log('  - 20260120000003_admin_actions_audit.sql');
    console.log('');
    console.log('After running the migrations, you can run the create-super-admin.ts script.');

    return false;
  } catch (error) {
    console.error('Error checking tables:', error);
    return false;
  }
}

async function main() {
  const success = await createAdminTables();

  if (success) {
    console.log('\n✅ Admin infrastructure is ready!');
    console.log('You can now run: npx tsx scripts/create-super-admin.ts');
  } else {
    console.log('\n❌ Manual migration required');
    process.exit(1);
  }
}

main();