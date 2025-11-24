/**
 * Apply internal_notes migration directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 Applying internal_notes migration...\n');

async function applyMigration() {
  try {
    // First check if column already exists by trying to select it
    console.log('Checking if internal_notes column exists...');
    const { data: testData, error: testError } = await supabase
      .from('representations')
      .select('internal_notes')
      .limit(1);

    if (!testError) {
      console.log('✅ Column already exists! Migration not needed.\n');
      return true;
    }

    console.log('Column does not exist, adding it via direct Supabase client...\n');

    // Use Supabase client to add the column
    // Since we can't run DDL directly, we'll need to use a function or approach this differently

    console.log('⚠️  Cannot apply DDL via Supabase client directly.');
    console.log('\nPlease run this SQL in your Supabase Dashboard:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/puemqhpqxgrvrukyrfkm/sql/new');
    console.log('2. Paste and run:\n');
    console.log('ALTER TABLE public.representations');
    console.log("ADD COLUMN IF NOT EXISTS internal_notes JSONB DEFAULT '[]'::jsonb;");
    console.log('\nCREATE INDEX IF NOT EXISTS idx_representations_internal_notes');
    console.log('ON public.representations USING gin(internal_notes);\n');

    return false;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

applyMigration();
