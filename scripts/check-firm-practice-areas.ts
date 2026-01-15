import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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

async function checkAndUpdateFirmPracticeAreas() {
  console.log('Checking firm practice areas...\n');

  // Get all firms
  const { data: firms, error } = await supabase
    .from('organizations')
    .select('id, slug, name, practice_areas, type')
    .eq('type', 'firm');

  if (error) {
    console.error('Error fetching firms:', error);
    return;
  }

  if (!firms || firms.length === 0) {
    console.log('No firms found in database');
    return;
  }

  console.log(`Found ${firms.length} firm(s):\n`);

  for (const firm of firms) {
    console.log(`Firm: ${firm.name} (${firm.slug})`);
    console.log(`  Practice Areas: ${firm.practice_areas ? JSON.stringify(firm.practice_areas) : 'NONE'}`);

    // If no practice areas set, set default ones for testing
    if (!firm.practice_areas || firm.practice_areas.length === 0) {
      console.log('  → Setting default practice areas: licensing, planning');

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ practice_areas: ['licensing', 'planning'] })
        .eq('id', firm.id);

      if (updateError) {
        console.error('  ✗ Failed to update:', updateError.message);
      } else {
        console.log('  ✓ Updated successfully');
      }
    } else {
      console.log('  ✓ Already configured');
    }
    console.log('');
  }
}

checkAndUpdateFirmPracticeAreas()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  });
