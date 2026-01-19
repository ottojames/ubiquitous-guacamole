import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  const migrations = [
    '20260120000001_admin_users.sql',
    '20260120000002_admin_sessions.sql',
    '20260120000003_admin_actions_audit.sql'
  ];

  console.log('🔧 Running Admin Migrations...');
  console.log('─'.repeat(50));

  for (const migration of migrations) {
    const filePath = path.join(process.cwd(), 'supabase', 'migrations', migration);

    try {
      console.log(`\n📋 Running migration: ${migration}`);

      // Read the SQL file
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

      if (error) {
        // Try running directly
        // Since we can't execute arbitrary SQL via Supabase client, we'll check if tables exist

        // Check if admin_users table exists
        const { error: checkError } = await supabase
          .from('admin_users')
          .select('id')
          .limit(0);

        if (checkError && checkError.code === 'PGRST205') {
          console.log(`   ❌ Table doesn't exist, migration needed`);
          console.log(`   Please run manually: psql < ${filePath}`);
        } else {
          console.log(`   ✅ Table already exists, skipping`);
        }
      } else {
        console.log(`   ✅ Migration applied successfully`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  // Check if tables were created
  console.log('\n📊 Verifying tables...');

  const tables = ['admin_users', 'admin_sessions', 'admin_actions'];
  let allExist = true;

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(0);

    if (error && error.code === 'PGRST205') {
      console.log(`   ❌ ${table} - NOT FOUND`);
      allExist = false;
    } else {
      console.log(`   ✅ ${table} - exists`);
    }
  }

  if (!allExist) {
    console.log('\n⚠️  Some tables are missing.');
    console.log('Please run the migrations manually using Supabase CLI:');
    console.log('  npx supabase migration up');
    console.log('\nOr apply directly to the database.');
  } else {
    console.log('\n✅ All admin tables exist!');
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });