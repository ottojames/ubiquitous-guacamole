import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPilotInn() {
  const { data: notice, error } = await supabase
    .from('notices')
    .select('*')
    .eq('id', '550e8400-e29b-41d4-a716-446655440001')
    .single();

  if (error) {
    console.error('Error fetching notice:', error);
    return;
  }

  console.log('The Pilot Inn full data:');
  console.log(JSON.stringify(notice, null, 2));

  console.log('\n\nKey fields:');
  console.log('reps_deadline:', notice.reps_deadline);
  console.log('raw_data:', notice.raw_data);
  console.log('extras:', notice.extras);

  // Check if reps_deadline is in raw_data
  if (notice.raw_data?.consultation?.repsDeadline) {
    console.log('\n✓ Found repsDeadline in raw_data.consultation:', notice.raw_data.consultation.repsDeadline);
  }
}

checkPilotInn();