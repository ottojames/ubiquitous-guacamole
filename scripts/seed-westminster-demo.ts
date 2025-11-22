/**
 * Seed Westminster Council Demo Data for Segment 3
 *
 * Creates:
 * - 38 published notices (27 more to existing 11)
 * - 15 representations across notices
 * - 3 pending submissions from Wilson & Partners
 * - One "controversial" notice with 12 objections + 3 support
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const WESTMINSTER_COUNCIL_ID = '02cb9c23-92bb-4f51-9e1a-30698dccffb6';
const WESTMINSTER_ORG_ID = 'fb76a8aa-4e3d-40ac-9c61-e9217ed930a4';
const WESTMINSTER_LICENSING_DEPT = '53c08600-5c5a-46a4-8805-16c129022952';
const WILSON_ORG_ID = '00000000-0000-0000-0000-000000000101';

// Westminster areas (not Clifton - that's Bristol!)
const WESTMINSTER_VENUES = [
  { name: 'The Mayfair Lounge', area: 'Mayfair', postcode: 'W1K 2HP' },
  { name: 'Victoria Wine Bar', area: 'Victoria', postcode: 'SW1V 1QT' },
  { name: 'Soho Social Club', area: 'Soho', postcode: 'W1D 3QX' },
  { name: 'The Westminster Arms', area: 'Westminster', postcode: 'SW1A 2JR' },
  { name: 'Belgravia Bistro', area: 'Belgravia', postcode: 'SW1X 8BW' },
  { name: 'Pimlico Pub & Kitchen', area: 'Pimlico', postcode: 'SW1V 2SA' },
  { name: 'Covent Garden Cocktails', area: 'Covent Garden', postcode: 'WC2E 8RF' },
  { name: 'The Strand Tavern', area: 'Strand', postcode: 'WC2R 1AP' },
  { name: 'Charing Cross Bar', area: 'Charing Cross', postcode: 'WC2N 4HZ' },
  { name: 'Leicester Square Lounge', area: 'Leicester Square', postcode: 'WC2H 7NA' },
  { name: 'Piccadilly Restaurant', area: 'Piccadilly', postcode: 'W1J 9HL' },
  { name: 'St James Wine Cellar', area: 'St James', postcode: 'SW1Y 6AL' },
  { name: 'The Marylebone', area: 'Marylebone', postcode: 'W1U 3BW' },
  { name: 'Paddington Station Bar', area: 'Paddington', postcode: 'W2 1HB' },
  { name: 'Knightsbridge Dining', area: 'Knightsbridge', postcode: 'SW1X 7XL' },
  { name: 'Hyde Park Corner Pub', area: 'Hyde Park', postcode: 'SW1X 7TA' },
  { name: 'The Embankment', area: 'Embankment', postcode: 'WC2N 6NS' },
  { name: 'Trafalgar Square Tavern', area: 'Trafalgar Square', postcode: 'WC2N 5DN' },
  { name: 'The Regent Street Bar', area: 'Regent Street', postcode: 'W1B 5AH' },
  { name: 'Oxford Street Brasserie', area: 'Oxford Circus', postcode: 'W1C 1JN' },
  { name: 'Bond Street Wine Bar', area: 'Bond Street', postcode: 'W1S 1AN' },
  { name: 'Green Park Gastro', area: 'Green Park', postcode: 'SW1A 1BW' },
  { name: 'Westminster Bridge Bistro', area: 'Westminster Bridge', postcode: 'SE1 7GP' },
  { name: 'The Churchill Arms', area: 'Churchill Gardens', postcode: 'SW1V 3AT' },
  { name: 'Tate Britain Café', area: 'Millbank', postcode: 'SW1P 4RG' },
  { name: 'Vauxhall Bridge Tavern', area: 'Vauxhall', postcode: 'SW1V 1EH' },
  { name: 'The Pimlico Grill', area: 'Pimlico', postcode: 'SW1V 2NE' },
];

const NOTICE_TYPES = [
  'licensing-premises-new',
  'licensing-premises-variation',
  'licensing-club-premises',
  'gambling-premises-new',
  'gambling-premises-variation',
];

const RESIDENT_NAMES = [
  'Sarah Thompson', 'Michael Davies', 'Emma Wilson', 'James Brown',
  'Oliver Smith', 'Sophie Taylor', 'William Jones', 'Isabella Martin',
  'George Anderson', 'Charlotte White', 'Henry Robinson', 'Amelia Clark',
  'Thomas Lewis', 'Emily Walker', 'Jack Hall', 'Grace Allen',
];

const RESIDENT_ADDRESSES = [
  '12 Belgrave Square, London, SW1X 8PH',
  '45 Victoria Street, London, SW1H 0EU',
  '78 Grosvenor Place, London, SW1X 7SH',
  '23 Ebury Street, London, SW1W 0NZ',
  '56 Warwick Way, London, SW1V 1RY',
  '89 Vauxhall Bridge Road, London, SW1V 2SA',
  '34 Lupus Street, London, SW1V 3EB',
  '67 Cambridge Street, London, SW1V 4QQ',
  '91 Moreton Street, London, SW1V 2NY',
  '15 Charlwood Street, London, SW1V 2EE',
  '28 Sutherland Street, London, SW1V 4LD',
  '43 Gloucester Street, London, SW1V 2DB',
  '76 St Georges Drive, London, SW1V 4BJ',
  '52 Westmoreland Terrace, London, SW1V 4AG',
  '19 Hugh Street, London, SW1V 1QJ',
  '84 Wilton Road, London, SW1V 1DW',
];

async function main() {
  console.log('🏛️  Seeding Westminster Council Demo Data...\n');

  // Step 1: Create additional published notices (27 more to reach 38 total)
  console.log('📄 Creating 27 additional published notices...');

  const noticePromises = WESTMINSTER_VENUES.map((venue, idx) => {
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - (27 - idx)); // Stagger over last 27 days

    const deadlineDate = new Date(publishedAt);
    deadlineDate.setDate(deadlineDate.getDate() + 28);

    return supabase
      .from('notices')
      .insert({
        notice_type: NOTICE_TYPES[idx % NOTICE_TYPES.length],
        status: 'published',
        council_id: WESTMINSTER_COUNCIL_ID,
        premises: {
          name: venue.name,
          address: `${Math.floor(Math.random() * 200) + 1} ${venue.area} Road`,
          postcode: venue.postcode,
        },
        applicant_name: `${venue.name} Ltd`,
        application_date: publishedAt.toISOString().split('T')[0],
        published_at: publishedAt.toISOString(),
        deadline: deadlineDate.toISOString().split('T')[0],
        billing_amount: 49.99,
        payment_status: 'paid',
        billing_status: 'paid',
      });
  });

  await Promise.all(noticePromises);
  console.log('✅ Created 27 additional notices\n');

  // Step 2: Get all Westminster notices
  const { data: allNotices } = await supabase
    .from('notices')
    .select('id, premises, notice_type')
    .eq('council_id', WESTMINSTER_COUNCIL_ID)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (!allNotices || allNotices.length === 0) {
    console.error('❌ No notices found for Westminster');
    return;
  }

  console.log(`📊 Total published notices: ${allNotices.length}\n`);

  // Step 3: Create the "controversial" notice with 15 representations
  // Use the 5th most recent notice (index 4) as the controversial one
  const controversialNotice = allNotices[4];

  console.log(`🔥 Creating 15 representations on: ${controversialNotice.premises?.name}`);
  console.log(`   - 12 objections`);
  console.log(`   - 3 support letters\n`);

  const representationPromises = [];

  // Create 12 objections
  for (let i = 0; i < 12; i++) {
    representationPromises.push(
      supabase.from('representations').insert({
        notice_id: controversialNotice.id,
        type: 'objection',
        name: RESIDENT_NAMES[i],
        email: `${RESIDENT_NAMES[i].toLowerCase().replace(' ', '.')}@gmail.com`,
        address: RESIDENT_ADDRESSES[i],
        licensing_objectives: ['prevention_of_public_nuisance', 'prevention_of_crime'],
        comments: i % 2 === 0
          ? 'I object to this application due to concerns about late-night noise levels and disturbance to local residents.'
          : 'This premises would create significant public nuisance with extended licensing hours. The area already suffers from anti-social behavior on weekend evenings.',
        created_at: new Date(Date.now() - (12 - i) * 24 * 60 * 60 * 1000).toISOString(),
      })
    );
  }

  // Create 3 support letters
  for (let i = 12; i < 15; i++) {
    representationPromises.push(
      supabase.from('representations').insert({
        notice_id: controversialNotice.id,
        type: 'support',
        name: RESIDENT_NAMES[i],
        email: `${RESIDENT_NAMES[i].toLowerCase().replace(' ', '.')}@gmail.com`,
        address: RESIDENT_ADDRESSES[i],
        licensing_objectives: ['economic_benefit'],
        comments: i === 12
          ? 'This establishment will bring much-needed economic investment to our local area and create jobs.'
          : i === 13
          ? 'I support this application. The proprietors have an excellent track record of responsible premises management.'
          : 'This venue will enhance the local dining scene and attract visitors to Westminster.',
        created_at: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000).toISOString(),
      })
    );
  }

  await Promise.all(representationPromises);
  console.log('✅ Created 15 representations on controversial notice\n');

  // Step 4: Create 3 pending submissions from Wilson & Partners
  console.log('📝 Creating 3 pending submissions from Wilson & Partners...');

  const submissionData = [
    {
      name: 'The Chelsea Wine Bar',
      type: 'licensing-premises-new',
      area: 'Chelsea',
      postcode: 'SW3 5TN',
    },
    {
      name: 'Mayfair Late Night Bar',
      type: 'licensing-premises-variation',
      area: 'Mayfair',
      postcode: 'W1K 5BE',
    },
    {
      name: 'Westminster Gastro Pub',
      type: 'licensing-club-premises',
      area: 'Westminster',
      postcode: 'SW1P 2EJ',
    },
  ];

  const submissionPromises = submissionData.map((sub, idx) => {
    const submittedAt = new Date();
    submittedAt.setDate(submittedAt.getDate() - (3 - idx)); // Stagger over last 3 days

    return supabase.from('submissions').insert({
      source_organization_id: WILSON_ORG_ID,
      target_organization_id: WESTMINSTER_ORG_ID,
      target_department_id: WESTMINSTER_LICENSING_DEPT,
      status: 'pending',
      notice_type: sub.type,
      reference_number: `WP-${Date.now()}-${idx}`,
      notice_data: {
        applicant_name: `${sub.name} Limited`,
        premises: {
          name: sub.name,
          address: `${Math.floor(Math.random() * 200) + 1} ${sub.area} Street`,
          postcode: sub.postcode,
        },
        application_date: submittedAt.toISOString().split('T')[0],
      },
      firm_message: 'Please review this application for publication on behalf of our client.',
      submitted_at: submittedAt.toISOString(),
      submitted_by: 'f849cd70-2061-41ff-b9a2-9be95b73f4b5', // Wilson user ID
    });
  });

  await Promise.all(submissionPromises);
  console.log('✅ Created 3 pending submissions\n');

  // Step 5: Verify final counts
  console.log('📊 Final Westminster Council Data:');

  const { count: noticeCount } = await supabase
    .from('notices')
    .select('*', { count: 'exact', head: true })
    .eq('council_id', WESTMINSTER_COUNCIL_ID)
    .eq('status', 'published');

  const { count: submissionCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('target_organization_id', WESTMINSTER_ORG_ID)
    .eq('status', 'pending');

  const { count: repCount } = await supabase
    .from('representations')
    .select('*', { count: 'exact', head: true })
    .in('notice_id', allNotices.map(n => n.id));

  console.log(`   ✅ Published notices: ${noticeCount}`);
  console.log(`   ✅ Pending submissions: ${submissionCount}`);
  console.log(`   ✅ Representations: ${repCount}`);
  console.log(`\n🎉 Westminster demo data seeded successfully!`);
  console.log(`\n🌐 Access at: http://localhost:5173/c/westminster-city-of-council/licensing\n`);
}

main().catch(console.error);
