import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addColumn() {
  console.log('🔧 Adding internal_notes column to representations table...\n');

  const sql = `
    ALTER TABLE public.representations
    ADD COLUMN IF NOT EXISTS internal_notes JSONB DEFAULT '[]'::jsonb;

    CREATE INDEX IF NOT EXISTS idx_representations_internal_notes
    ON public.representations USING gin(internal_notes);
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error:', error);
      console.log('\n📋 Please run this SQL manually in your Supabase dashboard:');
      console.log(sql);
      process.exit(1);
    }

    console.log('✅ Column added successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
    console.log('\n📋 Please run this SQL manually in your Supabase dashboard:');
    console.log(sql);
  }
}

addColumn();
