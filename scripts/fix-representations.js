import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRepresentations() {
  console.log('🔍 Finding Parliament View Wine Bar notice...\n');

  // Find the notice - premises data is stored in JSONB
  const { data: notices, error: findError } = await supabase
    .from('notices')
    .select('id, premises')
    .ilike('premises->>name', '%Parliament View Wine Bar%')
    .limit(10);

  if (findError) {
    console.error('Error finding notice:', findError);
    process.exit(1);
  }

  console.log('Found notices:', notices?.length || 0);
  notices?.forEach(n => {
    console.log(`  - ${n.premises?.name} (${n.id})`);
    console.log(`    Address:`, n.premises?.address);
  });

  if (!notices || notices.length === 0) {
    console.error('\n❌ No Parliament View Wine Bar notice found');
    process.exit(1);
  }

  const noticeId = notices[0].id;
  console.log(`\n✅ Using notice ID: ${noticeId}`);

  // Delete existing representations
  console.log('\n🗑️  Deleting existing representations...');
  const { error: deleteError } = await supabase
    .from('representations')
    .delete()
    .eq('notice_id', noticeId);

  if (deleteError) {
    console.error('Error deleting representations:', deleteError);
    process.exit(1);
  }
  console.log('✅ Deleted existing representations');

  // Create 11 objections
  console.log('\n📝 Creating 11 objection representations...');
  const objections = [];
  for (let i = 1; i <= 11; i++) {
    objections.push({
      notice_id: noticeId,
      representor_name: `Resident ${i}`,
      representor_email: `resident${i}@example.com`,
      representor_address: { raw: `${i} Parliament Street, London, SW1A 2AB` },
      type: 'objection',
      representation_text: `I am writing to object to this premises licence application. My main concerns relate to the prevention of public nuisance, particularly noise disturbance from late-night operations. As a local resident, I am worried about the impact on our residential area.`,
      grounds: ['prevention_of_public_nuisance'],
      status: 'submitted',
      submitted_at: new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  const { error: objectionError } = await supabase
    .from('representations')
    .insert(objections);

  if (objectionError) {
    console.error('Error creating objections:', objectionError);
    process.exit(1);
  }
  console.log('✅ Created 11 objections');

  // Create 3 support representations
  console.log('\n📝 Creating 3 support representations...');
  const supports = [
    {
      notice_id: noticeId,
      representor_name: 'Local Business Owner',
      representor_email: 'business@example.com',
      representor_address: { raw: '15 Parliament Street, London, SW1A 2AB' },
      type: 'support',
      representation_text: `I am writing in support of this application. The proposed venue will bring economic benefits to our local area, create jobs, and provide a quality establishment for residents and visitors. I believe it will be a positive addition to our community.`,
      grounds: null,
      status: 'submitted',
      submitted_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      notice_id: noticeId,
      representor_name: 'Westminster Business Association',
      representor_email: 'wba@example.com',
      representor_address: { raw: 'Westminster Business Centre, London, SW1A 1AA' },
      type: 'support',
      representation_text: `The Westminster Business Association supports this application. We believe the proposed wine bar will enhance the local economy, attract visitors, and contribute to the vibrancy of our area while maintaining professional standards.`,
      grounds: null,
      status: 'submitted',
      submitted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      notice_id: noticeId,
      representor_name: 'City Worker',
      representor_email: 'cityworker@example.com',
      representor_address: { raw: '20 Parliament Street, London, SW1A 2AB' },
      type: 'support',
      representation_text: `As someone who works in the area, I welcome this application. The wine bar will provide a quality venue for after-work meetings and social gatherings. I believe the operators will run a responsible establishment.`,
      grounds: null,
      status: 'submitted',
      submitted_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const { error: supportError } = await supabase
    .from('representations')
    .insert(supports);

  if (supportError) {
    console.error('Error creating support representations:', supportError);
    process.exit(1);
  }
  console.log('✅ Created 3 support representations');

  // Verify counts
  console.log('\n🔍 Verifying representation counts...');
  const { data: counts } = await supabase
    .from('representations')
    .select('type')
    .eq('notice_id', noticeId);

  const objectionCount = counts?.filter(r => r.type === 'objection').length || 0;
  const supportCount = counts?.filter(r => r.type === 'support').length || 0;

  console.log(`\n✅ Final counts for Parliament View Wine Bar:`);
  console.log(`   - Objections: ${objectionCount}`);
  console.log(`   - Support: ${supportCount}`);
  console.log(`   - Total: ${objectionCount + supportCount}`);

  if (objectionCount === 11 && supportCount === 3) {
    console.log('\n🎉 SUCCESS! Representation counts now match the narration script.');
  } else {
    console.log('\n⚠️  WARNING: Counts do not match expected values (11 objections, 3 support)');
  }
}

fixRepresentations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
