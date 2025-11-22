#!/usr/bin/env tsx
/**
 * Seed Nationwide Representations Script
 *
 * Adds 50-100 public representations across all published notices
 * - Mix of objections and support
 * - Realistic UK names and addresses
 * - Varied grounds and comments
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

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// UK first names
const firstNames = [
  'James', 'Sarah', 'Michael', 'Emma', 'David', 'Laura', 'John', 'Sophie',
  'Robert', 'Emily', 'William', 'Hannah', 'Thomas', 'Jessica', 'Richard', 'Lucy',
  'Daniel', 'Charlotte', 'Matthew', 'Grace', 'Andrew', 'Olivia', 'Paul', 'Megan',
  'Christopher', 'Katie', 'Mark', 'Amy', 'Stephen', 'Rebecca', 'Peter', 'Rachel',
  'Simon', 'Jennifer', 'Jonathan', 'Lisa', 'Benjamin', 'Helen', 'Adam', 'Claire'
];

// UK surnames
const surnames = [
  'Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Wilson', 'Evans',
  'Thomas', 'Johnson', 'Roberts', 'Walker', 'Robinson', 'Thompson', 'White', 'Hughes',
  'Edwards', 'Green', 'Lewis', 'Wood', 'Harris', 'Martin', 'Jackson', 'Clarke',
  'Cooper', 'Hill', 'Turner', 'Moore', 'King', 'Baker', 'Wright', 'Scott',
  'Mitchell', 'Phillips', 'Campbell', 'Anderson', 'Parker', 'Morris', 'Watson', 'Rogers'
];

// Street names
const streets = [
  'High Street', 'Church Road', 'Park Avenue', 'Station Road', 'Mill Lane',
  'Queen Street', 'King Street', 'Victoria Road', 'Albert Street', 'Market Street',
  'George Street', 'Bridge Street', 'London Road', 'Oxford Road', 'Cambridge Street',
  'Manor Drive', 'Elm Grove', 'Oak Lane', 'Maple Avenue', 'Beech Road'
];

// Towns/cities
const towns = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Bristol', 'Sheffield',
  'Newcastle', 'Nottingham', 'Leicester', 'Coventry', 'Bradford', 'Edinburgh',
  'Glasgow', 'Cardiff', 'Belfast', 'Southampton', 'Brighton', 'Derby', 'Plymouth'
];

// Licensing grounds for objections
const licensingGrounds = [
  'prevention of crime and disorder',
  'public safety',
  'prevention of public nuisance',
  'protection of children from harm'
];

// Objection comments
const objectionComments = [
  'I am concerned about increased noise levels late at night affecting local residents.',
  'The proposed hours will lead to anti-social behaviour in the area.',
  'There are already too many licensed premises in this neighbourhood.',
  'Parking is already a significant problem and this will make it worse.',
  'I am worried about the impact on my family\'s quality of life.',
  'The area is primarily residential and late-night activity is inappropriate.',
  'Previous issues with noise and disturbance from this type of venue.',
  'Increased footfall will cause littering and disturbance to residents.',
  'I object to the extended hours which will affect my ability to sleep.',
  'This development will negatively impact the character of our neighbourhood.',
  'Concerns about public safety and emergency vehicle access.',
  'The cumulative impact of licensed premises in this area is already too high.',
  'I am concerned about the effect on local property values.',
  'Existing amenity will be harmed by this application.',
  'This proposal does not align with the local plan policies.'
];

// Support comments
const supportComments = [
  'This will be a valuable addition to the local economy and create jobs.',
  'I support responsible businesses that contribute to the community.',
  'The area needs more venues like this to attract visitors.',
  'Well-run establishments enhance the local area.',
  'This will provide much-needed facilities for residents.',
  'I have no concerns about this application and support it fully.',
  'The applicant has a good track record of operating responsibly.',
  'This development will regenerate the local area.',
  'Local businesses will benefit from increased footfall.',
  'The proposal is well-designed and appropriate for the location.',
  'I support sustainable development that benefits the community.',
  'This will enhance local amenity and provide new services.',
  'The area will benefit from the investment and improvements.',
  'I welcome this positive development for our neighbourhood.',
  'This represents sensible and proportionate commercial activity.'
];

// Planning objection comments
const planningObjections = [
  'The proposed development is too high and out of character with the area.',
  'Insufficient parking provision will cause congestion.',
  'Concerns about overlooking and loss of privacy to neighbouring properties.',
  'The design is inappropriate for a conservation area.',
  'Overdevelopment of the site with insufficient green space.',
  'Impact on local infrastructure which is already at capacity.',
  'Loss of light and overshadowing to adjacent properties.',
  'Not in keeping with local architectural heritage.',
  'Traffic generation will be unacceptable in this residential area.',
  'The proposal represents over-intensive use of the site.'
];

// Planning support comments
const planningSupport = [
  'This development will provide much-needed housing in the area.',
  'The design is of high quality and will enhance the streetscape.',
  'This will bring jobs and economic benefits to the local community.',
  'The site is currently derelict and this represents positive regeneration.',
  'I support sustainable development that meets housing need.',
  'The proposal makes efficient use of a brownfield site.',
  'This development aligns with local plan policies.',
  'The applicant has engaged positively with the community.',
  'This will provide affordable housing which is desperately needed.',
  'The proposed improvements to public realm are welcome.'
];

function generateAddress() {
  const number = Math.floor(Math.random() * 200) + 1;
  const street = randomItem(streets);
  const town = randomItem(towns);
  const postcode = `${['N', 'S', 'E', 'W', 'NW', 'SW', 'SE', 'NE'][Math.floor(Math.random() * 8)]}${Math.floor(Math.random() * 20) + 1} ${Math.floor(Math.random() * 9) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

  return {
    line1: `${number} ${street}`,
    city: town,
    postcode
  };
}

async function main() {
  console.log('🚀 Starting representation seeding...\n');

  // Fetch published notices
  const { data: notices, error } = await supabase
    .from('notices')
    .select('id, notice_type, premises, department_id')
    .eq('status', 'published')
    .not('representation_deadline', 'is', null);

  if (error || !notices) {
    console.error('❌ Error fetching notices:', error);
    return;
  }

  console.log(`📋 Found ${notices.length} published notices\n`);

  const representations: any[] = [];
  const targetReps = 80; // Aim for 80 representations
  const noticesWithReps = new Set<string>();

  // Ensure diverse distribution - some notices get multiple reps, some get none
  const noticesShuffled = [...notices].sort(() => Math.random() - 0.5);

  for (let i = 0; i < targetReps && i < noticesShuffled.length * 3; i++) {
    // Pick a notice (can be repeated for multiple reps)
    const notice = noticesShuffled[Math.floor(Math.random() * noticesShuffled.length)];
    noticesWithReps.add(notice.id);

    const firstName = randomItem(firstNames);
    const surname = randomItem(surnames);
    const address = generateAddress();
    const isObjection = Math.random() > 0.4; // 60% objections, 40% support
    const type = isObjection ? 'objection' : 'support';

    let grounds = null;
    let comment = '';

    if (notice.notice_type.includes('licensing')) {
      if (isObjection) {
        grounds = randomItem(licensingGrounds);
        comment = randomItem(objectionComments);
      } else {
        comment = randomItem(supportComments);
      }
    } else if (notice.notice_type.includes('planning')) {
      comment = isObjection ? randomItem(planningObjections) : randomItem(planningSupport);
    } else if (notice.notice_type.includes('tro') || notice.notice_type.includes('traffic')) {
      comment = isObjection
        ? 'I object to these traffic restrictions which will harm local businesses and residents.'
        : 'I support these safety improvements to our roads.';
    } else if (notice.notice_type.includes('gambling')) {
      comment = isObjection
        ? 'I am concerned about problem gambling and the impact on vulnerable people in the area.'
        : 'This is a well-regulated business that provides entertainment.';
    } else {
      comment = isObjection
        ? 'I have concerns about this application and its impact on the local area.'
        : 'I support this application as it will benefit the community.';
    }

    representations.push({
      notice_id: notice.id,
      representor_name: `${firstName} ${surname}`,
      representor_email: `${firstName.toLowerCase()}.${surname.toLowerCase()}@example.com`,
      representor_address: address,
      type,
      grounds,
      representation_text: comment,
      submitted_at: new Date().toISOString(),
    });
  }

  console.log(`📊 Prepared ${representations.length} representations for ${noticesWithReps.size} notices\n`);

  // Insert in batches
  const batchSize = 25;
  let inserted = 0;

  for (let i = 0; i < representations.length; i += batchSize) {
    const batch = representations.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('representations')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      inserted += data?.length || 0;
      console.log(`✅ Inserted batch ${i / batchSize + 1}: ${data?.length} representations`);
    }
  }

  console.log(`\n🎉 Successfully inserted ${inserted} representations!\n`);

  // Summary
  const { data: stats } = await supabase
    .from('representations')
    .select('type');

  if (stats) {
    const objections = stats.filter(r => r.type === 'objection').length;
    const support = stats.filter(r => r.type === 'support').length;

    console.log('📈 Final Statistics:');
    console.log(`  Objections: ${objections}`);
    console.log(`  Support: ${support}`);
    console.log(`  Total: ${stats.length}`);
  }
}

main()
  .then(() => {
    console.log('\n✨ Seeding complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
