import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCouncils() {
  // Check organizations count
  const { count: orgCount, error: orgError } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true });
  
  console.log('Organizations in database:', orgCount);
  
  // Check departments count
  const { count: deptCount, error: deptError } = await supabase
    .from('departments')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'licensing');
  
  console.log('Licensing departments in database:', deptCount);
  
  // Show a few examples
  const { data: examples } = await supabase
    .from('organizations')
    .select('name')
    .limit(5);
  
  console.log('\nExample organizations:', examples?.map(o => o.name));
}

checkCouncils();
