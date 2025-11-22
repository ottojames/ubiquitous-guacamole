#!/usr/bin/env tsx
/**
 * Cleanup Test Data Script
 *
 * Removes test/sample notices from database, keeping only showcase demo data
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupTestData() {
  console.log('🧹 Starting cleanup of test data...\n');

  // Step 1: Fetch test notices for backup
  console.log('📦 Backing up test notices...');
  const { data: testNotices, error: fetchError } = await supabase
    .from('notices')
    .select('*')
    .or(
      `premises->>name.ilike.%sample%,premises->>name.ilike.%test%,notice_type.in.(Premises Licence,licensing_premises_new_v1)`
    );

  if (fetchError) {
    console.error('❌ Failed to fetch test notices:', fetchError);
    return;
  }

  console.log(`   Found ${testNotices?.length || 0} test notices to remove`);

  // Save backup
  if (testNotices && testNotices.length > 0) {
    const backupPath = `./data/backup-test-notices-${Date.now()}.json`;
    fs.mkdirSync('./data', { recursive: true });
    fs.writeFileSync(backupPath, JSON.stringify(testNotices, null, 2));
    console.log(`   ✅ Backup saved to ${backupPath}\n`);
  }

  // Step 2: Delete test notices
  console.log('🗑️  Deleting test notices...');
  const { error: deleteError } = await supabase
    .from('notices')
    .delete()
    .or(
      `premises->>name.ilike.%sample%,premises->>name.ilike.%test%,notice_type.in.(Premises Licence,licensing_premises_new_v1)`
    );

  if (deleteError) {
    console.error('❌ Failed to delete test notices:', deleteError);
    return;
  }

  console.log('   ✅ Test notices deleted\n');

  // Step 3: Verify remaining notices
  console.log('📊 Verifying remaining notices...');
  const { data: remaining, error: countError } = await supabase
    .from('notices')
    .select('id, premises, notice_type, status')
    .order('created_at', { ascending: false });

  if (countError) {
    console.error('❌ Failed to count remaining notices:', countError);
    return;
  }

  console.log(`   Total remaining notices: ${remaining?.length || 0}`);

  // Group by type
  const byType = (remaining || []).reduce((acc: Record<string, number>, n: any) => {
    acc[n.notice_type] = (acc[n.notice_type] || 0) + 1;
    return acc;
  }, {});

  console.log('\n   Breakdown by type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  // Group by status
  const byStatus = (remaining || []).reduce((acc: Record<string, number>, n: any) => {
    acc[n.status] = (acc[n.status] || 0) + 1;
    return acc;
  }, {});

  console.log('\n   Breakdown by status:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  console.log('\n✨ Cleanup complete!\n');
}

cleanupTestData()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
