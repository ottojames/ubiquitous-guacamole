#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function verifyCouncilPortalData() {
  console.log('='.repeat(70));
  console.log('COUNCIL PORTAL DATA VERIFICATION');
  console.log('='.repeat(70));
  console.log('');

  // 1. Check Sampleton Borough Council exists
  console.log('1. CHECKING SAMPLETON BOROUGH COUNCIL...');
  const { data: sampletonOrg, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .ilike('name', '%sampleton%')
    .single();

  if (orgError || !sampletonOrg) {
    console.log('   ❌ Sampleton Borough Council NOT FOUND');
    console.log('   Error:', orgError?.message);
    return;
  }

  console.log(`   ✓ Found: ${sampletonOrg.name}`);
  console.log(`   ✓ ID: ${sampletonOrg.id}`);
  console.log(`   ✓ Slug: ${sampletonOrg.slug}`);
  console.log('');

  // 2. Check Licensing Department
  console.log('2. CHECKING LICENSING DEPARTMENT...');
  const { data: licensingDept, error: deptError } = await supabase
    .from('departments')
    .select('*')
    .eq('organization_id', sampletonOrg.id)
    .eq('type', 'licensing')
    .single();

  if (deptError || !licensingDept) {
    console.log('   ❌ Licensing Department NOT FOUND');
    console.log('   Error:', deptError?.message);
    return;
  }

  console.log(`   ✓ Found: ${licensingDept.name}`);
  console.log(`   ✓ ID: ${licensingDept.id}`);
  console.log(`   ✓ Slug: ${licensingDept.slug}`);
  console.log('');

  // 3. Check notices for this department
  console.log('3. CHECKING NOTICES DATA...');
  const { data: notices, error: noticesError } = await supabase
    .from('notices')
    .select('id, title, status, created_at')
    .eq('department_id', licensingDept.id)
    .limit(10);

  if (noticesError) {
    console.log('   ❌ Error fetching notices:', noticesError.message);
  } else {
    console.log(`   ✓ Found ${notices?.length || 0} notices`);
    if (notices && notices.length > 0) {
      console.log('   Sample notices:');
      notices.slice(0, 3).forEach(n => {
        console.log(`     - ${n.title.substring(0, 50)}... (${n.status})`);
      });
    }
  }
  console.log('');

  // 4. Check representations
  console.log('4. CHECKING REPRESENTATIONS...');
  const { data: representations, error: repsError } = await supabase
    .from('representations')
    .select('id, notice_id, created_at')
    .limit(10);

  if (repsError) {
    console.log('   ❌ Error fetching representations:', repsError.message);
  } else {
    console.log(`   ✓ Found ${representations?.length || 0} representations`);
  }
  console.log('');

  // 5. Check internal comments
  console.log('5. CHECKING INTERNAL COMMENTS...');
  const { data: comments, error: commentsError } = await supabase
    .from('internal_comments')
    .select('id, representation_id, created_at')
    .limit(10);

  if (commentsError) {
    console.log('   ❌ Error fetching internal comments:', commentsError.message);
  } else {
    console.log(`   ✓ Found ${comments?.length || 0} internal comments`);
  }
  console.log('');

  // 6. Check audit logs
  console.log('6. CHECKING AUDIT LOGS...');
  const { data: auditLogs, error: auditError } = await supabase
    .from('audit_actions')
    .select('id, action_type, created_at')
    .eq('department_id', licensingDept.id)
    .limit(10);

  if (auditError) {
    console.log('   ❌ Error fetching audit logs:', auditError.message);
  } else {
    console.log(`   ✓ Found ${auditLogs?.length || 0} audit entries`);
    if (auditLogs && auditLogs.length > 0) {
      console.log('   Recent actions:');
      auditLogs.slice(0, 5).forEach(log => {
        console.log(`     - ${log.action_type}`);
      });
    }
  }
  console.log('');

  // 7. Dashboard stats simulation
  console.log('7. SIMULATING DASHBOARD STATS...');
  const { count: totalNotices } = await supabase
    .from('notices')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', licensingDept.id);

  const { count: publishedNotices } = await supabase
    .from('notices')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', licensingDept.id)
    .eq('status', 'published');

  const { count: draftNotices } = await supabase
    .from('notices')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', licensingDept.id)
    .eq('status', 'draft');

  console.log(`   Total Notices: ${totalNotices || 0}`);
  console.log(`   Published: ${publishedNotices || 0}`);
  console.log(`   Drafts: ${draftNotices || 0}`);
  console.log('');

  // 8. Check for test users
  console.log('8. CHECKING TEST USERS...');
  const { data: memberships, error: memberError } = await supabase
    .from('department_memberships')
    .select('user_id, role')
    .eq('department_id', licensingDept.id);

  if (memberError) {
    console.log('   ❌ Error fetching memberships:', memberError.message);
  } else {
    console.log(`   ✓ Found ${memberships?.length || 0} department members`);
    if (memberships && memberships.length > 0) {
      console.log('   Note: Cannot display user emails via service role key for security');
    }
  }
  console.log('');

  console.log('='.repeat(70));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Organization: ${sampletonOrg.name} (${sampletonOrg.slug})`);
  console.log(`Department: ${licensingDept.name} (${licensingDept.slug})`);
  console.log(`Dashboard URL: /c/${sampletonOrg.slug}/${licensingDept.slug}/dashboard`);
  console.log('');
  console.log('Data Status:');
  console.log(`  Notices: ${totalNotices || 0}`);
  console.log(`  Representations: ${representations?.length || 0}`);
  console.log(`  Internal Comments: ${comments?.length || 0}`);
  console.log(`  Audit Logs: ${auditLogs?.length || 0}`);
  console.log(`  Members: ${memberships?.length || 0}`);
  console.log('');
  console.log('ISSUE: Cannot verify dashboard widgets without authenticated session');
  console.log('       The widgets may show zeros if they rely on RLS policies');
  console.log('       that filter by authenticated user role.');
  console.log('='.repeat(70));
}

verifyCouncilPortalData().catch(console.error);
