import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function main() {
  const { data: notices } = await supabase
    .from('notices')
    .select('id, title, postcode, address, lat, lng')
    .not('postcode', 'is', null)
    .limit(15);

  console.log('Notices with postcodes:\n');
  notices?.forEach(n => {
    console.log(`- ${n.postcode}: ${n.address?.substring(0,60) || n.title?.substring(0,50)}`);
  });

  // Get unique postcodes
  const postcodes = [...new Set(notices?.map(n => n.postcode).filter(Boolean))];
  console.log('\n=== SEARCH FOR THESE POSTCODES ===');
  console.log(postcodes.join('\n'));
}

main().catch(console.error);
