#!/usr/bin/env tsx

/**
 * Seed Wilson & Partners with 22 active licensing notices
 * Total outstanding billing: £1099.78
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const WILSON_ORG_ID = '00000000-0000-0000-0000-000000000101';

// Calculate billing amounts that total £1099.78
// Standard notice price: £49.99
// 22 notices = 22 × £49.99 = £1099.78
const NOTICE_PRICE = 49.99;

const licensingNoticeTypes = [
  'licensing-premises-new',
  'licensing-premises-variation',
  'licensing-club-premises',
  'gambling-premises-new',
  'gambling-premises-variation'
];

const londonPostcodes = [
  { postcode: 'E1 6AN', area: 'Shoreditch', lat: 51.5225, lon: -0.0785 },
  { postcode: 'W1F 9GB', area: 'Soho', lat: 51.5146, lon: -0.1351 },
  { postcode: 'SW3 3TD', area: 'Chelsea', lat: 51.4927, lon: -0.1664 },
  { postcode: 'N1 9AG', area: 'Islington', lat: 51.5396, lon: -0.1034 },
  { postcode: 'SE1 2PY', area: 'Southwark', lat: 51.5049, lon: -0.0869 },
  { postcode: 'EC1V 2NX', area: 'Clerkenwell', lat: 51.5259, lon: -0.1014 },
  { postcode: 'NW1 8NH', area: 'Camden', lat: 51.5400, lon: -0.1433 },
  { postcode: 'W2 1JU', area: 'Paddington', lat: 51.5153, lon: -0.1754 },
  { postcode: 'E14 5AB', area: 'Canary Wharf', lat: 51.5074, lon: -0.0234 },
  { postcode: 'SW1V 1HU', area: 'Victoria', lat: 51.4946, lon: -0.1435 },
];

const premisesNames = [
  'The Craft Brewery', 'Artisan Wine Bar', 'The Social Hub', 'Corner Bistro',
  'The Garden Pub', 'Metropolitan Bar', 'The Kitchen', 'Cocktail Lounge',
  'The Borough Tavern', 'Urban Diner', 'The Riverside', 'City Grill',
  'The Market Bar', 'The Square Cafe', 'Junction House', 'The Station',
  'Park View Pub', 'The Crown & Anchor', 'High Street Bar', 'The Exchange',
  'Bridge Tavern', 'The Quarter Bar'
];

const clientNames = [
  'Smith Hospitality Ltd', 'Green Leisure Group', 'Urban Venues PLC',
  'Thames Restaurants Ltd', 'City Bars Limited', 'Modern Dining Co',
  'London Taverns Ltd', 'Metropolitan Pubs', 'Riverside Hospitality',
  'Borough Bars Ltd', 'Central London Venues', 'Premier Leisure Group'
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const today = new Date();

async function main() {
  console.log('🎯 Creating 22 licensing notices for Wilson & Partners...\n');

  // Get Wilson org
  const { data: wilsonOrg, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', WILSON_ORG_ID)
    .single();

  if (orgError || !wilsonOrg) {
    console.error('❌ Wilson & Partners not found');
    process.exit(1);
  }

  console.log(`✅ Found organization: ${wilsonOrg.name}\n`);

  // Create 22 notices
  const notices = [];

  for (let i = 0; i < 22; i++) {
    const postcode = londonPostcodes[i % londonPostcodes.length];
    const noticeType = licensingNoticeTypes[i % licensingNoticeTypes.length];
    const premisesName = premisesNames[i];
    const clientName = clientNames[i % clientNames.length];

    // Dates: published over the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const publishedAt = addDays(today, -daysAgo);

    // Consultation deadline: 28 days from published date
    const deadline = addDays(publishedAt, 28);

    const notice = {
      notice_type: noticeType,
      status: 'published',
      published_by_organization_id: WILSON_ORG_ID,
      is_public: true,
      published_at: publishedAt.toISOString(),
      representation_deadline: deadline.toISOString(),
      billing_status: 'pending',
      payment_status: 'pending',
      billing_amount: NOTICE_PRICE,
      client_reference: `WP-${String(i + 1).padStart(4, '0')}`,

      premises: {
        name: premisesName,
        address: `${Math.floor(Math.random() * 200) + 1} ${postcode.area} Road, London, ${postcode.postcode}`,
        postcode: postcode.postcode
      },

      applicant: {
        name: clientName,
        email: `contact@${clientName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        address: `London Office, ${postcode.area}`
      },

      description: `${noticeType === 'licensing-premises-new' ? 'New premises licence application' :
                     noticeType === 'licensing-premises-variation' ? 'Variation of premises licence' :
                     noticeType === 'licensing-club-premises' ? 'Club premises certificate application' :
                     noticeType === 'gambling-premises-new' ? 'New gambling premises licence' :
                     'Variation of gambling premises licence'} for ${premisesName}. Application submitted on behalf of ${clientName}.`,

      latitude: postcode.lat,
      longitude: postcode.lon,
      contact_email: 'james.wilson@wilsonpartners.com'
    };

    notices.push(notice);
  }

  // Insert all notices
  const { data: inserted, error: insertError } = await supabase
    .from('notices')
    .insert(notices)
    .select('id, notice_type, premises, billing_amount');

  if (insertError) {
    console.error('❌ Error inserting notices:', insertError);
    process.exit(1);
  }

  console.log(`✅ Created ${inserted.length} notices\n`);

  // Calculate totals
  const totalBilling = inserted.reduce((sum, n) => sum + (n.billing_amount || 0), 0);
  const licensingCount = inserted.filter(n =>
    n.notice_type.includes('licensing') || n.notice_type.includes('gambling')
  ).length;

  console.log('📊 Summary:');
  console.log(`   Total notices: ${inserted.length}`);
  console.log(`   Licensing/Gambling notices: ${licensingCount}`);
  console.log(`   Total billing: £${totalBilling.toFixed(2)}`);
  console.log(`   Outstanding: £${totalBilling.toFixed(2)} (all pending)\n`);

  console.log('✅ Wilson & Partners demo data ready!');
}

main().catch(console.error);
