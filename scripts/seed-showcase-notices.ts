#!/usr/bin/env tsx
/**
 * Seed Showcase Notices Script
 *
 * Creates 30 diverse notices for demo purposes:
 * - Licensing (11 notices): premises licenses, variations, reviews
 * - Planning (10 notices): major applications, listed buildings
 * - Traffic (4 notices): TROs, road closures
 * - Gambling (3 notices): betting shops, bingo halls
 * - GVOL (2 notices): operator licenses
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

const DEPARTMENTS = {
  bristol: 'eceb3fcb-fc69-415c-8bc7-83e023e321a8',
  westminster: '53c08600-5c5a-46a4-8805-16c129022952',
};

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

const today = new Date();

// Coordinates
const locs = {
  bristol: [
    { latitude: 51.4493, longitude: -2.5993 }, { latitude: 51.4630, longitude: -2.6177 },
    { latitude: 51.4645, longitude: -2.5865 }, { latitude: 51.4585, longitude: -2.5870 },
    { latitude: 51.4395, longitude: -2.5990 }, { latitude: 51.4730, longitude: -2.6040 },
    { latitude: 51.4565, longitude: -2.5810 }, { latitude: 51.4658, longitude: -2.6115 },
    { latitude: 51.4625, longitude: -2.5885 }, { latitude: 51.4820, longitude: -2.5425 },
    { latitude: 51.4420, longitude: -2.6100 }, { latitude: 51.4685, longitude: -2.5835 },
    { latitude: 51.4395, longitude: -2.5720 }, { latitude: 51.4895, longitude: -2.6215 },
    { latitude: 51.4785, longitude: -2.5950 },
  ],
  westminster: [
    { latitude: 51.5136, longitude: -0.1359 }, { latitude: 51.5123, longitude: -0.1220 },
    { latitude: 51.4900, longitude: -0.1340 }, { latitude: 51.5085, longitude: -0.1450 },
    { latitude: 51.5225, longitude: -0.1545 }, { latitude: 51.4965, longitude: -0.1435 },
    { latitude: 51.5205, longitude: -0.1390 }, { latitude: 51.4985, longitude: -0.1525 },
    { latitude: 51.5155, longitude: -0.1755 }, { latitude: 51.5045, longitude: -0.1375 },
    { latitude: 51.4995, longitude: -0.1248 }, { latitude: 51.5015, longitude: -0.1610 },
    { latitude: 51.5120, longitude: -0.1870 }, { latitude: 51.5290, longitude: -0.1545 },
    { latitude: 51.5074, longitude: -0.1657 },
  ],
};

const showcaseNotices = [
  // BRISTOL NOTICES (15)
  // Licensing (6)
  {
    notice_type: 'licensing-premises-new',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'Application for extended opening hours until 02:00 Friday-Saturday',
    premises: { name: 'The Old Vic Theatre', address: 'King Street, Bristol, BS1 4ED', postcode: 'BS1 4ED' },
    ...locs.bristol[0],
    applicant: { name: 'Old Vic Theatre Company Ltd', companyNumber: '12345678', contactEmail: 'info@oldvic.com' },
    consultation: { repsDeadline: toISODate(addDays(today, 2)) },
    representation_deadline: toISODateTime(addDays(today, 2)),
    published_at: toISODateTime(addDays(today, -26)),
    contact_email: 'licensing@bristol.gov.uk',
  },
  {
    notice_type: 'licensing-premises-new',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'New application for sale of alcohol and regulated entertainment',
    premises: { name: 'Clifton Wine Cellar', address: '42 Princess Victoria St, Clifton, BS8 4BX', postcode: 'BS8 4BX' },
    ...locs.bristol[1],
    applicant: { name: 'Bristol Hospitality Group', companyNumber: '87654321', contactEmail: 'info@bristolhosp.co.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 5)) },
    representation_deadline: toISODateTime(addDays(today, 5)),
    published_at: toISODateTime(addDays(today, -23)),
    contact_email: 'licensing@bristol.gov.uk',
  },
  {
    notice_type: 'licensing-premises-new',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'Variation to add live music performances Thursday-Saturday',
    premises: { name: 'The Gallimaufry', address: '27 St Michael\'s Hill, Bristol, BS2 8DX', postcode: 'BS2 8DX' },
    ...locs.bristol[2],
    applicant: { name: 'Gallimaufry Arts Ltd', contactEmail: 'info@gallimaufry.co.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 15)) },
    representation_deadline: toISODateTime(addDays(today, 15)),
    published_at: toISODateTime(addDays(today, -13)),
    contact_email: 'licensing@bristol.gov.uk',
  },
  {
    notice_type: 'licensing-premises-new',
    status: 'pending_approval',
    department_id: DEPARTMENTS.bristol,
    description: 'New craft beer taproom with late-night food',
    premises: { name: 'Bristol Brewhouse', address: '156 North Street, Bedminster, BS3 1HE', postcode: 'BS3 1HE' },
    ...locs.bristol[4],
    applicant: { name: 'Independent Brewing Co', contactEmail: 'info@indiebrewing.com' },
    contact_email: 'licensing@bristol.gov.uk',
  },
  {
    notice_type: 'licensing-premises-new',
    status: 'draft',
    department_id: DEPARTMENTS.bristol,
    description: 'Coffee and cocktails establishment',
    premises: { name: 'The Daily Grind', address: '78 Whiteladies Road, BS8 2NH', postcode: 'BS8 2NH' },
    ...locs.bristol[7],
    applicant: { name: 'Daily Grind Ltd', contactEmail: 'info@dailygrind.co.uk' },
    contact_email: 'licensing@bristol.gov.uk',
  },
  {
    notice_type: 'licensing-premises-new',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'Extend hours for community events until midnight',
    premises: { name: 'Malcolm X Centre', address: '141 City Road, St Paul\'s, BS2 8YH', postcode: 'BS2 8YH' },
    ...locs.bristol[2],
    applicant: { name: 'St Paul\'s Carnival Association', contactEmail: 'info@stpaulscarnival.org' },
    consultation: { repsDeadline: toISODate(addDays(today, 21)) },
    representation_deadline: toISODateTime(addDays(today, 21)),
    published_at: toISODateTime(addDays(today, -7)),
    contact_email: 'licensing@bristol.gov.uk',
  },

  // Planning (5)
  {
    notice_type: 'planning-application',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'Demolition of former industrial buildings and construction of 150 flats with ground-floor retail',
    premises: { name: 'Former Courage Brewery Site', address: 'Victoria Street, Temple Meads, BS1 6DT', postcode: 'BS1 6DT' },
    ...locs.bristol[0],
    applicant: { name: 'Redrow Homes Southwest', contactEmail: 'bristol@redrow.co.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 18)) },
    representation_deadline: toISODateTime(addDays(today, 18)),
    published_at: toISODateTime(addDays(today, -3)),
    contact_email: 'planning@bristol.gov.uk',
  },
  {
    notice_type: 'planning-application',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'New visitor centre and café facility',
    premises: { name: 'Clifton Suspension Bridge', address: 'Bridge Road, Clifton, BS8 3PA', postcode: 'BS8 3PA' },
    ...locs.bristol[1],
    applicant: { name: 'Clifton Suspension Bridge Trust', contactEmail: 'info@cliftonbridge.org.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 12)) },
    representation_deadline: toISODateTime(addDays(today, 12)),
    published_at: toISODateTime(addDays(today, -9)),
    contact_email: 'planning@bristol.gov.uk',
  },
  {
    notice_type: 'planning-application',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'Single storey rear extension and loft conversion to Grade II listed Victorian terrace',
    premises: { name: '45 Pembroke Road', address: 'Pembroke Road, Redland, BS6 6QR', postcode: 'BS6 6QR' },
    ...locs.bristol[5],
    applicant: { name: 'Mrs. Sarah Williams', contactEmail: 'sarah.williams@email.com' },
    consultation: { repsDeadline: toISODate(addDays(today, 1)) },
    representation_deadline: toISODateTime(addDays(today, 1)),
    published_at: toISODateTime(addDays(today, -20)),
    contact_email: 'planning@bristol.gov.uk',
  },
  {
    notice_type: 'planning-application',
    status: 'draft',
    department_id: DEPARTMENTS.bristol,
    description: 'Change of use from commercial to 6 residential flats above shops',
    premises: { name: '23-29 Fishponds Road', address: 'Fishponds, BS16 3UT', postcode: 'BS16 3UT' },
    ...locs.bristol[9],
    applicant: { name: 'Bristol Property Developers Ltd', contactEmail: 'info@bristolpropdev.co.uk' },
    contact_email: 'planning@bristol.gov.uk',
  },
  {
    notice_type: 'planning-application',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'Installation of solar panels on community centre roof',
    premises: { name: 'Totterdown Community Centre', address: 'Wells Road, Totterdown, BS4 2AQ', postcode: 'BS4 2AQ' },
    ...locs.bristol[12],
    applicant: { name: 'Bristol Energy Cooperative', contactEmail: 'info@bristolenergy.coop' },
    consultation: { repsDeadline: toISODate(addDays(today, 14)) },
    representation_deadline: toISODateTime(addDays(today, 14)),
    published_at: toISODateTime(addDays(today, -7)),
    contact_email: 'planning@bristol.gov.uk',
  },

  // Traffic (2)
  {
    notice_type: 'tro-permanent',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'Permanent closure to motor vehicles Monday-Saturday 10am-6pm',
    premises: { name: 'Park Street', address: 'Park Street, City Centre, BS1 5NA', postcode: 'BS1 5NA' },
    latitude: 51.4538, longitude: -2.6020,
    applicant: { name: 'Bristol City Council Highways', contactEmail: 'highways@bristol.gov.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 6)) },
    representation_deadline: toISODateTime(addDays(today, 6)),
    published_at: toISODateTime(addDays(today, -8)),
    contact_email: 'traffic@bristol.gov.uk',
  },
  {
    notice_type: 'tro-temporary',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'Temporary road closure for gas main replacement, 6 weeks',
    premises: { name: 'Gloucester Road', address: 'Gloucester Road, Bishopston, BS7 8AS', postcode: 'BS7 8AS' },
    ...locs.bristol[14],
    applicant: { name: 'Wales & West Utilities', contactEmail: 'roadworks@wwutilities.co.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 3)) },
    representation_deadline: toISODateTime(addDays(today, 3)),
    published_at: toISODateTime(addDays(today, -11)),
    contact_email: 'traffic@bristol.gov.uk',
  },

  // Gambling (1)
  {
    notice_type: 'gambling-premises',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'New betting office with self-service terminals',
    premises: { name: 'BetZone', address: '67 Broadmead, BS1 3EA', postcode: 'BS1 3EA' },
    ...locs.bristol[3],
    applicant: { name: 'National Betting Corporation', companyNumber: '99887766', contactEmail: 'licensing@betzone.co.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 19)) },
    representation_deadline: toISODateTime(addDays(today, 19)),
    published_at: toISODateTime(addDays(today, -9)),
    contact_email: 'licensing@bristol.gov.uk',
  },

  // GVOL (1)
  {
    notice_type: 'gvol-new',
    status: 'published',
    department_id: DEPARTMENTS.bristol,
    description: 'New goods vehicle operator licence for 15 vehicles operating from Bristol depot',
    premises: { name: 'Bristol Logistics Depot', address: 'Avonmouth Way, Avonmouth, BS11 9YA', postcode: 'BS11 9YA' },
    latitude: 51.5085, longitude: -2.6950,
    applicant: { name: 'Bristol Logistics Ltd', companyNumber: '11223344', contactEmail: 'ops@bristollogistics.co.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 21)) },
    representation_deadline: toISODateTime(addDays(today, 21)),
    published_at: toISODateTime(today),
    contact_email: 'gvol@bristol.gov.uk',
  },

  // WESTMINSTER NOTICES (15)
  // Licensing (5)
  {
    notice_type: 'licensing-premises-new',
    status: 'published',
    department_id: DEPARTMENTS.westminster,
    description: 'Application to extend alcohol sales until 03:00 Friday-Saturday',
    premises: { name: 'The Vintage House', address: '42 Old Compton Street, Soho, W1D 4TY', postcode: 'W1D 4TY' },
    ...locs.westminster[0],
    applicant: { name: 'Soho Hospitality Group Ltd', companyNumber: '23456789', contactEmail: 'licensing@sohohospitality.com' },
    consultation: { repsDeadline: toISODate(addDays(today, 4)) },
    representation_deadline: toISODateTime(addDays(today, 4)),
    published_at: toISODateTime(addDays(today, -24)),
    contact_email: 'premiseslicensing@westminster.gov.uk',
  },
  {
    notice_type: 'licensing-premises-new',
    status: 'published',
    department_id: DEPARTMENTS.westminster,
    description: 'New licence for theatre café with wine bar',
    premises: { name: 'Royal Opera House Café', address: 'Bow Street, Covent Garden, WC2E 9DD', postcode: 'WC2E 9DD' },
    ...locs.westminster[1],
    applicant: { name: 'Royal Opera House Ltd', contactEmail: 'licensing@roh.org.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 8)) },
    representation_deadline: toISODateTime(addDays(today, 8)),
    published_at: toISODateTime(addDays(today, -20)),
    contact_email: 'premiseslicensing@westminster.gov.uk',
  },
  {
    notice_type: 'licensing-premises-new',
    status: 'published',
    department_id: DEPARTMENTS.westminster,
    description: 'Add outdoor seating area with 20 covers',
    premises: { name: 'The Orange Public House', address: '37 Pimlico Road, SW1W 8NE', postcode: 'SW1W 8NE' },
    ...locs.westminster[2],
    applicant: { name: 'Orange Pubs Ltd', contactEmail: 'ops@orangepubs.co.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 17)) },
    representation_deadline: toISODateTime(addDays(today, 17)),
    published_at: toISODateTime(addDays(today, -11)),
    contact_email: 'premiseslicensing@westminster.gov.uk',
  },
  {
    notice_type: 'licensing-premises-new',
    status: 'pending_approval',
    department_id: DEPARTMENTS.westminster,
    description: 'Exclusive members club with restaurant and bar',
    premises: { name: 'The Mayfair Club', address: '15 Berkeley Square, W1J 6EG', postcode: 'W1J 6EG' },
    ...locs.westminster[3],
    applicant: { name: 'Mayfair Clubs International', contactEmail: 'info@mayfairclub.co.uk' },
    contact_email: 'premiseslicensing@westminster.gov.uk',
  },
  {
    notice_type: 'licensing-premises-new',
    status: 'draft',
    department_id: DEPARTMENTS.westminster,
    description: 'Fine dining restaurant with wine pairing',
    premises: { name: 'La Belle Époque', address: '89 Marylebone High Street, W1U 4QW', postcode: 'W1U 4QW' },
    ...locs.westminster[4],
    applicant: { name: 'French Cuisine Ltd', contactEmail: 'info@labelleepoque.co.uk' },
    contact_email: 'premiseslicensing@westminster.gov.uk',
  },

  // Planning (5)
  {
    notice_type: 'planning-application',
    status: 'published',
    department_id: DEPARTMENTS.westminster,
    description: 'Major redevelopment including 120 residential units and commercial space',
    premises: { name: 'Victoria Station Quarter', address: 'Victoria Street, SW1E 5ND', postcode: 'SW1E 5ND' },
    ...locs.westminster[5],
    applicant: { name: 'Land Securities Group', contactEmail: 'development@landsec.com' },
    consultation: { repsDeadline: toISODate(addDays(today, 16)) },
    representation_deadline: toISODateTime(addDays(today, 16)),
    published_at: toISODateTime(addDays(today, -5)),
    contact_email: 'planningservices@westminster.gov.uk',
  },
  {
    notice_type: 'planning-application',
    status: 'published',
    department_id: DEPARTMENTS.westminster,
    description: 'Restoration of Grade I listed Georgian townhouse',
    premises: { name: '23 Charlotte Street', address: 'Charlotte Street, Fitzrovia, W1T 1RJ', postcode: 'W1T 1RJ' },
    ...locs.westminster[6],
    applicant: { name: 'Heritage Properties Trust', contactEmail: 'info@heritageproperties.org.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 9)) },
    representation_deadline: toISODateTime(addDays(today, 9)),
    published_at: toISODateTime(addDays(today, -12)),
    contact_email: 'planningservices@westminster.gov.uk',
  },
  {
    notice_type: 'planning-application',
    status: 'published',
    department_id: DEPARTMENTS.westminster,
    description: 'Single storey rear extension and basement excavation',
    premises: { name: '14 Eaton Mews West', address: 'Belgravia, SW1W 9EE', postcode: 'SW1W 9EE' },
    ...locs.westminster[7],
    applicant: { name: 'Mr. James Robertson', contactEmail: 'j.robertson@email.com' },
    consultation: { repsDeadline: toISODate(addDays(today, 13)) },
    representation_deadline: toISODateTime(addDays(today, 13)),
    published_at: toISODateTime(addDays(today, -8)),
    contact_email: 'planningservices@westminster.gov.uk',
  },
  {
    notice_type: 'planning-application',
    status: 'draft',
    department_id: DEPARTMENTS.westminster,
    description: 'Change of use from office (Class E) to 45 residential apartments',
    premises: { name: 'Canalside House', address: 'Paddington Basin, W2 1DG', postcode: 'W2 1DG' },
    ...locs.westminster[8],
    applicant: { name: 'Urban Regeneration Partners', contactEmail: 'info@urbanregen.co.uk' },
    contact_email: 'planningservices@westminster.gov.uk',
  },
  {
    notice_type: 'planning-application',
    status: 'published',
    department_id: DEPARTMENTS.westminster,
    description: 'Enhancement of pedestrian areas and landscaping',
    premises: { name: 'St James\'s Park', address: 'The Mall, SW1A 2BJ', postcode: 'SW1A 2BJ' },
    ...locs.westminster[9],
    applicant: { name: 'The Royal Parks', contactEmail: 'info@royalparks.org.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 20)) },
    representation_deadline: toISODateTime(addDays(today, 20)),
    published_at: toISODateTime(addDays(today, -1)),
    contact_email: 'planningservices@westminster.gov.uk',
  },

  // Traffic (2)
  {
    notice_type: 'tro-permanent',
    status: 'published',
    department_id: DEPARTMENTS.westminster,
    description: 'Permanent prohibition of motor vehicles on Oxford Street between Tottenham Court Road and Oxford Circus',
    premises: { name: 'Oxford Street', address: 'Oxford Street, West End, W1D 1BS', postcode: 'W1D 1BS' },
    latitude: 51.5155, longitude: -0.1410,
    applicant: { name: 'Westminster Highways Department', contactEmail: 'highways@westminster.gov.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 7)) },
    representation_deadline: toISODateTime(addDays(today, 7)),
    published_at: toISODateTime(addDays(today, -7)),
    contact_email: 'highways@westminster.gov.uk',
  },
  {
    notice_type: 'tro-experimental',
    status: 'published',
    department_id: DEPARTMENTS.westminster,
    description: 'Experimental 20mph speed limit for 18 months',
    premises: { name: 'Knightsbridge', address: 'Knightsbridge, SW1X 7XL', postcode: 'SW1X 7XL' },
    ...locs.westminster[11],
    applicant: { name: 'Westminster Highways Department', contactEmail: 'highways@westminster.gov.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 10)) },
    representation_deadline: toISODateTime(addDays(today, 10)),
    published_at: toISODateTime(addDays(today, -4)),
    contact_email: 'highways@westminster.gov.uk',
  },

  // Gambling (2)
  {
    notice_type: 'gambling-premises',
    status: 'published',
    department_id: DEPARTMENTS.westminster,
    description: 'New bingo premises with 200 seats and gaming machines',
    premises: { name: 'Lucky Stars Bingo', address: '145 Queensway, Bayswater, W2 4YN', postcode: 'W2 4YN' },
    ...locs.westminster[12],
    applicant: { name: 'Bingo Entertainment Group', companyNumber: '55667788', contactEmail: 'licensing@bingogroup.co.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 22)) },
    representation_deadline: toISODateTime(addDays(today, 22)),
    published_at: toISODateTime(addDays(today, -6)),
    contact_email: 'licensing@westminster.gov.uk',
  },
  {
    notice_type: 'gambling-premises',
    status: 'pending_approval',
    department_id: DEPARTMENTS.westminster,
    description: 'Adult gaming centre with category B and C machines',
    premises: { name: 'Park Lane Gaming', address: '89 Park Lane, NW1 4NR', postcode: 'NW1 4NR' },
    ...locs.westminster[13],
    applicant: { name: 'Gaming Ventures Ltd', companyNumber: '44556677', contactEmail: 'info@gamingventures.co.uk' },
    contact_email: 'licensing@westminster.gov.uk',
  },

  // GVOL (1)
  {
    notice_type: 'gvol-new',
    status: 'published',
    department_id: DEPARTMENTS.westminster,
    description: 'New operator licence for 8 light goods vehicles',
    premises: { name: 'Westminster Courier Services', address: 'Hyde Park Corner, W1J 7NT', postcode: 'W1J 7NT' },
    ...locs.westminster[14],
    applicant: { name: 'Westminster Couriers Ltd', companyNumber: '33445566', contactEmail: 'ops@westcouriers.co.uk' },
    consultation: { repsDeadline: toISODate(addDays(today, 25)) },
    representation_deadline: toISODateTime(addDays(today, 25)),
    published_at: toISODateTime(addDays(today, -3)),
    contact_email: 'gvol@westminster.gov.uk',
  },
];

async function seedNotices() {
  console.log('🌱 Starting notice seeding...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const notice of showcaseNotices) {
    try {
      const { data, error } = await supabase
        .from('notices')
        .insert({
          ...notice,
          is_public: true,
          created_at: toISODateTime(addDays(today, -Math.floor(Math.random() * 30))),
          updated_at: toISODateTime(today),
        })
        .select();

      if (error) {
        console.error(`❌ Failed to insert "${notice.premises.name}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Inserted: ${notice.premises.name}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error inserting "${notice.premises.name}":`, err);
      errorCount++;
    }
  }

  console.log(`\n📊 Seeding complete:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${showcaseNotices.length}\n`);

  // Summary by type
  const byType = showcaseNotices.reduce((acc, n) => {
    acc[n.notice_type] = (acc[n.notice_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📋 Breakdown by type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  // Summary by status
  const byStatus = showcaseNotices.reduce((acc, n) => {
    acc[n.status] = (acc[n.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n📊 Breakdown by status:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  // Summary by location
  const byDept = showcaseNotices.reduce((acc, n) => {
    const dept = n.department_id === DEPARTMENTS.bristol ? 'Bristol' : 'Westminster';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n🗺️  Breakdown by location:');
  Object.entries(byDept).forEach(([dept, count]) => {
    console.log(`   ${dept}: ${count}`);
  });
}

seedNotices()
  .then(() => {
    console.log('✨ All done!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
