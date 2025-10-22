const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'https://puemqhpqxgrvrukyrfkm.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZW1xaHBxeGdydnJ1a3lyZmttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMTk1MiwiZXhwIjoyMDcwNDg3OTUyfQ.GZiPMAq6RGMUDQYW9I1AwlcuDyRUXwn_hoLkQgCh8Uw';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔧 Applying RLS migration for public submissions...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251021130000_public_submissions.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split into individual statements (crude but effective)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s !== 'COMMENT ON POLICY');

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt || stmt.length < 10) continue;

    const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });

      if (error) {
        // Try direct approach if RPC doesn't exist
        console.log(`   ⚠️  RPC failed, trying direct execution...`);

        // Use the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({ sql_query: stmt + ';' })
        });

        if (!response.ok) {
          console.log(`   ❌ Failed: ${error.message || response.statusText}`);
          errorCount++;
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);

  if (errorCount === 0) {
    console.log(`\n✨ Migration applied successfully!`);
    console.log(`\n🧪 Testing anonymous submission...`);
    await testAnonymousSubmission();
  } else {
    console.log(`\n⚠️  Some statements failed. You may need to run them manually in the Supabase SQL Editor.`);
  }
}

async function testAnonymousSubmission() {
  // Create an anonymous client (no auth)
  const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZW1xaHBxeGdydnJ1a3lyZmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTE5NTIsImV4cCI6MjA3MDQ4Nzk1Mn0.nL0AW6pWGGfpS64mKd4wuqVfudOtiW4M7_wydIjzMsc', {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Get a test department
  const { data: depts } = await anonClient
    .from('departments')
    .select('id')
    .eq('type', 'licensing')
    .limit(1);

  if (!depts || depts.length === 0) {
    console.log('⚠️  No departments found for testing');
    return;
  }

  const testData = {
    target_department_id: depts[0].id,
    source_organization_id: null,
    reference_number: `TEST-${Date.now()}`,
    notice_type: 'licensing-premises-new',
    notice_data: { test: true },
    firm_message: 'Test anonymous submission',
    submitted_by: null,
    status: 'new'
  };

  const { data, error } = await anonClient
    .from('submissions')
    .insert(testData)
    .select();

  if (error) {
    console.log(`❌ Test FAILED: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    console.log(`\n⚠️  The RLS policy may not be applied correctly.`);
  } else {
    console.log(`✅ Test PASSED: Anonymous submission successful!`);
    console.log(`   Submission ID: ${data[0].id}`);

    // Clean up test submission
    await supabase.from('submissions').delete().eq('id', data[0].id);
    console.log(`   Test submission cleaned up.`);
  }
}

applyMigration().catch(console.error);
