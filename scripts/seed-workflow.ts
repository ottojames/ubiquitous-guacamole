#!/usr/bin/env tsx
/**
 * Seed Workflow Data Script
 *
 * Creates realistic workflow data for demo:
 * - 10-15 clients for firms
 * - 12 submissions (5 new, 3 under review, 2 changes requested, 2 accepted)
 * - 8 draft notices in various stages of completion
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

// Organization IDs
const WILSON_PARTNERS = '00000000-0000-0000-0000-000000000101';
const THOMPSON_LEGAL = '00000000-0000-0000-0000-000000000102';
const BRISTOL_COUNCIL = '468c3cdb-549e-440c-b033-83ef1aa76b46';
const WESTMINSTER_COUNCIL = 'fb76a8aa-4e3d-40ac-9c61-e9217ed930a4';

// User ID for created_by fields (using existing user)
const DEMO_USER = '7fcf25e1-4f01-44b1-9990-dedc911a5f79';
const COUNCIL_OFFICER = '3c5acd1b-270f-4f57-90cf-8f13a5447bb1';

// Client names
const businessNames = [
  'The Crown & Anchor Ltd',
  'Riverside Restaurant Group',
  'Urban Spirits Limited',
  'Nightlife Venues Plc',
  'Heritage Pubs Company',
  'City Bars & Restaurants',
  'Green Dragon Hotels Ltd',
  'Metro Entertainment Group',
  'Artisan Dining Ltd',
  'Craft Beer Holdings',
  'Elite Hospitality Services',
  'Golden Lion Properties',
  'Park Lane Restaurants',
  'Soho Venues Limited',
  'Bristol Breweries Co',
];

function generateCompanyNumber() {
  return String(Math.floor(Math.random() * 90000000) + 10000000);
}

async function getDepartmentIds() {
  const { data: depts } = await supabase
    .from('departments')
    .select('id, name, organization_id')
    .in('organization_id', [BRISTOL_COUNCIL, WESTMINSTER_COUNCIL]);

  const bristolLicensing = depts?.find(d => d.organization_id === BRISTOL_COUNCIL && d.name === 'Licensing')?.id;
  const bristolPlanning = depts?.find(d => d.organization_id === BRISTOL_COUNCIL && d.name === 'Planning')?.id;
  const westminsterLicensing = depts?.find(d => d.organization_id === WESTMINSTER_COUNCIL && d.name === 'Licensing')?.id;
  const westminsterPlanning = depts?.find(d => d.organization_id === WESTMINSTER_COUNCIL && d.name === 'Planning')?.id;

  return { bristolLicensing, bristolPlanning, westminsterLicensing, westminsterPlanning };
}

async function seedClients() {
  console.log('🏢 Creating clients...\n');

  const clients: any[] = [];

  // 8 clients for Wilson & Partners
  for (let i = 0; i < 8; i++) {
    clients.push({
      organization_id: WILSON_PARTNERS,
      name: businessNames[i],
      type: 'business',
      contact_email: `info@${businessNames[i].toLowerCase().replace(/[^a-z0-9]/g, '')}.co.uk`,
      contact_phone: `020 ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`,
      company_number: generateCompanyNumber(),
      status: 'active',
      created_by: DEMO_USER,
    });
  }

  // 7 clients for Thompson Legal
  for (let i = 8; i < 15; i++) {
    clients.push({
      organization_id: THOMPSON_LEGAL,
      name: businessNames[i],
      type: 'business',
      contact_email: `contact@${businessNames[i].toLowerCase().replace(/[^a-z0-9]/g, '')}.co.uk`,
      contact_phone: `0117 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
      company_number: generateCompanyNumber(),
      status: 'active',
      created_by: DEMO_USER,
    });
  }

  let successCount = 0;
  const insertedClients: any[] = [];

  for (const client of clients) {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create ${client.name}:`, error.message);
    } else {
      console.log(`✅ Created client: ${client.name}`);
      insertedClients.push(data);
      successCount++;
    }
  }

  console.log(`\n✨ Clients created: ${successCount}/${clients.length}\n`);
  return insertedClients;
}

async function seedSubmissions(clientIds: string[], deptIds: any) {
  console.log('📤 Creating submissions...\n');

  const submissions: any[] = [];

  // 5 new submissions (awaiting review)
  submissions.push(
    {
      source_organization_id: WILSON_PARTNERS,
      client_id: clientIds[0],
      target_department_id: deptIds.bristolLicensing,
      target_organization_id: BRISTOL_COUNCIL,
      status: 'new',
      notice_type: 'licensing-premises-new',
      notice_data: {
        applicant: { name: 'The Crown & Anchor Ltd' },
        premises: { name: 'The Crown & Anchor', address: '45 Park Street, Bristol BS1 5NH' },
      },
      firm_message: 'Please find attached our client\'s premises licence application.',
      submitted_by: DEMO_USER,
    },
    {
      source_organization_id: WILSON_PARTNERS,
      client_id: clientIds[1],
      target_department_id: deptIds.westminsterLicensing,
      target_organization_id: WESTMINSTER_COUNCIL,
      status: 'new',
      notice_type: 'licensing-premises-variation',
      notice_data: {
        applicant: { name: 'Riverside Restaurant Group' },
        premises: { name: 'Thames View Restaurant', address: '12 Victoria Street, London SW1E 5ND' },
      },
      submitted_by: DEMO_USER,
    },
    {
      source_organization_id: THOMPSON_LEGAL,
      client_id: clientIds[8],
      target_department_id: deptIds.bristolPlanning,
      target_organization_id: BRISTOL_COUNCIL,
      status: 'new',
      notice_type: 'planning-major',
      notice_data: {
        applicant: { name: 'Park Lane Restaurants' },
        site: { address: '78 Whiteladies Road, Bristol BS8 2QX' },
      },
      firm_message: 'Planning application for change of use to restaurant.',
      submitted_by: DEMO_USER,
    },
    {
      source_organization_id: THOMPSON_LEGAL,
      client_id: clientIds[9],
      target_department_id: deptIds.westminsterPlanning,
      target_organization_id: WESTMINSTER_COUNCIL,
      status: 'new',
      notice_type: 'planning-listed',
      notice_data: {
        applicant: { name: 'Soho Venues Limited' },
        site: { address: '23 Frith Street, London W1D 4RR' },
      },
      submitted_by: DEMO_USER,
    },
    {
      source_organization_id: WILSON_PARTNERS,
      client_id: clientIds[2],
      target_department_id: deptIds.bristolLicensing,
      target_organization_id: BRISTOL_COUNCIL,
      status: 'new',
      notice_type: 'licensing-premises-new',
      notice_data: {
        applicant: { name: 'Urban Spirits Limited' },
        premises: { name: 'Urban Spirits Bar', address: '156 Gloucester Road, Bristol BS7 8NT' },
      },
      submitted_by: DEMO_USER,
    }
  );

  // 3 under review (assigned to officer)
  submissions.push(
    {
      source_organization_id: WILSON_PARTNERS,
      client_id: clientIds[3],
      target_department_id: deptIds.bristolLicensing,
      target_organization_id: BRISTOL_COUNCIL,
      status: 'under_review',
      notice_type: 'licensing-premises-variation',
      notice_data: {
        applicant: { name: 'Nightlife Venues Plc' },
        premises: { name: 'The Electric Club', address: '89 Stokes Croft, Bristol BS1 3RW' },
      },
      assigned_to: COUNCIL_OFFICER,
      assigned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      council_response: 'Under review by licensing team.',
      submitted_by: DEMO_USER,
    },
    {
      source_organization_id: THOMPSON_LEGAL,
      client_id: clientIds[10],
      target_department_id: deptIds.westminsterLicensing,
      target_organization_id: WESTMINSTER_COUNCIL,
      status: 'under_review',
      notice_type: 'licensing-premises-new',
      notice_data: {
        applicant: { name: 'Elite Hospitality Services' },
        premises: { name: 'Mayfair Lounge', address: '67 Piccadilly, London W1J 0DX' },
      },
      assigned_to: COUNCIL_OFFICER,
      assigned_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      submitted_by: DEMO_USER,
    },
    {
      source_organization_id: THOMPSON_LEGAL,
      client_id: clientIds[11],
      target_department_id: deptIds.bristolPlanning,
      target_organization_id: BRISTOL_COUNCIL,
      status: 'under_review',
      notice_type: 'planning-major',
      notice_data: {
        applicant: { name: 'Golden Lion Properties' },
        site: { address: '234 Fishponds Road, Bristol BS16 3HG' },
      },
      assigned_to: COUNCIL_OFFICER,
      assigned_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      council_response: 'Planning officer reviewing documentation.',
      submitted_by: DEMO_USER,
    }
  );

  // 2 changes requested
  submissions.push(
    {
      source_organization_id: WILSON_PARTNERS,
      client_id: clientIds[4],
      target_department_id: deptIds.bristolLicensing,
      target_organization_id: BRISTOL_COUNCIL,
      status: 'changes_requested',
      notice_type: 'licensing-premises-new',
      notice_data: {
        applicant: { name: 'Heritage Pubs Company' },
        premises: { name: 'The Old Duke', address: '12 King Street, Bristol BS1 4EF' },
      },
      assigned_to: COUNCIL_OFFICER,
      assigned_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      council_response: 'Please provide additional noise management details.',
      requested_changes: {
        items: [
          'Operating schedule needs more detail on noise control measures',
          'Site plan is missing fire exit routes',
        ],
      },
      submitted_by: DEMO_USER,
    },
    {
      source_organization_id: THOMPSON_LEGAL,
      client_id: clientIds[12],
      target_department_id: deptIds.westminsterPlanning,
      target_organization_id: WESTMINSTER_COUNCIL,
      status: 'changes_requested',
      notice_type: 'planning-conservation',
      notice_data: {
        applicant: { name: 'Bristol Breweries Co' },
        site: { address: '45 Regent Street, London W1B 4JY' },
      },
      assigned_to: COUNCIL_OFFICER,
      council_response: 'Conservation officer requires amended elevation drawings.',
      requested_changes: {
        items: ['Heritage impact assessment needed', 'Materials specification incomplete'],
      },
      submitted_by: DEMO_USER,
    }
  );

  // 2 accepted (linked to notices)
  const { data: existingNotices } = await supabase
    .from('notices')
    .select('id')
    .eq('status', 'published')
    .limit(2);

  if (existingNotices && existingNotices.length >= 2) {
    submissions.push(
      {
        source_organization_id: WILSON_PARTNERS,
        client_id: clientIds[5],
        target_department_id: deptIds.bristolLicensing,
        target_organization_id: BRISTOL_COUNCIL,
        status: 'accepted',
        notice_type: 'licensing-premises-new',
        notice_data: {
          applicant: { name: 'City Bars & Restaurants' },
          premises: { name: 'City Social', address: '98 Queens Road, Bristol BS8 1LN' },
        },
        assigned_to: COUNCIL_OFFICER,
        created_notice_id: existingNotices[0].id,
        council_response: 'Application accepted and published.',
        submitted_by: DEMO_USER,
      },
      {
        source_organization_id: THOMPSON_LEGAL,
        client_id: clientIds[13],
        target_department_id: deptIds.westminsterLicensing,
        target_organization_id: WESTMINSTER_COUNCIL,
        status: 'accepted',
        notice_type: 'licensing-premises-variation',
        notice_data: {
          applicant: { name: 'Artisan Dining Ltd' },
          premises: { name: 'Artisan Kitchen', address: '34 Bond Street, London W1S 2RP' },
        },
        assigned_to: COUNCIL_OFFICER,
        created_notice_id: existingNotices[1].id,
        council_response: 'Variation accepted and notice published.',
        submitted_by: DEMO_USER,
      }
    );
  }

  let successCount = 0;

  for (const submission of submissions) {
    const { error } = await supabase.from('submissions').insert(submission);

    if (error) {
      console.error(`❌ Failed to create submission:`, error.message);
    } else {
      console.log(`✅ Created ${submission.status} submission: ${submission.notice_data.applicant?.name || submission.notice_data.site?.address}`);
      successCount++;
    }
  }

  console.log(`\n✨ Submissions created: ${successCount}/${submissions.length}\n`);
}

async function seedDrafts(deptIds: any) {
  console.log('📝 Creating draft notices...\n');

  const drafts = [
    // Bristol Licensing - Nearly complete
    {
      created_by: DEMO_USER,
      organization_id: BRISTOL_COUNCIL,
      department_id: deptIds.bristolLicensing,
      notice_category: 'licensing',
      notice_definition_id: 'licensing-premises-new',
      draft_name: 'The Botanist - New Premises Licence',
      form_data: {
        APPLICANT_NAME: 'The Botanist Bristol Ltd',
        PREMISES_NAME: 'The Botanist',
        PREMISES_ADDRESS: '45 Queens Road, Clifton, Bristol BS8 1QE',
        LICENSABLE_ACTIVITIES: 'Sale of alcohol, live music, late night refreshment',
        // Missing: opening hours, deadline dates
      },
      notes: 'Awaiting final operating schedule from applicant',
    },
    // Bristol Planning - Early stage
    {
      created_by: DEMO_USER,
      organization_id: BRISTOL_COUNCIL,
      department_id: deptIds.bristolPlanning,
      notice_category: 'planning',
      notice_definition_id: 'planning-major',
      draft_name: 'Harbourside Development - Major Application',
      form_data: {
        APPLICANT_NAME: 'Harbourside Developments Ltd',
        SITE_ADDRESS: 'Former Warehouse, Wapping Wharf, Bristol BS1 6WE',
        // Very incomplete - just started
      },
      notes: 'Initial draft - awaiting full application documents',
    },
    // Westminster Licensing - Mid-stage
    {
      created_by: DEMO_USER,
      organization_id: WESTMINSTER_COUNCIL,
      department_id: deptIds.westminsterLicensing,
      notice_category: 'licensing',
      notice_definition_id: 'licensing-premises-variation',
      draft_name: 'Soho Jazz Club - Hours Variation',
      form_data: {
        APPLICANT_NAME: 'Soho Entertainment Ltd',
        PREMISES_NAME: 'Ronnie Scott\'s Jazz Club',
        PREMISES_ADDRESS: '47 Frith Street, Soho, London W1D 4HT',
        NATURE_OF_VARIATION: 'Extend closing time to 03:00 Fri-Sat',
        // Missing: consultation details
      },
      notes: 'Need to confirm representation period',
    },
    // Westminster Planning - Nearly complete
    {
      created_by: DEMO_USER,
      organization_id: WESTMINSTER_COUNCIL,
      department_id: deptIds.westminsterPlanning,
      notice_category: 'planning',
      notice_definition_id: 'planning-listed',
      draft_name: 'Mayfair Townhouse - Listed Building Works',
      form_data: {
        APPLICANT_NAME: 'Mayfair Heritage Properties',
        SITE_ADDRESS: '12 Berkeley Square, London W1J 6BS',
        PROPOSAL_DESCRIPTION: 'Internal alterations to Grade II listed townhouse',
        APPLICATION_REFERENCE: 'WCC/2025/PLN/0234',
      },
      notes: 'Heritage statement approved - ready to publish',
    },
    // Bristol Licensing - Mid-stage
    {
      created_by: DEMO_USER,
      organization_id: BRISTOL_COUNCIL,
      department_id: deptIds.bristolLicensing,
      notice_category: 'licensing',
      notice_definition_id: 'licensing-premises-review',
      draft_name: 'Kings Arms - Licence Review',
      form_data: {
        PREMISES_NAME: 'The Kings Arms',
        PREMISES_ADDRESS: '78 Stokes Croft, Bristol BS1 3QU',
        REVIEW_APPLICANT_NAME: 'Avon & Somerset Police',
        // Incomplete
      },
      notes: 'Awaiting police report',
    },
    // Westminster Licensing - Early stage
    {
      created_by: DEMO_USER,
      organization_id: WESTMINSTER_COUNCIL,
      department_id: deptIds.westminsterLicensing,
      notice_category: 'licensing',
      notice_definition_id: 'licensing-premises-new',
      draft_name: 'Covent Garden Bar - New Application',
      form_data: {
        PREMISES_NAME: 'The Ivy Market Grill',
        PREMISES_ADDRESS: '1 Henrietta Street, Covent Garden, WC2E 8PS',
        // Just started
      },
    },
    // Bristol Planning - Mid-stage
    {
      created_by: DEMO_USER,
      organization_id: BRISTOL_COUNCIL,
      department_id: deptIds.bristolPlanning,
      notice_category: 'planning',
      notice_definition_id: 'planning-conservation',
      draft_name: 'Clifton Village Shop Conversion',
      form_data: {
        APPLICANT_NAME: 'Clifton Properties Ltd',
        SITE_ADDRESS: 'Unit 4, Princess Victoria Street, Bristol BS8 4BX',
        PROPOSAL_DESCRIPTION: 'Change of use from retail to cafe',
      },
      notes: 'Conservation area consent required',
    },
    // Westminster Planning - Early stage
    {
      created_by: DEMO_USER,
      organization_id: WESTMINSTER_COUNCIL,
      department_id: deptIds.westminsterPlanning,
      notice_category: 'planning',
      notice_definition_id: 'planning-departure',
      draft_name: 'Oxford Street Retail Development',
      form_data: {
        SITE_ADDRESS: '234-240 Oxford Street, London W1C 1DH',
        // Minimal info
      },
      notes: 'Pre-application discussion stage',
    },
  ];

  let successCount = 0;

  for (const draft of drafts) {
    const { error } = await supabase.from('drafts').insert(draft);

    if (error) {
      console.error(`❌ Failed to create draft:`, error.message);
    } else {
      console.log(`✅ Created draft: ${draft.draft_name}`);
      successCount++;
    }
  }

  console.log(`\n✨ Drafts created: ${successCount}/${drafts.length}\n`);
}

async function main() {
  console.log('🌱 Starting workflow data seeding...\n');

  // Get department IDs
  const deptIds = await getDepartmentIds();
  console.log('📋 Department IDs retrieved\n');

  // Seed clients
  const clients = await seedClients();
  const clientIds = clients.map(c => c.id);

  // Seed submissions
  await seedSubmissions(clientIds, deptIds);

  // Seed drafts
  await seedDrafts(deptIds);

  console.log('✅ Workflow seeding complete!\n');
}

main()
  .then(() => {
    console.log('✅ All done!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
