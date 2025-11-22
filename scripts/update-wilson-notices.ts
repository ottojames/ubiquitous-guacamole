#!/usr/bin/env tsx

/**
 * Update Wilson & Partners notices with realistic data
 * - Proper premises names
 * - Different councils
 * - Varied dates
 * - Some marked as paid
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

// Realistic London pub/bar/restaurant names
const premisesData = [
  { name: 'The Craft Brewery', address: '45 Shoreditch High Street, London, E1 6AN', postcode: 'E1 6AN', lat: 51.5225, lon: -0.0785 },
  { name: 'Artisan Wine Bar', address: '12 Frith Street, Soho, London, W1F 9GB', postcode: 'W1F 9GB', lat: 51.5146, lon: -0.1351 },
  { name: 'The Social Hub', address: '78 Kings Road, Chelsea, London, SW3 3TD', postcode: 'SW3 3TD', lat: 51.4927, lon: -0.1664 },
  { name: 'Corner Bistro', address: '23 Upper Street, Islington, London, N1 9AG', postcode: 'N1 9AG', lat: 51.5396, lon: -0.1034 },
  { name: 'The Garden Pub', address: '156 Borough High Street, Southwark, London, SE1 2PY', postcode: 'SE1 2PY', lat: 51.5049, lon: -0.0869 },
  { name: 'Metropolitan Bar', address: '34 St John Street, Clerkenwell, London, EC1V 2NX', postcode: 'EC1V 2NX', lat: 51.5259, lon: -0.1014 },
  { name: 'The Kitchen', address: '89 Camden High Street, London, NW1 8NH', postcode: 'NW1 8NH', lat: 51.5400, lon: -0.1433 },
  { name: 'Cocktail Lounge', address: '67 Westbourne Grove, Paddington, London, W2 1JU', postcode: 'W2 1JU', lat: 51.5153, lon: -0.1754 },
  { name: 'The Borough Tavern', address: '12 Cabot Square, Canary Wharf, London, E14 5AB', postcode: 'E14 5AB', lat: 51.5074, lon: -0.0234 },
  { name: 'Urban Diner', address: '45 Victoria Street, Westminster, London, SW1V 1HU', postcode: 'SW1V 1HU', lat: 51.4946, lon: -0.1435 },
  { name: 'The Riverside', address: '123 Brick Lane, Shoreditch, London, E1 6SB', postcode: 'E1 6SB', lat: 51.5215, lon: -0.0721 },
  { name: 'City Grill', address: '56 Dean Street, Soho, London, W1D 6AQ', postcode: 'W1D 6AQ', lat: 51.5138, lon: -0.1323 },
  { name: 'The Market Bar', address: '234 Fulham Road, Chelsea, London, SW10 9NA', postcode: 'SW10 9NA', lat: 51.4836, lon: -0.1825 },
  { name: 'The Square Cafe', address: '67 Essex Road, Islington, London, N1 2SF', postcode: 'N1 2SF', lat: 51.5362, lon: -0.0991 },
  { name: 'Junction House', address: '89 Tooley Street, Southwark, London, SE1 2TF', postcode: 'SE1 2TF', lat: 51.5037, lon: -0.0779 },
  { name: 'The Station', address: '145 Clerkenwell Road, London, EC1R 5BX', postcode: 'EC1R 5BX', lat: 51.5242, lon: -0.1089 },
  { name: 'Park View Pub', address: '78 Parkway, Camden, London, NW1 7AH', postcode: 'NW1 7AH', lat: 51.5389, lon: -0.1452 },
  { name: 'The Crown & Anchor', address: '234 Edgware Road, Paddington, London, W2 1DW', postcode: 'W2 1DW', lat: 51.5167, lon: -0.1623 },
  { name: 'High Street Bar', address: '45 West India Avenue, Canary Wharf, London, E14 8EZ', postcode: 'E14 8EZ', lat: 51.5063, lon: -0.0209 },
  { name: 'The Exchange', address: '12 Strutton Ground, Westminster, London, SW1P 2HP', postcode: 'SW1P 2HP', lat: 51.4973, lon: -0.1329 },
  { name: 'Bridge Tavern', address: '67 Commercial Street, Shoreditch, London, E1 6BD', postcode: 'E1 6BD', lat: 51.5189, lon: -0.0751 },
  { name: 'The Quarter Bar', address: '89 Berwick Street, Soho, London, W1F 0QB', postcode: 'W1F 0QB', lat: 51.5131, lon: -0.1354 }
];

// Council IDs for different areas
const councils = [
  { id: '02cb9c23-92bb-4f51-9e1a-30698dccffb6', name: 'Westminster City Council', areas: ['SW1V', 'W1D', 'W1F', 'SW1P', 'W2'] },
  { id: 'a75ebdf7-590a-4a03-9b8f-8fce7fcfca98', name: 'Camden Council', areas: ['NW1'] },
  { id: '642ae863-314e-44a5-a2e0-273fc14e6ad2', name: 'Islington Council', areas: ['N1'] },
  { id: '868b27fd-5ae3-4583-bb55-88238fde6b5e', name: 'Southwark Council', areas: ['SE1'] },
  { id: '30c23363-2edb-4397-b426-ebca5ca54ea1', name: 'Tower Hamlets Council', areas: ['E1', 'E14', 'EC1'] }
];

function getCouncilForPostcode(postcode: string) {
  const prefix = postcode.split(' ')[0];
  for (const council of councils) {
    if (council.areas.some(area => prefix.startsWith(area))) {
      return council;
    }
  }
  return councils[0]; // Default to Westminster
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log('🔄 Updating Wilson & Partners notices with realistic data...\n');

  // Get all Wilson notices
  const { data: notices, error: fetchError } = await supabase
    .from('notices')
    .select('id, premises')
    .eq('published_by_organization_id', WILSON_ORG_ID)
    .order('created_at', { ascending: true });

  if (fetchError || !notices) {
    console.error('❌ Error fetching notices:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${notices.length} notices to update\n`);

  const today = new Date();

  // Update each notice with realistic data
  for (let i = 0; i < notices.length; i++) {
    const notice = notices[i];
    const premises = premisesData[i];
    const council = getCouncilForPostcode(premises.postcode);

    // Vary the dates: published 1-30 days ago
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const publishedAt = addDays(today, -daysAgo);
    const deadline = addDays(publishedAt, 28);

    // Mark first 10 as paid (older notices), rest as pending
    const isPaid = i < 10;
    const paymentStatus = isPaid ? 'paid' : 'pending';
    const billingStatus = isPaid ? 'paid' : 'pending';

    const { error: updateError } = await supabase
      .from('notices')
      .update({
        premises: {
          name: premises.name,
          address: premises.address,
          postcode: premises.postcode
        },
        council_id: council.id,
        organization_id: council.id,
        latitude: premises.lat,
        longitude: premises.lon,
        published_at: publishedAt.toISOString(),
        representation_deadline: deadline.toISOString(),
        payment_status: paymentStatus,
        billing_status: billingStatus,
        description: `${premises.name} - ${notice.id.includes('licensing') ? 'New premises licence' : 'Gambling premises'} application`
      })
      .eq('id', notice.id);

    if (updateError) {
      console.error(`❌ Error updating notice ${i + 1}:`, updateError);
    } else {
      console.log(`✅ ${i + 1}. ${premises.name} → ${council.name} (${paymentStatus})`);
    }
  }

  // Update billing transactions to match
  console.log('\n🔄 Updating billing transaction statuses...\n');

  // Get all transactions
  const { data: transactions, error: txError } = await supabase
    .from('billing_transactions')
    .select('id, notice_id')
    .eq('organization_id', WILSON_ORG_ID)
    .order('created_at', { ascending: true });

  if (txError) {
    console.error('❌ Error fetching transactions:', txError);
    process.exit(1);
  }

  // Mark first 10 as succeeded (paid)
  for (let i = 0; i < transactions!.length; i++) {
    const tx = transactions![i];
    const status = i < 10 ? 'succeeded' : 'pending';

    const { error: txUpdateError } = await supabase
      .from('billing_transactions')
      .update({ status })
      .eq('id', tx.id);

    if (txUpdateError) {
      console.error(`❌ Error updating transaction ${i + 1}:`, txUpdateError);
    }
  }

  // Calculate new outstanding balance
  const { data: summary } = await supabase
    .from('billing_transactions')
    .select('amount, type, status')
    .eq('organization_id', WILSON_ORG_ID);

  let outstanding = 0;
  if (summary) {
    summary.forEach(t => {
      if (t.type === 'charge' && t.status === 'pending') {
        outstanding += Number(t.amount);
      }
    });
  }

  console.log('\n📊 Summary:');
  console.log(`   Total notices: 22`);
  console.log(`   Paid: 10`);
  console.log(`   Pending: 12`);
  console.log(`   Outstanding balance: £${outstanding.toFixed(2)}`);
  console.log(`   Paid to date: £${(1099.78 - outstanding).toFixed(2)}\n`);

  console.log('✅ Wilson & Partners notices updated!');
}

main().catch(console.error);
