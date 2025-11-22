/**
 * Demo Data Seeding Script
 *
 * Seeds the database with 100 sample premises licence notices for demonstration purposes.
 * Creates realistic data spread across multiple councils with varied dates.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Sample data arrays
const PREMISES_NAMES = [
  'The Red Lion', 'The White Hart', 'The Crown Inn', 'The Royal Oak', 'The Kings Arms',
  'The Queens Head', 'The Star Inn', 'The Black Horse', 'The Golden Lion', 'The Swan',
  'The Railway Tavern', 'The Anchor', 'The Ship Inn', 'The Bell', 'The Rose & Crown',
  'The George', 'The Fox & Hounds', 'The Plough', 'The Horseshoe', 'The Victoria',
];

const APPLICANT_NAMES = [
  'ABC Hospitality Ltd', 'XYZ Leisure Group', 'Smith & Sons Taverns', 'Premium Pubs plc',
  'Local Brewers Ltd', 'Hospitality Ventures Ltd', 'City Bars & Restaurants', 'Heritage Inns Ltd',
  'Coastal Hospitality Group', 'Metropolitan Leisure', 'Community Pubs Ltd', 'Family Taverns Ltd',
];

const STREET_NAMES = [
  'High Street', 'Market Street', 'Church Road', 'Station Road', 'Main Street',
  'The Broadway', 'Queens Road', 'Kings Avenue', 'Victoria Street', 'Albert Road',
  'Mill Lane', 'Bridge Street', 'Castle Street', 'Park Road', 'Chapel Lane',
];

const TOWNS = [
  'Bristol', 'Westminster', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool',
  'Newcastle', 'Sheffield', 'Nottingham', 'Leicester', 'Southampton', 'Brighton',
];

const ACTIVITIES = [
  'Sale of alcohol for consumption on and off the premises',
  'Late night refreshment',
  'Live music',
  'Recorded music',
  'Performance of dance',
  'Provision of facilities for dancing',
];

function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number = 90): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysBack));
  return date.toISOString().split('T')[0];
}

function futureDate(daysAhead: number = 28): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

async function getCouncils() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('type', 'council')
    .limit(20);

  if (error) throw error;
  return data;
}

async function getDepartment(councilId: string) {
  const { data, error } = await supabase
    .from('departments')
    .select('id')
    .eq('organization_id', councilId)
    .eq('type', 'licensing')
    .single();

  if (error) throw error;
  return data;
}

async function generateSampleNotice(council: any, index: number) {
  const department = await getDepartment(council.id);

  const premisesName = random(PREMISES_NAMES);
  const applicantName = random(APPLICANT_NAMES);
  const streetNumber = randomInt(1, 200);
  const streetName = random(STREET_NAMES);
  const town = random(TOWNS);
  const postcode = `BS${randomInt(1, 40)} ${randomInt(1, 9)}${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}`;

  const applicationDate = randomDate(60);
  const publicationDate = randomDate(30);
  const deadlineDate = futureDate(28);

  // Randomly select 2-4 activities
  const numActivities = randomInt(2, 4);
  const selectedActivities = [];
  const activityCopy = [...ACTIVITIES];
  for (let i = 0; i < numActivities; i++) {
    const idx = randomInt(0, activityCopy.length - 1);
    selectedActivities.push(activityCopy.splice(idx, 1)[0]);
  }

  const noticeText = `LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

Notice is hereby given that ${applicantName} has applied to ${council.name} for a new premises licence for ${premisesName}, ${streetNumber} ${streetName}, ${town}, ${postcode}.

Licensable activities applied for: ${selectedActivities.join(', ')}.

Proposed hours: Monday-Saturday 10:00-23:00, Sunday 12:00-22:30.
Opening hours: Daily 09:00-23:30.

The application can be inspected at the Licensing Office, ${council.name}, during normal office hours (Monday-Friday 9am-5pm).

Any representations must be made in writing to ${council.name} Licensing Department by ${deadlineDate}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`;

  const notice = {
    notice_type: 'Premises Licence — New Application',
    notice_category: 'licensing',
    applicant_name: applicantName,
    applicant_email: `licensing@${applicantName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    premises_name: premisesName,
    premises_address: `${streetNumber} ${streetName}, ${town}, ${postcode}`,
    premises_postcode: postcode,
    council_id: council.id,
    council_name: council.name,
    department_id: department.id,
    notice_text: noticeText,
    application_date: applicationDate,
    publication_date: publicationDate,
    consultation_deadline: deadlineDate,
    status: randomInt(0, 100) > 20 ? 'published' : 'draft', // 80% published, 20% draft
    created_at: applicationDate,
    updated_at: publicationDate,
  };

  return notice;
}

async function main() {
  console.log('🌱 Starting demo data seeding...\n');

  // Get councils
  console.log('📋 Fetching councils...');
  const councils = await getCouncils();
  console.log(`✅ Found ${councils.length} councils\n`);

  if (councils.length === 0) {
    console.error('❌ No councils found in database. Please import councils first.');
    process.exit(1);
  }

  // Generate 100 notices
  console.log('🔧 Generating 100 sample notices...');
  const notices = [];

  for (let i = 0; i < 100; i++) {
    const council = random(councils);
    try {
      const notice = await generateSampleNotice(council, i);
      notices.push(notice);

      if ((i + 1) % 10 === 0) {
        console.log(`   Generated ${i + 1}/100 notices...`);
      }
    } catch (error) {
      console.error(`⚠️  Error generating notice ${i + 1}:`, error);
    }
  }

  console.log(`✅ Generated ${notices.length} notices\n`);

  // Insert into database
  console.log('💾 Inserting notices into database...');
  const { data, error } = await supabase
    .from('notices')
    .insert(notices)
    .select();

  if (error) {
    console.error('❌ Error inserting notices:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data.length} notices\n`);

  // Statistics
  const publishedCount = notices.filter(n => n.status === 'published').length;
  const draftCount = notices.filter(n => n.status === 'draft').length;

  console.log('📊 Statistics:');
  console.log(`   Total notices: ${data.length}`);
  console.log(`   Published: ${publishedCount}`);
  console.log(`   Drafts: ${draftCount}`);
  console.log(`   Councils: ${new Set(notices.map(n => n.council_name)).size}`);
  console.log('\n✨ Demo data seeding complete!\n');
}

main().catch(console.error);
