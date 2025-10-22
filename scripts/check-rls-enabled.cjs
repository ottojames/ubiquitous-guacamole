const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://puemqhpqxgrvrukyrfkm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZW1xaHBxeGdydnJ1a3lyZmttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMTk1MiwiZXhwIjoyMDcwNDg3OTUyfQ.GZiPMAq6RGMUDQYW9I1AwlcuDyRUXwn_hoLkQgCh8Uw';

async function checkRLS() {
  console.log('🔍 Checking if RLS is enabled on submissions table...\n');

  try {
    // Use Supabase's REST API to query system catalogs
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        query: `
          SELECT
            schemaname,
            tablename,
            rowsecurity
          FROM pg_tables
          WHERE tablename = 'submissions'
            AND schemaname = 'public';
        `
      })
    });

    if (!response.ok) {
      console.log('❌ Cannot query pg_tables (RPC might not exist)');
      console.log('Response:', response.status, response.statusText);

      // Try alternative: direct query to get table info
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      console.log('\nTrying alternative: Check if we can insert with service role key...\n');

      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('type', 'licensing')
        .limit(1)
        .single();

      if (!dept) {
        console.log('No test department available');
        return;
      }

      const testData = {
        target_department_id: dept.id,
        source_organization_id: null,
        reference_number: `TEST-SERVICE-${Date.now()}`,
        notice_type: 'licensing-premises-new',
        notice_data: { test: true },
        firm_message: 'Test with service role',
        submitted_by: null,
        status: 'new'
      };

      const { data, error } = await supabase
        .from('submissions')
        .insert(testData)
        .select();

      if (error) {
        console.log('❌ Even service role key failed:', error.message);
        console.log('Code:', error.code);
      } else {
        console.log('✅ Service role can insert!');
        console.log('Submission ID:', data[0]?.id);

        // Clean up
        await supabase.from('submissions').delete().eq('id', data[0].id);
        console.log('✅ Test data cleaned up\n');

        console.log('⚠️  This means RLS is blocking anonymous users but not service role.');
        console.log('⚠️  The policy might not have been created correctly.\n');
        console.log('Let me check the actual policy...');
      }
    } else {
      const result = await response.json();
      console.log('RLS Status:', result);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkRLS();
