/**
 * Script to add representations to notices and update deadlines for urgency testing
 *
 * This will:
 * 1. Add 8 representations to each notice (mix of objection/support)
 * 2. Update some notices to have deadlines of tomorrow for urgency
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sample objection templates
const objectionTemplates = [
  {
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@email.com',
    phone: '020 7946 0958',
    address: { street: '12 Park Lane', city: 'Westminster', postcode: 'SW1A 1AA' },
    text: 'I object to this application on the grounds of public nuisance. The proposed extended hours will cause excessive noise disturbance to nearby residents, particularly during weekends. Our street is primarily residential and the current noise levels are already problematic.',
    grounds: ['noise', 'public_nuisance']
  },
  {
    name: 'James Thompson',
    email: 'j.thompson@gmail.com',
    phone: '020 7946 0234',
    address: { street: '45 High Street', city: 'Westminster', postcode: 'SW1A 2BB' },
    text: 'This application should be refused due to concerns about crime and disorder. There have been several incidents near this establishment in recent months, and extending the operating hours will only exacerbate these issues.',
    grounds: ['crime_disorder', 'public_safety']
  },
  {
    name: 'Elizabeth Davies',
    email: 'liz.davies@hotmail.co.uk',
    phone: '020 7946 0876',
    address: { street: '8 Victoria Road', city: 'Westminster', postcode: 'SW1A 3CC' },
    text: 'I strongly object to this application. The area already suffers from anti-social behaviour and public intoxication. Granting this licence would make matters significantly worse and negatively impact the quality of life for families in the neighbourhood.',
    grounds: ['public_nuisance', 'protection_children']
  },
  {
    name: 'Robert Chen',
    email: 'robert.chen@outlook.com',
    phone: '020 7946 0445',
    address: { street: '23 Oxford Street', city: 'Westminster', postcode: 'SW1A 4DD' },
    text: 'As a local resident, I must object on grounds of inadequate parking and traffic congestion. The premises will attract additional vehicles to an already congested area, creating safety hazards and making it difficult for residents to park near their homes.',
    grounds: ['public_nuisance', 'parking']
  },
];

// Sample support templates
const supportTemplates = [
  {
    name: 'Michael Anderson',
    email: 'michael.anderson@email.com',
    phone: '020 7946 0667',
    address: { street: '67 King Street', city: 'Westminster', postcode: 'SW1A 5EE' },
    text: 'I fully support this application. This establishment has been a valuable part of our community for years and has always operated responsibly. The extended hours will provide more employment opportunities and contribute to the local economy.',
    grounds: ['economic_benefit', 'community_support']
  },
  {
    name: 'Jennifer Williams',
    email: 'jen.williams@yahoo.com',
    phone: '020 7946 0789',
    address: { street: '34 Queen Street', city: 'Westminster', postcode: 'SW1A 6FF' },
    text: 'I support this application wholeheartedly. The applicant has demonstrated a strong commitment to responsible management and community engagement. This business adds vibrancy to our area and should be allowed to expand its hours.',
    grounds: ['responsible_operation', 'community_benefit']
  },
  {
    name: 'David Taylor',
    email: 'd.taylor@btinternet.com',
    phone: '020 7946 0123',
    address: { street: '91 Church Road', city: 'Westminster', postcode: 'SW1A 7GG' },
    text: 'This is an excellent application that deserves support. The premises has always maintained high standards and the proposed changes will benefit both residents and visitors to the area. I have no concerns about noise or disturbance.',
    grounds: ['good_management', 'no_concerns']
  },
  {
    name: 'Emma Roberts',
    email: 'emma.roberts@gmail.com',
    phone: '020 7946 0556',
    address: { street: '15 Bridge Street', city: 'Westminster', postcode: 'SW1A 8HH' },
    text: 'I am writing in support of this application. The business owner has been responsive to community concerns and works hard to minimize any impact on neighbours. The extended hours will provide more choice for local residents.',
    grounds: ['community_engagement', 'positive_impact']
  },
];

function generateReferenceNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `REP-${timestamp}-${random}`;
}

async function addRepresentationsToNotice(noticeId, premisesName) {
  console.log(`\nAdding representations to: ${premisesName} (${noticeId})`);

  // Create 4 objections and 4 support representations
  const representations = [];

  for (let i = 0; i < 4; i++) {
    const objection = objectionTemplates[i];
    representations.push({
      notice_id: noticeId,
      representor_name: objection.name,
      representor_email: objection.email,
      representor_phone: objection.phone,
      representor_address: objection.address,
      type: 'objection',
      representation_text: objection.text,
      grounds: objection.grounds,
      status: 'submitted',
      reference_number: generateReferenceNumber(),
      submitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random time in last 7 days
    });
  }

  for (let i = 0; i < 4; i++) {
    const support = supportTemplates[i];
    representations.push({
      notice_id: noticeId,
      representor_name: support.name,
      representor_email: support.email,
      representor_phone: support.phone,
      representor_address: support.address,
      type: 'support',
      representation_text: support.text,
      grounds: support.grounds,
      status: 'submitted',
      reference_number: generateReferenceNumber(),
      submitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random time in last 7 days
    });
  }

  const { data, error } = await supabase
    .from('representations')
    .insert(representations)
    .select();

  if (error) {
    console.error(`  ❌ Error adding representations:`, error.message);
    return false;
  }

  console.log(`  ✅ Added ${data.length} representations (4 objections, 4 support)`);
  return true;
}

async function updateNoticeDeadlines() {
  console.log('\n📅 Updating notice deadlines for urgency testing...\n');

  // Get all published notices
  const { data: notices, error } = await supabase
    .from('notices')
    .select('id, reps_deadline')
    .eq('status', 'published')
    .limit(20);

  if (error) {
    console.error('Error fetching notices:', error);
    return;
  }

  if (!notices || notices.length === 0) {
    console.log('No published notices found');
    return;
  }

  // Update first 5 notices to have urgent deadlines
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(17, 0, 0, 0); // 5 PM tomorrow

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(17, 0, 0, 0);

  const urgentNotices = notices.slice(0, 5);

  for (let i = 0; i < urgentNotices.length; i++) {
    const notice = urgentNotices[i];
    const deadline = i < 3 ? tomorrow : dayAfterTomorrow; // First 3 tomorrow, next 2 day after

    const { error: updateError } = await supabase
      .from('notices')
      .update({ reps_deadline: deadline.toISOString() })
      .eq('id', notice.id);

    if (updateError) {
      console.error(`  ❌ Error updating ${notice.id}:`, updateError.message);
    } else {
      const noticeId = notice.id.substring(0, 8);
      console.log(`  ✅ Updated notice ${noticeId} deadline to ${deadline.toLocaleDateString()}`);
    }
  }
}

async function main() {
  console.log('🎯 Starting Representations & Urgency Script\n');
  console.log('This will:');
  console.log('  1. Add 8 representations to each notice (4 objections, 4 support)');
  console.log('  2. Update deadlines for some notices to create urgency\n');

  // First, update deadlines
  await updateNoticeDeadlines();

  // Then add representations
  console.log('\n📝 Adding representations to all notices...\n');

  const { data: notices, error } = await supabase
    .from('notices')
    .select('id')
    .eq('status', 'published')
    .limit(50);

  if (error) {
    console.error('Error fetching notices:', error);
    process.exit(1);
  }

  if (!notices || notices.length === 0) {
    console.log('No published notices found');
    process.exit(0);
  }

  console.log(`Found ${notices.length} published notices\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const notice of notices) {
    const noticeLabel = `Notice ${notice.id.substring(0, 8)}`;
    const success = await addRepresentationsToNotice(notice.id, noticeLabel);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n✨ Complete!\n');
  console.log(`Successfully processed: ${successCount} notices`);
  console.log(`Errors: ${errorCount} notices`);
  console.log('\n📊 Dashboard should now show:');
  console.log('  - Priority items with urgent deadlines (tomorrow/day after)');
  console.log('  - High representation counts (8 per notice)');
  console.log('  - Notices sorted by urgency (most urgent at top)\n');
}

main().catch(console.error);
