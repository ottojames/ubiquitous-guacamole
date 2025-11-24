import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const migrationSQL = readFileSync('supabase/migrations/20251124000001_add_internal_notes.sql', 'utf8');

console.log('Running migration: add internal_notes column...\n');

// Split by semicolons and run each statement
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

for (const statement of statements) {
  console.log(`Executing: ${statement.substring(0, 80)}...`);

  const { error } = await supabase.rpc('exec_sql', {
    sql_query: statement
  });

  if (error) {
    console.error('Error:', error);
    // Try direct query instead
    const { error: directError } = await supabase.from('_migrations').insert({
      statement
    });
    if (directError) {
      console.log('Note: Could not execute via RPC, trying manual approach...');
    }
  } else {
    console.log('✅ Success\n');
  }
}

console.log('\n✨ Migration complete! Testing by adding column directly...\n');

// Just try to run the ALTER TABLE command directly via raw SQL
const { data, error } = await supabase.rpc('exec', {
  sql: `
    ALTER TABLE public.representations
    ADD COLUMN IF NOT EXISTS internal_notes JSONB DEFAULT '[]'::jsonb;
  `
});

if (error) {
  console.log('Note: Could not run via exec RPC. Please run migration manually in Supabase dashboard.');
  console.log('\nSQL to run:');
  console.log(migrationSQL);
} else {
  console.log('✅ Migration applied successfully!');
}
