import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function linkNotice() {
  // Get Westminster department
  const { data: dept, error: deptError } = await supabase
    .from('departments')
    .select('*')
    .eq('slug', 'licensing')
    .single();

  if (deptError) {
    console.error('Department error:', deptError);
    // Try to get any department
    const { data: anyDept } = await supabase
      .from('departments')
      .select('*')
      .limit(1)
      .single();

    if (anyDept) {
      console.log('Using first department:', anyDept.id, anyDept.name);
      const { error } = await supabase
        .from('notices')
        .update({
          department_id: anyDept.id
        })
        .eq('id', '550e8400-e29b-41d4-a716-446655440001');

      if (!error) {
        console.log('Successfully linked notice to', anyDept.name);
      }
    }
    return;
  }

  console.log('Found department:', dept.id);

  // Update notice to link to department (without council_id)
  const { error } = await supabase
    .from('notices')
    .update({
      department_id: dept.id
    })
    .eq('id', '550e8400-e29b-41d4-a716-446655440001');

  if (error) {
    console.error('Error linking notice:', error);
  } else {
    console.log('Successfully linked The Pilot Inn to Westminster Licensing Department');
  }
}

linkNotice().then(() => process.exit(0));