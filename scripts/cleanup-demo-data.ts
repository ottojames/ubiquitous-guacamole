/**
 * Cleanup Demo Data Script
 * Removes demo/test notices and organizations from the database
 *
 * Run: npx tsx scripts/cleanup-demo-data.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Demo notice IDs to delete
const DEMO_NOTICE_IDS = [
  '32c8b345-4af6-4343-bf1b-b4c495419fca', // The Test Pub
  '72fb8890-b320-4eee-aff6-1e21c608bd40', // The Test Pub
  'f40b994b-0d48-4fa6-90b9-01d2fa25095a', // The Red Lion
];

// Demo organization slugs to check (but NOT delete - need to verify first)
const DEMO_ORG_SLUGS = [
  'riverside-council',
  'riverside-city-council',
  'westminster-council',
  'wilson-partners',
  'thompson-legal',
  'sampletonborough-council', // Different from sampleton-borough-council
];

async function cleanup() {
  console.log('Starting demo data cleanup...\n');

  // 1. Delete demo notices
  console.log('=== Deleting Demo Notices ===');
  for (const noticeId of DEMO_NOTICE_IDS) {
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', noticeId);

    if (error) {
      console.log(`  ❌ Failed to delete notice ${noticeId}: ${error.message}`);
    } else {
      console.log(`  ✅ Deleted notice ${noticeId}`);
    }
  }

  // 2. Check for demo organizations
  console.log('\n=== Checking Demo Organizations ===');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, slug, name, type')
    .in('slug', DEMO_ORG_SLUGS);

  if (orgError) {
    console.log(`  ❌ Error fetching organizations: ${orgError.message}`);
  } else if (orgs && orgs.length > 0) {
    console.log('  Found demo organizations:');
    for (const org of orgs) {
      console.log(`    - ${org.name} (${org.slug}) [${org.type}]`);

      // Delete the demo organization (will cascade to departments, memberships, etc.)
      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', org.id);

      if (deleteError) {
        console.log(`      ❌ Failed to delete: ${deleteError.message}`);
      } else {
        console.log(`      ✅ Deleted`);
      }
    }
  } else {
    console.log('  No demo organizations found');
  }

  // 3. Verify remaining data
  console.log('\n=== Verifying Remaining Data ===');

  const { data: remainingNotices } = await supabase
    .from('notices')
    .select('id, applicant_name, premises_name')
    .limit(10);

  console.log(`  Notices remaining: ${remainingNotices?.length || 0}`);
  remainingNotices?.forEach(n => {
    console.log(`    - ${n.premises_name || n.applicant_name || n.id}`);
  });

  const { data: remainingOrgs } = await supabase
    .from('organizations')
    .select('id, slug, name, type')
    .limit(20);

  console.log(`\n  Organizations remaining: ${remainingOrgs?.length || 0}`);
  remainingOrgs?.forEach(o => {
    console.log(`    - ${o.name} (${o.slug}) [${o.type}]`);
  });

  // 4. Check for orphaned representations
  console.log('\n=== Checking Representations ===');
  const { data: reps } = await supabase
    .from('representations')
    .select('id, notice_id, submitter_name')
    .limit(10);

  console.log(`  Representations: ${reps?.length || 0}`);
  if (reps && reps.length > 0) {
    for (const rep of reps) {
      // Check if the notice still exists
      const { data: notice } = await supabase
        .from('notices')
        .select('id')
        .eq('id', rep.notice_id)
        .single();

      if (!notice) {
        console.log(`    ⚠️  Orphaned representation ${rep.id} (notice ${rep.notice_id} doesn't exist)`);
        // Delete orphaned representation
        await supabase.from('representations').delete().eq('id', rep.id);
        console.log(`       ✅ Deleted orphaned representation`);
      } else {
        console.log(`    - ${rep.submitter_name} on notice ${rep.notice_id}`);
      }
    }
  }

  console.log('\n✅ Cleanup complete!');
}

cleanup().catch(console.error);
