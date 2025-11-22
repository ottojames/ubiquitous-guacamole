#!/usr/bin/env tsx
/**
 * Seed 100 Nationwide Notices Script
 *
 * Creates 100 diverse notices across UK councils:
 * - 40 Licensing notices (premises licenses, variations, reviews)
 * - 30 Planning applications (major, listed buildings, conservation)
 * - 15 Traffic Regulation Orders (permanent, temporary, experimental)
 * - 10 Gambling premises (betting, bingo, AGC, FEC)
 * - 5 GVOL (goods vehicle operator licenses)
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

// Helper functions
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function toISODateTime(date: Date): string {
  return date.toISOString();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

const today = new Date();

// UK Town/City data with approximate coordinates
const ukLocations = [
  // London & Southeast
  { city: 'London', postcode: 'SW1A 1AA', lat: 51.5014, lng: -0.1419, councils: ['Westminster (City of) Council', 'Camden Council', 'Islington Council', 'Tower Hamlets Council'] },
  { city: 'Brighton', postcode: 'BN1 1EE', lat: 50.8225, lng: -0.1372, councils: ['Brighton Council'] },
  { city: 'Reading', postcode: 'RG1 1LG', lat: 51.4543, lng: -0.9781, councils: ['Reading Council'] },
  { city: 'Oxford', postcode: 'OX1 1BX', lat: 51.7520, lng: -1.2577, councils: ['Oxford Council'] },
  { city: 'Canterbury', postcode: 'CT1 1BG', lat: 51.2802, lng: 1.0789, councils: ['Canterbury Council'] },

  // Southwest
  { city: 'Bristol', postcode: 'BS1 4ED', lat: 51.4545, lng: -2.5879, councils: ['Bristol Council'] },
  { city: 'Bath', postcode: 'BA1 1AA', lat: 51.3811, lng: -2.3590, councils: ['Bath and North Somerset Council'] },
  { city: 'Plymouth', postcode: 'PL1 1AA', lat: 50.3755, lng: -4.1427, councils: ['Plymouth Council'] },
  { city: 'Exeter', postcode: 'EX1 1GE', lat: 50.7184, lng: -3.5339, councils: ['Exeter Council'] },
  { city: 'Bournemouth', postcode: 'BH1 1AA', lat: 50.7192, lng: -1.8808, councils: ['Bournemouth Council'] },

  // Midlands
  { city: 'Birmingham', postcode: 'B1 1AA', lat: 52.4862, lng: -1.8904, councils: ['Birmingham City Council'] },
  { city: 'Nottingham', postcode: 'NG1 1AA', lat: 52.9548, lng: -1.1581, councils: ['Nottingham Council'] },
  { city: 'Leicester', postcode: 'LE1 1AA', lat: 52.6369, lng: -1.1398, councils: ['Leicester Council'] },
  { city: 'Coventry', postcode: 'CV1 1AA', lat: 52.4068, lng: -1.5197, councils: ['Coventry Council'] },
  { city: 'Derby', postcode: 'DE1 1AA', lat: 52.9225, lng: -1.4746, councils: ['Derby Council'] },

  // Northwest
  { city: 'Manchester', postcode: 'M1 1AA', lat: 53.4808, lng: -2.2426, councils: ['Manchester Council'] },
  { city: 'Liverpool', postcode: 'L1 1AA', lat: 53.4084, lng: -2.9916, councils: ['Liverpool Council'] },
  { city: 'Leeds', postcode: 'LS1 1AA', lat: 53.8008, lng: -1.5491, councils: ['Leeds Council'] },
  { city: 'Sheffield', postcode: 'S1 1AA', lat: 53.3811, lng: -1.4701, councils: ['Sheffield Council'] },
  { city: 'Bradford', postcode: 'BD1 1AA', lat: 53.7960, lng: -1.7594, councils: ['Bradford Council'] },

  // Northeast
  { city: 'Newcastle', postcode: 'NE1 1AA', lat: 54.9783, lng: -1.6178, councils: ['Newcastle Council'] },
  { city: 'Sunderland', postcode: 'SR1 1AA', lat: 54.9069, lng: -1.3838, councils: ['Sunderland Council'] },
  { city: 'Durham', postcode: 'DH1 1AA', lat: 54.7761, lng: -1.5733, councils: ['Durham Council'] },
  { city: 'Middlesbrough', postcode: 'TS1 1AA', lat: 54.5742, lng: -1.2350, councils: ['Middlesbrough Council'] },

  // Scotland
  { city: 'Edinburgh', postcode: 'EH1 1AA', lat: 55.9533, lng: -3.1883, councils: ['Edinburgh Council'] },
  { city: 'Glasgow', postcode: 'G1 1AA', lat: 55.8642, lng: -4.2518, councils: ['Glasgow Council'] },
  { city: 'Aberdeen', postcode: 'AB10 1AA', lat: 57.1497, lng: -2.0943, councils: ['Aberdeen City Council'] },
  { city: 'Dundee', postcode: 'DD1 1AA', lat: 56.4620, lng: -2.9707, councils: ['Dundee Council'] },

  // Wales
  { city: 'Cardiff', postcode: 'CF10 1AA', lat: 51.4816, lng: -3.1791, councils: ['Cardiff Council'] },
  { city: 'Swansea', postcode: 'SA1 1AA', lat: 51.6214, lng: -3.9436, councils: ['Swansea Council'] },
  { city: 'Newport', postcode: 'NP20 1AA', lat: 51.5842, lng: -2.9977, councils: ['Newport Council'] },
];

// Business names for licensing
const businessNames = [
  'The Crown & Anchor', 'The Rose & Crown', 'The Kings Arms', 'The Royal Oak', 'The White Hart',
  'The Red Lion', 'The Black Swan', 'The Golden Lion', 'The Green Dragon', 'The Blue Bell',
  'Riverside Tavern', 'City Centre Bar', 'The Market Tavern', 'The Old Mill', 'The Coach House',
  'The Railway Inn', 'The Victoria', 'The Station Hotel', 'The Merchants Arms', 'The Wheatsheaf',
  'Bar Central', 'The Lounge', 'Soho House', 'The Wine Cellar', 'The Craft House',
  'The Brewhouse', 'The Tap Room', 'The Barrel', 'The Cask & Bottle', 'The Hop & Vine',
  'Corner Bistro', 'The Grill Room', 'The Kitchen', 'The Garden Room', 'The Terrace',
  'The Brasserie', 'The Refectory', 'The Dining Hall', 'The Supper Club', 'The Table',
  'Night & Day', 'The Vault', 'The Underground', 'The Basement', 'The Loft',
  'The Studio', 'The Gallery', 'The Warehouse', 'The Factory', 'The Exchange'
];

// Gambling premises names
const gamblingNames = [
  'Coral Betting', 'Ladbrokes', 'William Hill', 'Paddy Power', 'Betfred',
  'Gala Bingo', 'Mecca Bingo', 'Grosvenor Casino', 'Hippodrome Casino', 'The Ritz Club',
  'Lucky Stars Bingo', 'Palace Bingo', 'Apollo Bingo', 'Crown Bingo', 'Majestic Bingo',
  'Ace Gaming', 'Star Slots', 'Golden Nugget', 'Diamond Gaming', 'Royal Flush Gaming'
];

// Planning developments
const planningNames = [
  'Riverside Quarter', 'City Centre Development', 'Heritage Square', 'Market Place Regeneration',
  'Station Gateway', 'Waterfront Apartments', 'The Old Brewery Site', 'Former Hospital Site',
  'Mill Quarter', 'Docklands Development', 'High Street Regeneration', 'Town Hall Square',
  'The Old School Site', 'Former Industrial Estate', 'Green Park Development', 'Victory Parade',
  'Queen Street Apartments', 'King\'s Walk Development', 'Cathedral Quarter', 'The Maltings',
  'Exchange Place', 'Commerce Court', 'Trade Centre', 'Business Park', 'Innovation Hub',
  'Technology Campus', 'Science Quarter', 'Research Park', 'Enterprise Zone', 'Eco Village'
];

// Road names for TROs
const roadNames = [
  'High Street', 'Park Road', 'Church Street', 'Station Road', 'Mill Lane',
  'Bridge Street', 'Market Street', 'Castle Street', 'Victoria Road', 'King Street',
  'Queen Street', 'Albert Street', 'George Street', 'York Road', 'London Road',
  'Oxford Street', 'Cambridge Road', 'College Road', 'School Lane', 'Green Lane'
];

// Company names for GVOL
const companyNames = [
  'Express Logistics', 'Swift Transport', 'City Couriers', 'National Freight', 'Premier Haulage',
  'Direct Delivery', 'Fast Track Transport', 'County Carriers', 'Regional Distribution', 'Metro Logistics'
];

async function getCouncilsWithDepartments() {
  const { data: councils, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      departments:departments(id, name, slug, type)
    `)
    .eq('type', 'council')
    .not('departments', 'is', null)
    .limit(100);

  if (error) {
    console.error('Error fetching councils:', error);
    return [];
  }

  return councils || [];
}

async function main() {
  console.log('🚀 Starting nationwide notice seeding...\n');

  // Fetch councils with departments
  const councilsData = await getCouncilsWithDepartments();
  console.log(`📍 Found ${councilsData.length} councils with departments\n`);

  if (councilsData.length === 0) {
    console.error('❌ No councils with departments found. Please ensure councils are seeded.');
    return;
  }

  const notices: any[] = [];
  let noticeCount = 0;

  // 40 Licensing Notices
  console.log('🍺 Creating 40 licensing notices...');
  for (let i = 0; i < 40; i++) {
    const location = randomItem(ukLocations);
    const council = councilsData.find(c => location.councils.includes(c.name));

    if (!council) continue;

    const licensingDept = council.departments.find((d: any) => d.type === 'licensing');
    if (!licensingDept) continue;

    const businessName = businessNames[i % businessNames.length];
    const streetNumber = randomInt(1, 250);
    const daysAgo = randomInt(5, 60);
    const deadlineDays = randomInt(1, 28);

    const noticeTypes = ['licensing-premises-new', 'licensing-premises-variation', 'licensing-premises-review'];
    const statuses = ['published', 'published', 'published', 'pending_approval'];

    notices.push({
      notice_type: randomItem(noticeTypes),
      status: randomItem(statuses),
      department_id: licensingDept.id,
      description: `Application for sale of alcohol and regulated entertainment`,
      premises: {
        name: businessName,
        address: `${streetNumber} ${randomItem(roadNames)}, ${location.city}, ${location.postcode}`,
        postcode: location.postcode
      },
      latitude: location.lat + (Math.random() - 0.5) * 0.02,
      longitude: location.lng + (Math.random() - 0.5) * 0.02,
      applicant: {
        name: `${businessName} Ltd`,
        companyNumber: `${randomInt(10000000, 99999999)}`,
        contactEmail: `info@${businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.uk`
      },
      consultation: {
        repsDeadline: toISODate(addDays(today, deadlineDays))
      },
      representation_deadline: toISODateTime(addDays(today, deadlineDays)),
      published_at: toISODateTime(addDays(today, -daysAgo)),
      contact_email: `licensing@${council.slug}.gov.uk`,
    });
    noticeCount++;
  }

  // 30 Planning Applications
  console.log('🏗️  Creating 30 planning applications...');
  for (let i = 0; i < 30; i++) {
    const location = randomItem(ukLocations);
    const council = councilsData.find(c => location.councils.includes(c.name));

    if (!council) continue;

    const planningDept = council.departments.find((d: any) => d.type === 'planning');
    if (!planningDept) continue;

    const devName = planningNames[i % planningNames.length];
    const daysAgo = randomInt(10, 90);
    const deadlineDays = randomInt(10, 42);

    const planningTypes = [
      'planning-application',
      'planning-listed-building',
      'planning-conservation-area',
      'planning-major-application'
    ];

    notices.push({
      notice_type: randomItem(planningTypes),
      status: 'published',
      department_id: planningDept.id,
      description: `Major planning application for residential and commercial development`,
      premises: {
        name: devName,
        address: `${location.city}, ${location.postcode}`,
        postcode: location.postcode
      },
      latitude: location.lat + (Math.random() - 0.5) * 0.02,
      longitude: location.lng + (Math.random() - 0.5) * 0.02,
      applicant: {
        name: `${devName} Developments Ltd`,
        companyNumber: `${randomInt(10000000, 99999999)}`,
        contactEmail: `planning@${devName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
      },
      consultation: {
        repsDeadline: toISODate(addDays(today, deadlineDays))
      },
      representation_deadline: toISODateTime(addDays(today, deadlineDays)),
      published_at: toISODateTime(addDays(today, -daysAgo)),
      contact_email: `planning@${council.slug}.gov.uk`,
    });
    noticeCount++;
  }

  // 15 Traffic Regulation Orders
  console.log('🚦 Creating 15 traffic regulation orders...');
  for (let i = 0; i < 15; i++) {
    const location = randomItem(ukLocations);
    const council = councilsData.find(c => location.councils.includes(c.name));

    if (!council) continue;

    const trafficDept = council.departments.find((d: any) =>
      d.type === 'traffic' || d.type === 'highways'
    );
    if (!trafficDept) continue;

    const road = randomItem(roadNames);
    const daysAgo = randomInt(5, 45);
    const deadlineDays = randomInt(14, 35);

    const troTypes = ['tro-permanent', 'tro-temporary', 'tro-experimental'];

    notices.push({
      notice_type: randomItem(troTypes),
      status: 'published',
      department_id: trafficDept.id,
      description: `Proposed traffic regulation order for parking restrictions and road safety improvements`,
      premises: {
        name: road,
        address: `${road}, ${location.city}, ${location.postcode}`,
        postcode: location.postcode
      },
      latitude: location.lat + (Math.random() - 0.5) * 0.02,
      longitude: location.lng + (Math.random() - 0.5) * 0.02,
      applicant: {
        name: council.name,
        contactEmail: `highways@${council.slug}.gov.uk`
      },
      consultation: {
        repsDeadline: toISODate(addDays(today, deadlineDays))
      },
      representation_deadline: toISODateTime(addDays(today, deadlineDays)),
      published_at: toISODateTime(addDays(today, -daysAgo)),
      contact_email: `highways@${council.slug}.gov.uk`,
    });
    noticeCount++;
  }

  // 10 Gambling Premises
  console.log('🎰 Creating 10 gambling premises notices...');
  for (let i = 0; i < 10; i++) {
    const location = randomItem(ukLocations);
    const council = councilsData.find(c => location.councils.includes(c.name));

    if (!council) continue;

    const licensingDept = council.departments.find((d: any) => d.type === 'licensing');
    if (!licensingDept) continue;

    const gamblingName = gamblingNames[i % gamblingNames.length];
    const streetNumber = randomInt(1, 150);
    const daysAgo = randomInt(7, 50);
    const deadlineDays = randomInt(14, 28);

    notices.push({
      notice_type: 'gambling-premises',
      status: 'published',
      department_id: licensingDept.id,
      description: `Application for gambling premises licence`,
      premises: {
        name: gamblingName,
        address: `${streetNumber} ${randomItem(roadNames)}, ${location.city}, ${location.postcode}`,
        postcode: location.postcode
      },
      latitude: location.lat + (Math.random() - 0.5) * 0.02,
      longitude: location.lng + (Math.random() - 0.5) * 0.02,
      applicant: {
        name: `${gamblingName} Ltd`,
        companyNumber: `${randomInt(10000000, 99999999)}`,
        contactEmail: `info@${gamblingName.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.uk`
      },
      consultation: {
        repsDeadline: toISODate(addDays(today, deadlineDays))
      },
      representation_deadline: toISODateTime(addDays(today, deadlineDays)),
      published_at: toISODateTime(addDays(today, -daysAgo)),
      contact_email: `licensing@${council.slug}.gov.uk`,
    });
    noticeCount++;
  }

  // 5 GVOL Notices
  console.log('🚚 Creating 5 GVOL notices...');
  for (let i = 0; i < 5; i++) {
    const location = randomItem(ukLocations);
    const council = councilsData.find(c => location.councils.includes(c.name));

    if (!council) continue;

    // GVOL can use licensing or a general department
    const dept = council.departments[0];
    if (!dept) continue;

    const companyName = companyNames[i % companyNames.length];
    const daysAgo = randomInt(5, 40);
    const deadlineDays = randomInt(21, 28);

    notices.push({
      notice_type: 'gvol-new',
      status: 'published',
      department_id: dept.id,
      description: `Application for goods vehicle operator licence`,
      premises: {
        name: `${companyName} Operating Centre`,
        address: `Industrial Estate, ${location.city}, ${location.postcode}`,
        postcode: location.postcode
      },
      latitude: location.lat + (Math.random() - 0.5) * 0.02,
      longitude: location.lng + (Math.random() - 0.5) * 0.02,
      applicant: {
        name: companyName,
        companyNumber: `${randomInt(10000000, 99999999)}`,
        contactEmail: `ops@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.uk`
      },
      consultation: {
        repsDeadline: toISODate(addDays(today, deadlineDays))
      },
      representation_deadline: toISODateTime(addDays(today, deadlineDays)),
      published_at: toISODateTime(addDays(today, -daysAgo)),
      contact_email: `traffic@${council.slug}.gov.uk`,
    });
    noticeCount++;
  }

  console.log(`\n📊 Prepared ${noticeCount} notices for insertion\n`);

  // Insert notices in batches
  const batchSize = 20;
  let inserted = 0;

  for (let i = 0; i < notices.length; i += batchSize) {
    const batch = notices.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('notices')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      inserted += data?.length || 0;
      console.log(`✅ Inserted batch ${i / batchSize + 1}: ${data?.length} notices`);
    }
  }

  console.log(`\n🎉 Successfully inserted ${inserted} notices!\n`);

  // Summary statistics
  const { data: stats } = await supabase
    .from('notices')
    .select('notice_type, status');

  if (stats) {
    const typeCounts = stats.reduce((acc: any, n: any) => {
      acc[n.notice_type] = (acc[n.notice_type] || 0) + 1;
      return acc;
    }, {});

    const statusCounts = stats.reduce((acc: any, n: any) => {
      acc[n.status] = (acc[n.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Final Database Statistics:');
    console.log('\nBy Type:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\nBy Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log(`\n✅ Total Notices: ${stats.length}`);
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
