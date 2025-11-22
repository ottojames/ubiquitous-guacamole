#!/usr/bin/env tsx
/**
 * Add Licensing Details to Existing Notices
 *
 * Updates all licensing notices with:
 * - Operating hours
 * - Licensed activities
 * - Application reference numbers
 * - DPS (Designated Premises Supervisor) details
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Typical opening hours patterns
const hoursPatterns = [
  {
    hours: 'Monday-Thursday: 11:00-23:00\nFriday-Saturday: 11:00-01:00\nSunday: 12:00-22:30',
    description: 'Standard pub hours'
  },
  {
    hours: 'Monday-Sunday: 10:00-00:00',
    description: 'Seven days, midnight close'
  },
  {
    hours: 'Monday-Thursday: 12:00-23:00\nFriday-Saturday: 12:00-02:00\nSunday: 12:00-23:00',
    description: 'Restaurant with late weekend hours'
  },
  {
    hours: 'Monday-Saturday: 10:00-23:00\nSunday: 12:00-22:30',
    description: 'Standard retail hours'
  },
  {
    hours: 'Monday-Sunday: 09:00-23:00',
    description: 'Café/bar hours'
  },
  {
    hours: 'Thursday-Saturday: 20:00-03:00\nSunday: Closed\nMonday-Wednesday: Closed',
    description: 'Late night venue (weekends only)'
  },
];

// Licensable activities
const activities = [
  'Sale of alcohol for consumption on the premises',
  'Sale of alcohol for consumption off the premises',
  'Late night refreshment (hot food/drink after 23:00)',
  'Live music',
  'Recorded music',
  'Performance of dance',
  'Exhibition of films',
  'Indoor sporting events',
  'Boxing or wrestling entertainment',
  'Performance of a play'
];

// Typical activity combinations
const activitySets = [
  // Standard pub
  ['Sale of alcohol for consumption on the premises', 'Live music', 'Recorded music'],
  // Restaurant
  ['Sale of alcohol for consumption on the premises', 'Late night refreshment (hot food/drink after 23:00)', 'Recorded music'],
  // Off-license
  ['Sale of alcohol for consumption off the premises'],
  // Wine bar
  ['Sale of alcohol for consumption on the premises', 'Recorded music'],
  // Late night venue
  ['Sale of alcohol for consumption on the premises', 'Late night refreshment (hot food/drink after 23:00)', 'Recorded music', 'Performance of dance'],
  // Entertainment venue
  ['Sale of alcohol for consumption on the premises', 'Live music', 'Recorded music', 'Performance of dance', 'Exhibition of films'],
];

// DPS names (Designated Premises Supervisor)
const dpsFirstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Laura', 'James', 'Sophie', 'Robert', 'Emily'];
const dpsLastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Wilson', 'Evans', 'Thomas', 'Johnson'];

function generateDPSName(): string {
  return `${randomItem(dpsFirstNames)} ${randomItem(dpsLastNames)}`;
}

function generateRefNumber(): string {
  const year = new Date().getFullYear();
  const number = randomInt(100, 999);
  return `PREM/${year}/${number.toString().padStart(5, '0')}`;
}

async function main() {
  console.log('🚀 Starting licensing details update...\n');

  // Fetch all licensing notices
  const { data: notices, error } = await supabase
    .from('notices')
    .select('id, notice_type, premises, applicant, description')
    .or('notice_type.eq.licensing-premises-new,notice_type.eq.licensing-premises-variation,notice_type.eq.licensing-premises-review')
    .is('extras->licensingHours', null); // Only update those without hours already

  if (error || !notices) {
    console.error('❌ Error fetching notices:', error);
    return;
  }

  console.log(`📋 Found ${notices.length} licensing notices to update\n`);

  let updated = 0;

  for (const notice of notices) {
    const hoursPattern = randomItem(hoursPatterns);
    const activitySet = randomItem(activitySets);
    const dpsName = generateDPSName();
    const refNumber = generateRefNumber();

    // Build licensing object
    const licensing = {
      hours: hoursPattern.hours,
      activities: activitySet,
      dpsName: dpsName,
      dpsLicenceNumber: `LIC-${randomInt(100000, 999999)}`,
    };

    // Get existing applicant email
    const applicantEmail = notice.applicant?.contactEmail || `info@${(notice.premises?.name || 'premises').toLowerCase().replace(/[^a-z0-9]/g, '')}.co.uk`;

    // Build updated extras with reference number and contact info
    const extras = {
      applicationReference: refNumber,
      viewUrl: null, // Could add council portal URLs here
      contactEmail: applicantEmail,
      ...licensing
    };

    // Update notice with licensing details in extras
    const { error: updateError } = await supabase
      .from('notices')
      .update({
        extras
      })
      .eq('id', notice.id);

    if (updateError) {
      console.error(`❌ Error updating notice ${notice.id}:`, updateError.message);
    } else {
      updated++;
      if (updated % 10 === 0) {
        console.log(`✅ Updated ${updated} notices...`);
      }
    }
  }

  console.log(`\n🎉 Successfully updated ${updated} licensing notices!\n`);

  // Summary
  console.log('📊 Summary:');
  console.log(`  - Added operating hours to all notices`);
  console.log(`  - Added licensed activities (${activitySets[0].length}-${activitySets[activitySets.length-1].length} activities each)`);
  console.log(`  - Added DPS (Designated Premises Supervisor) names`);
  console.log(`  - Added application reference numbers (PREM/2025/XXXXX)`);
  console.log(`  - Added contact emails for each premises`);
}

main()
  .then(() => {
    console.log('\n✨ Update complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
