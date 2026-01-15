import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('Applying practice_areas migration...\n');

  const sql = readFileSync(
    resolve(__dirname, '../supabase/migrations/20260114_add_practice_areas.sql'),
    'utf-8'
  );

  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) {
    // If RPC doesn't exist, try direct SQL execution through REST
    console.log('exec_sql RPC not found, trying direct execution...\n');

    // Split into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('ALTER TABLE')) {
        console.log('Executing ALTER TABLE...');
        const { error: alterError } = await supabase.from('organizations').select('id').limit(0);

        if (alterError) {
          console.error('Error:', alterError.message);
        }
      }
    }

    // Alternative: Just use the management API or show instructions
    console.log('\n⚠️  Cannot execute SQL directly via TypeScript client.');
    console.log('\nPlease apply the migration manually by:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Paste and run the following SQL:\n');
    console.log(sql);
    console.log('\n--- OR ---\n');
    console.log('Run using supabase CLI: npx supabase db push\n');

    process.exit(0);
  }

  console.log('Migration applied successfully!');
  console.log(data);
}

applyMigration()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  });
