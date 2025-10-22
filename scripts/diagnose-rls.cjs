const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://puemqhpqxgrvrukyrfkm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZW1xaHBxeGdydnJ1a3lyZmttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMTk1MiwiZXhwIjoyMDcwNDg3OTUyfQ.GZiPMAq6RGMUDQYW9I1AwlcuDyRUXwn_hoLkQgCh8Uw';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZW1xaHBxeGdydnJ1a3lyZmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTE5NTIsImV4cCI6MjA3MDQ4Nzk1Mn0.nL0AW6pWGGfpS64mKd4wuqVfudOtiW4M7_wydIjzMsc';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function diagnose() {
  console.log('🔍 Diagnosing RLS Configuration...\n');

  // Check if columns are nullable
  console.log('1️⃣ Checking column constraints...');
  const { data: columns, error: colError } = await supabase
    .from('submissions')
    .select('*')
    .limit(0);

  if (colError) {
    console.log('   ❌ Error fetching schema:', colError.message);
  } else {
    console.log('   ✅ Submissions table exists');
  }

  // Try to query pg_policies (might not work with RLS)
  console.log('\n2️⃣ Checking RLS policies...');
  try {
    // Use raw SQL query via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: `SELECT policyname, cmd, qual::text
                FROM pg_policies
                WHERE tablename = 'submissions'
                  AND schemaname = 'public'
                ORDER BY policyname`
      })
    });

    if (!response.ok) {
      console.log('   ⚠️  Cannot query policies via RPC (might not exist)');
    } else {
      const policies = await response.json();
      console.log('   Policies:', JSON.stringify(policies, null, 2));
    }
  } catch (err) {
    console.log('   ⚠️  RPC not available, trying direct PostgreSQL REST...');
  }

  // Test anonymous access to departments
  console.log('\n3️⃣ Testing anonymous read access to departments...');
  const { data: depts, error: deptError } = await anonClient
    .from('departments')
    .select('id, name')
    .eq('type', 'licensing')
    .limit(5);

  if (deptError) {
    console.log('   ❌ Failed:', deptError.message);
    console.log('   Code:', deptError.code);
  } else {
    console.log(`   ✅ Success! Found ${depts?.length || 0} departments`);
  }

  // Test anonymous INSERT to submissions
  console.log('\n4️⃣ Testing anonymous INSERT to submissions...');

  // Get a test department first
  const { data: testDept } = await anonClient
    .from('departments')
    .select('id')
    .eq('type', 'licensing')
    .limit(1)
    .single();

  if (!testDept) {
    console.log('   ⚠️  No departments available for testing');
    return;
  }

  const testSubmission = {
    target_department_id: testDept.id,
    source_organization_id: null,
    reference_number: `TEST-${Date.now()}`,
    notice_type: 'licensing-premises-new',
    notice_data: { test: true, timestamp: new Date().toISOString() },
    firm_message: 'Test anonymous submission',
    submitted_by: null,
    status: 'new'
  };

  const { data: insertData, error: insertError } = await anonClient
    .from('submissions')
    .insert(testSubmission)
    .select();

  if (insertError) {
    console.log('   ❌ INSERT FAILED:', insertError.message);
    console.log('   Code:', insertError.code);
    console.log('   Details:', insertError.details);
    console.log('   Hint:', insertError.hint);

    console.log('\n⚠️  THE RLS POLICY IS NOT APPLIED!');
    console.log('\n📋 You need to run the SQL migration in Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/puemqhpqxgrvrukyrfkm/sql/new');
    console.log('   2. Paste the SQL from apply-rls-fix.sql');
    console.log('   3. Click RUN');
  } else {
    console.log('   ✅ INSERT SUCCEEDED!');
    console.log('   Submission ID:', insertData[0]?.id);

    // Clean up
    await supabase.from('submissions').delete().eq('id', insertData[0].id);
    console.log('   ✅ Test data cleaned up');

    console.log('\n✨ RLS POLICY IS WORKING! Anonymous submissions are enabled.');
  }

  console.log('\n' + '='.repeat(70));
}

diagnose().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
