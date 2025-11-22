#!/usr/bin/env tsx
/**
 * Seed Representations Script
 *
 * Creates 40-50 diverse representations showing public engagement:
 * - Mix of objections (60%), support (30%), comments (10%)
 * - Realistic names and addresses
 * - Variety of licensing objectives and planning grounds
 * - Some marked as unread for council workflow demo
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

// Realistic UK names
const firstNames = ['Sarah', 'James', 'Emma', 'Michael', 'Sophie', 'David', 'Rachel', 'Tom', 'Laura', 'Ben', 'Charlotte', 'Oliver', 'Emily', 'Jack', 'Hannah', 'Sam', 'Amy', 'Luke', 'Katie', 'Dan'];
const lastNames = ['Williams', 'Thompson', 'Jones', 'Davies', 'Brown', 'Wilson', 'Taylor', 'Evans', 'Roberts', 'Walker', 'Robinson', 'White', 'Hughes', 'Edwards', 'Green', 'Hall', 'Wood', 'Harris', 'Martin', 'Clark'];

// Bristol streets
const bristolStreets = [
  'Pembroke Road, Clifton, BS8',
  'Whiteladies Road, Clifton, BS8',
  'Park Street, City Centre, BS1',
  'Gloucester Road, Bishopston, BS7',
  'North Street, Bedminster, BS3',
  'Stokes Croft, St Pauls, BS2',
  'Wells Road, Totterdown, BS4',
  'Fishponds Road, Fishponds, BS16',
  'Queens Road, Clifton, BS8',
  'Alma Road, Clifton, BS8',
];

// Westminster streets
const westminsterStreets = [
  'Old Compton Street, Soho, W1D',
  'Wardour Street, Soho, W1F',
  'Pimlico Road, Pimlico, SW1W',
  'Ebury Street, Belgravia, SW1W',
  'Marylebone High Street, W1U',
  'Baker Street, Marylebone, NW1',
  'Queensway, Bayswater, W2',
  'Westbourne Grove, Notting Hill, W2',
  'The Mall, St James, SW1A',
  'Victoria Street, Westminster, SW1E',
];

function randomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function randomEmail(name: string) {
  const clean = name.toLowerCase().replace(/\s+/g, '.');
  const domains = ['gmail.com', 'hotmail.co.uk', 'yahoo.co.uk', 'outlook.com', 'icloud.com'];
  return `${clean}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function randomStreet(isBristol: boolean) {
  const streets = isBristol ? bristolStreets : westminsterStreets;
  const num = Math.floor(Math.random() * 200) + 1;
  return `${num} ${streets[Math.floor(Math.random() * streets.length)]}`;
}

// Licensing objection templates
const licensingObjections = [
  {
    grounds: ['prevention_of_crime_and_disorder', 'prevention_of_public_nuisance'],
    text: 'I am writing to object to this application on the grounds of prevention of crime and disorder and prevention of public nuisance. The proposed extended hours would lead to increased noise levels late at night, disturbing local residents. There have already been incidents of anti-social behaviour in the area on weekends, and extending the hours would exacerbate this problem. The area is predominantly residential and families with young children live nearby.',
  },
  {
    grounds: ['prevention_of_public_nuisance', 'public_safety'],
    text: 'I strongly object to this premises licence application. The late-night operation would cause significant noise disturbance to nearby residents. I have lived in this area for 15 years and have witnessed how late-night venues attract rowdy crowds who congregate outside, creating litter and noise pollution. The existing parking is already inadequate, and this will worsen traffic and safety concerns.',
  },
  {
    grounds: ['prevention_of_public_nuisance'],
    text: 'As a local resident living directly opposite the proposed premises, I must object on the grounds of public nuisance. The sound of music and voices from outdoor seating areas would carry directly into our homes, particularly during summer months. We have young children who need to sleep, and the proposed hours would severely impact our quality of life.',
  },
  {
    grounds: ['prevention_of_crime_and_disorder'],
    text: 'I wish to raise concerns about this application relating to crime prevention. The area has seen an increase in alcohol-related incidents over the past year, and adding another licensed premises will only contribute to this problem. Local police reports show a correlation between late-night licensed venues and criminal activity in the vicinity.',
  },
  {
    grounds: ['protection_of_children_from_harm', 'public_safety'],
    text: 'I object to this application on grounds of protecting children from harm and public safety. The premises is located on a route used by schoolchildren, and the proposed hours would mean they pass the venue during opening times. There are also concerns about the visibility of alcohol consumption from the street, which sends the wrong message to young people.',
  },
];

// Licensing support templates
const licensingSupport = [
  {
    text: 'I fully support this application. The area needs more quality licensed premises that contribute to the local economy and night-time culture. The applicant has an excellent track record and I am confident they will operate responsibly and in accordance with licensing objectives.',
  },
  {
    text: 'As a local business owner, I welcome this application. It will bring increased footfall to the area and support other local businesses. The applicant has engaged with the community and demonstrated their commitment to operating a well-managed establishment.',
  },
  {
    text: 'I support this application as it will enhance the cultural offering in the area. The applicant has outlined comprehensive plans for preventing noise and managing patron behaviour. This type of establishment is exactly what the area needs to thrive.',
  },
];

// Planning objection templates
const planningObjections = [
  {
    text: 'I object to this planning application on several grounds. The proposed development is out of character with the surrounding conservation area and would result in overdevelopment of the site. The increased density will put strain on already inadequate parking provision and local infrastructure. The loss of light to neighbouring properties has not been adequately addressed in the application.',
  },
  {
    text: 'I am writing to object to this application. The scale and mass of the proposed development is completely inappropriate for this residential area. It will result in significant loss of privacy for adjoining properties and create traffic congestion on our narrow streets. The developer has not provided adequate justification for the departure from existing planning policy.',
  },
  {
    text: 'As a immediate neighbour, I must object to this proposal. The construction period alone will cause significant disruption, but my main concerns relate to the permanent impacts: overshadowing, loss of outlook, and the overbearing nature of the development. The design is not in keeping with the historic character of the area.',
  },
  {
    text: 'I object to this application on traffic and highways safety grounds. The proposed development will generate significant additional vehicle movements on roads that are already congested during peak hours. The parking provision is inadequate and will lead to overspill parking in surrounding streets. The application fails to address these fundamental issues.',
  },
];

// Planning support templates
const planningSupport = [
  {
    text: 'I support this application as it will bring much-needed housing to the area while preserving the character of the existing building. The design is sympathetic to the surroundings and the proposed materials are appropriate. The developer has engaged constructively with the community throughout the process.',
  },
  {
    text: 'This is a positive development that will regenerate a currently underutilized site. The provision of affordable housing is welcomed, and the design quality is high. The application demonstrates how brownfield land can be effectively brought back into productive use.',
  },
];

// Traffic order objections
const trafficObjections = [
  {
    text: 'I object to this proposed traffic regulation order. The road closure will significantly increase journey times for residents and create congestion on alternative routes. The consultation has been inadequate and does not reflect the concerns of those who will be most affected. Emergency services access has not been properly considered.',
  },
  {
    text: 'As a local resident who relies on this route daily, I strongly object to these proposals. The displaced traffic will simply move to neighbouring residential streets, creating noise and pollution problems elsewhere. The economic impact on local businesses has been underestimated, and the proposed alternative arrangements are not practical.',
  },
];

async function seedRepresentations() {
  console.log('🌱 Starting representation seeding...\n');

  // Get published notices with future deadlines
  const { data: notices, error } = await supabase
    .from('notices')
    .select('id, premises, notice_type, department_id')
    .eq('status', 'published')
    .not('representation_deadline', 'is', null)
    .gte('representation_deadline', new Date().toISOString())
    .order('representation_deadline', { ascending: true })
    .limit(20);

  if (error || !notices || notices.length === 0) {
    console.error('❌ Failed to fetch notices:', error);
    return;
  }

  console.log(`📋 Found ${notices.length} notices with representation deadlines\n`);

  // Determine which notices get high/medium/low engagement
  const highEngagement = notices.slice(0, 3); // First 3 get 10-15 reps each
  const mediumEngagement = notices.slice(3, 11); // Next 8 get 3-5 reps each
  const lowEngagement = notices.slice(11); // Rest get 1-2 reps each

  const representations: any[] = [];

  // High engagement notices (controversial)
  for (const notice of highEngagement) {
    const count = 10 + Math.floor(Math.random() * 6); // 10-15 reps
    const objectionCount = Math.floor(count * 0.75); // 75% objections
    const isBristol = Math.random() > 0.5;

    console.log(`🔥 High engagement: ${notice.premises?.name} (${count} representations)`);

    for (let i = 0; i < count; i++) {
      const name = randomName();
      const isObjection = i < objectionCount;
      const isLicensing = notice.notice_type?.includes('licensing') || notice.notice_type?.includes('premises');
      const isPlanning = notice.notice_type?.includes('planning');
      const isTraffic = notice.notice_type?.includes('tro');

      let repData: any = {
        notice_id: notice.id,
        representor_name: name,
        representor_email: randomEmail(name),
        representor_address: { address: randomStreet(isBristol) },
        type: isObjection ? 'objection' : 'support',
        status: 'submitted',
      };

      if (isLicensing) {
        if (isObjection) {
          const template = licensingObjections[i % licensingObjections.length];
          repData.representation_text = template.text;
          repData.grounds = template.grounds;
        } else {
          repData.representation_text = licensingSupport[i % licensingSupport.length].text;
        }
      } else if (isPlanning) {
        repData.representation_text = isObjection
          ? planningObjections[i % planningObjections.length].text
          : planningSupport[i % planningSupport.length].text;
      } else if (isTraffic) {
        repData.representation_text = trafficObjections[i % trafficObjections.length].text;
      } else {
        repData.representation_text = isObjection
          ? 'I object to this application due to concerns about the impact on our local community.'
          : 'I support this application as it will benefit the local area.';
      }

      representations.push(repData);
    }
  }

  // Medium engagement notices
  for (const notice of mediumEngagement) {
    const count = 3 + Math.floor(Math.random() * 3); // 3-5 reps
    const objectionCount = Math.floor(count * 0.6); // 60% objections
    const isBristol = Math.random() > 0.5;

    console.log(`📊 Medium engagement: ${notice.premises?.name} (${count} representations)`);

    for (let i = 0; i < count; i++) {
      const name = randomName();
      const isObjection = i < objectionCount;
      const isLicensing = notice.notice_type?.includes('licensing') || notice.notice_type?.includes('premises');
      const isPlanning = notice.notice_type?.includes('planning');

      let repData: any = {
        notice_id: notice.id,
        representor_name: name,
        representor_email: randomEmail(name),
        representor_address: { address: randomStreet(isBristol) },
        type: isObjection ? 'objection' : 'support',
        status: 'submitted',
      };

      if (isLicensing) {
        if (isObjection) {
          const template = licensingObjections[i % licensingObjections.length];
          repData.representation_text = template.text;
          repData.grounds = template.grounds;
        } else {
          repData.representation_text = licensingSupport[i % licensingSupport.length].text;
        }
      } else if (isPlanning) {
        repData.representation_text = isObjection
          ? planningObjections[i % planningObjections.length].text
          : planningSupport[i % planningSupport.length].text;
      } else {
        repData.representation_text = isObjection
          ? 'I wish to raise concerns about this application and its impact on local residents.'
          : 'I believe this will be a positive addition to the area.';
      }

      representations.push(repData);
    }
  }

  // Low engagement notices
  for (const notice of lowEngagement) {
    const count = 1 + Math.floor(Math.random() * 2); // 1-2 reps
    const isBristol = Math.random() > 0.5;

    console.log(`📝 Low engagement: ${notice.premises?.name} (${count} representations)`);

    for (let i = 0; i < count; i++) {
      const name = randomName();
      const isObjection = Math.random() > 0.4; // 60% objections

      representations.push({
        notice_id: notice.id,
        representor_name: name,
        representor_email: randomEmail(name),
        representor_address: { address: randomStreet(isBristol) },
        type: isObjection ? 'objection' : 'support',
        status: 'submitted',
        representation_text: isObjection
          ? 'I have concerns about this application and would like to register my objection.'
          : 'I support this application and believe it will be beneficial.',
      });
    }
  }

  console.log(`\n📊 Total representations to insert: ${representations.length}\n`);

  // Insert representations in batches
  let successCount = 0;
  let errorCount = 0;

  for (const rep of representations) {
    try {
      const { error } = await supabase.from('representations').insert(rep);

      if (error) {
        console.error(`❌ Failed:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error:`, err);
      errorCount++;
    }
  }

  console.log(`\n✨ Seeding complete:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${representations.length}\n`);

  // Summary by type
  const byType = representations.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📋 Breakdown by type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
}

seedRepresentations()
  .then(() => {
    console.log('\n✅ All done!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
