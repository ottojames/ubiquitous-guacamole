/**
 * Add representations to demo notices for showcase video
 * Adds varying numbers of representations to make the demo realistic
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEMO_NAMES = [
  'Sarah Thompson', 'Michael Chen', 'Emma Wilson', 'David Roberts',
  'Lucy Martinez', 'James Anderson', 'Sophie Brown', 'Oliver Taylor',
  'Charlotte Davies', 'William Evans', 'Amelia Johnson', 'George Smith',
  'Isabella White', 'Henry Jones', 'Olivia Moore', 'Thomas Wright'
];

const DEMO_ADDRESSES = [
  '12 Victoria Street, Westminster, SW1A 1AA',
  '45 Parliament Street, Westminster, SW1A 2AB',
  '78 Whitehall, Westminster, SW1A 2BX',
  '23 Downing Street, Westminster, SW1A 2AA',
  '56 Horse Guards Road, Westminster, SW1A 2HQ',
  '89 The Mall, Westminster, SW1A 1BA',
  '34 Birdcage Walk, Westminster, SW1H 9JJ',
  '67 Great Smith Street, Westminster, SW1P 3BL',
  '91 Millbank, Westminster, SW1P 4QP',
  '15 Abingdon Street, Westminster, SW1P 3JX'
];

const OBJECTION_REASONS = [
  'Concerned about increased noise levels affecting residential properties',
  'Parking issues in the area are already significant',
  'Public safety concerns during late night hours',
  'Impact on local community character',
  'Potential for anti-social behaviour',
  'Already sufficient licensed premises in the area',
  'Concerns about litter and street cleanliness',
  'Effect on property values in the neighbourhood'
];

const SUPPORT_REASONS = [
  'Will provide employment opportunities for local residents',
  'Adds to the cultural vitality of the area',
  'Well-managed premises with good track record',
  'Support local business development',
  'Enhances the local economy',
  'Provides needed amenity for residents'
];

async function createRepresentation(noticeId, type, index) {
  const name = DEMO_NAMES[index % DEMO_NAMES.length];
  const address = DEMO_ADDRESSES[index % DEMO_ADDRESSES.length];
  const reasons = type === 'objection' ? OBJECTION_REASONS : SUPPORT_REASONS;
  const representationText = reasons[index % reasons.length];

  const { data, error } = await supabase
    .from('representations')
    .insert({
      notice_id: noticeId,
      type: type,
      representor_name: name,
      representor_email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      representor_address: { raw: address },
      representation_text: representationText,
      grounds: type === 'objection' ? ['prevention_of_public_nuisance'] : null,
      status: 'submitted',
      submitted_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function addRepresentationsToNotice(noticeName, objectionCount, supportCount) {
  console.log(`\n📍 Looking for notice: ${noticeName}`);

  // Search for the notice using JSONB query
  const { data: notices, error: searchError } = await supabase
    .from('notices')
    .select('id, premises, representation_deadline')
    .ilike('premises->>name', `%${noticeName}%`)
    .limit(5);

  if (searchError) {
    console.error('❌ Search error:', searchError);
    return;
  }

  if (!notices || notices.length === 0) {
    console.error(`❌ Notice not found: ${noticeName}`);
    return;
  }

  const notice = notices[0];
  console.log(`✅ Found: ${notice.premises.name} (${notice.id})`);

  // Extend deadline to 28 days from now if it's in the past
  const currentDeadline = new Date(notice.representation_deadline);
  const now = new Date();
  const futureDeadline = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

  if (currentDeadline < now) {
    console.log(`   ⏰ Extending deadline from ${currentDeadline.toISOString().split('T')[0]} to ${futureDeadline.toISOString().split('T')[0]}`);
    const { error: updateError } = await supabase
      .from('notices')
      .update({ representation_deadline: futureDeadline.toISOString() })
      .eq('id', notice.id);

    if (updateError) {
      console.error('❌ Error updating deadline:', updateError);
      return;
    }
  }

  // Check existing representations
  const { data: existing, error: countError } = await supabase
    .from('representations')
    .select('id, type')
    .eq('notice_id', notice.id);

  if (countError) {
    console.error('❌ Error checking existing reps:', countError);
    return;
  }

  const existingObjections = existing?.filter(r => r.type === 'objection').length || 0;
  const existingSupport = existing?.filter(r => r.type === 'support').length || 0;

  console.log(`   Current: ${existingObjections} objections, ${existingSupport} support`);
  console.log(`   Target: ${objectionCount} objections, ${supportCount} support`);

  // Delete all existing representations first
  if (existing && existing.length > 0) {
    console.log(`   🗑️  Deleting ${existing.length} existing representations...`);
    const { error: deleteError } = await supabase
      .from('representations')
      .delete()
      .eq('notice_id', notice.id);

    if (deleteError) {
      console.error('❌ Error deleting representations:', deleteError);
      return;
    }
  }

  // Add objections
  console.log(`   ➕ Adding ${objectionCount} objections...`);
  for (let i = 0; i < objectionCount; i++) {
    await createRepresentation(notice.id, 'objection', i);
  }

  // Add support
  console.log(`   ➕ Adding ${supportCount} support...`);
  for (let i = 0; i < supportCount; i++) {
    await createRepresentation(notice.id, 'support', i + objectionCount);
  }

  // Verify final counts
  const { data: final } = await supabase
    .from('representations')
    .select('type')
    .eq('notice_id', notice.id);

  const finalObjections = final?.filter(r => r.type === 'objection').length || 0;
  const finalSupport = final?.filter(r => r.type === 'support').length || 0;

  console.log(`   ✅ Final: ${finalObjections} objections, ${finalSupport} support (total: ${final?.length})`);
}

async function main() {
  console.log('🚀 Adding representations to demo notices...\n');

  // Add varying numbers to make it realistic
  await addRepresentationsToNotice('The Craft Brewery', 5, 2);      // 7 total, 5 objections
  await addRepresentationsToNotice('Artisan Wine Bar', 3, 4);       // 7 total, 3 objections
  await addRepresentationsToNotice('Victoria Wine Bar', 6, 1);      // 7 total, 6 objections

  console.log('\n✅ All representations added successfully!');
}

main().catch(console.error);
