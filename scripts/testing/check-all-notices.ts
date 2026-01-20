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

async function checkNotices() {
  const { data: notices, error } = await supabase
    .from('notices')
    .select('id, premises, applicant, reps_deadline, notice_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching notices:', error);
    return;
  }

  console.log('Total notices found:', notices?.length || 0);
  console.log('\nNotices in database:');
  notices?.forEach((notice, i) => {
    console.log(`\n${i + 1}. ID: ${notice.id}`);
    console.log(`   Type: ${notice.notice_type}`);
    console.log(`   Premises: ${JSON.stringify(notice.premises)}`);
    console.log(`   Applicant: ${JSON.stringify(notice.applicant)}`);
    console.log(`   Reps Deadline: ${notice.reps_deadline || 'NOT SET'}`);
    console.log(`   Created: ${notice.created_at}`);
  });
}

checkNotices();