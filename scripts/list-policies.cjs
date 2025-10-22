const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://puemqhpqxgrvrukyrfkm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZW1xaHBxeGdydnJ1a3lyZmttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMTk1MiwiZXhwIjoyMDcwNDg3OTUyfQ.GZiPMAq6RGMUDQYW9I1AwlcuDyRUXwn_hoLkQgCh8Uw';

async function listPolicies() {
  console.log('📋 Listing all RLS policies for submissions table...\n');

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Try to select from pg_policies
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'submissions');

  if (error) {
    console.log('❌ Cannot read pg_policies:', error.message);
    console.log('\nTrying direct PostgREST query to information_schema...\n');

    // Try querying via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/pg_policies?tablename=eq.submissions&select=*`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });

    if (!response.ok) {
      console.log('❌ Still failed:', response.status, response.statusText);
      console.log('\nIt looks like pg_policies is not exposed via the REST API.');
      console.log('\n⚠️  We need to check the Supabase Dashboard directly.');
      console.log('Go to: https://supabase.com/dashboard/project/puemqhpqxgrvrukyrfkm/auth/policies');
      console.log('\nLook for the "submissions" table and check if "submissions_insert_policy" exists.');
    } else {
      const policies = await response.json();
      console.log('Policies found:', JSON.stringify(policies, null, 2));
    }
  } else {
    console.log('Policies found:');
    console.log(JSON.stringify(data, null, 2));
  }
}

listPolicies();
