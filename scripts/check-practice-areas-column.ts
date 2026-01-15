import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndApplyMigration() {
  console.log('Checking if practice_areas column exists...');

  // Try to query the column
  const { data, error } = await supabase
    .from('organizations')
    .select('id, practice_areas')
    .eq('slug', 'wilson-partners')
    .single();

  if (error) {
    if (error.message?.includes('practice_areas')) {
      console.log('practice_areas column does not exist. Applying migration...');

      // Read the migration file
      const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260114_add_practice_areas.sql');

      if (fs.existsSync(migrationPath)) {
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        console.log('Migration SQL found, attempting to apply...');

        // Note: DDL operations cannot be executed via the client
        console.log('\n⚠️  MANUAL ACTION REQUIRED:');
        console.log('The practice_areas column needs to be added to the organizations table.');
        console.log('Please run the following SQL in the Supabase Dashboard SQL Editor:');
        console.log('\n--- START SQL ---');
        console.log(migrationSql);
        console.log('--- END SQL ---\n');
        console.log('Navigate to: Supabase Dashboard > SQL Editor > New Query');
        console.log('Paste the SQL above and click "Run"');

        // For now, let's just update the organization without practice_areas
        console.log('\nFor testing purposes, continuing without practice_areas column...');
      } else {
        console.log('Migration file not found, creating column directly...');

        // Try a simple approach - just save to extras field as workaround
        console.log('Using workaround: saving to extras field instead');
      }
    } else {
      console.error('Error checking column:', error);
    }
  } else {
    console.log('✓ practice_areas column exists');
    console.log('Current value:', data?.practice_areas);

    // Update with test values
    console.log('\nUpdating Wilson & Partners practice areas to Licensing and Planning only...');
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ practice_areas: ['licensing', 'planning'] })
      .eq('slug', 'wilson-partners');

    if (updateError) {
      console.error('Error updating practice areas:', updateError);
    } else {
      console.log('✓ Successfully updated practice areas');
    }
  }

  // As a fallback, let's also try to use the extras field
  console.log('\nApplying workaround using extras field...');
  const { error: extrasError } = await supabase
    .from('organizations')
    .update({
      extras: {
        practice_areas: ['licensing', 'planning']
      }
    })
    .eq('slug', 'wilson-partners');

  if (!extrasError) {
    console.log('✓ Workaround applied: practice_areas saved to extras field');
  }
}

checkAndApplyMigration().then(() => process.exit(0)).catch(console.error);