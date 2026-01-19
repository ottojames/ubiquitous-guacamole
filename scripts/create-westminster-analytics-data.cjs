const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createWestminsterAnalyticsData() {
  try {
    console.log('Creating Westminster analytics test data...\n');

    const westminsterOrgId = '0e536037-48c3-4196-8fb6-c31803621050';
    const westminsterCouncilId = '02cb9c23-92bb-4f51-9e1a-30698dccffb6'; // Westminster in councils table
    const licensingDeptId = '2145bf45-da2d-421d-8d8e-8ad46bc6bbef';
    const planningDeptId = '3f825911-43bc-4fb4-9557-6ad93d3760c8';

    // Create various notices for Westminster with different statuses and dates
    const notices = [
      {
        id: '550e8400-e29b-41d4-a701-446655440001',
        applicant_name: 'Crown Tavern Ltd',
        council_id: westminsterCouncilId,
        department_id: licensingDeptId,
        notice_type: 'premises-licence',
        applicant: 'Crown Tavern Ltd',
        status: 'published',
        published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        location: 'POINT(-0.1425 51.4975)', // Westminster coordinates
        premises_address: '15 Victoria Street, Westminster, SW1H 0AH',
        description: 'The Crown Tavern - New Premises Licence',
        preview_text: 'Application for new premises licence at The Crown Tavern, 15 Victoria Street',
        representation_deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days from now
        extras: {
          premises_name: 'The Crown Tavern',
          premises_address: '15 Victoria Street, Westminster, SW1H 0AH',
          activities: ['sale_of_alcohol'],
          opening_hours: 'Monday-Sunday 11:00-23:00',
          deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString() // 18 days from now
        }
      },
      {
        id: '550e8400-e29b-41d4-a701-446655440002',
        applicant_name: 'Red Lion Pub Co',
        council_id: westminsterCouncilId,
        department_id: licensingDeptId,
        notice_type: 'variation',
        applicant: 'Red Lion Pub Co',
        status: 'published',
        published_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        location: 'POINT(-0.1276 51.5073)', // Westminster coordinates
        premises_address: '48 Parliament Street, Westminster, SW1A 2NH',
        description: 'The Red Lion - Premises Licence Variation',
        preview_text: 'Application to vary premises licence at The Red Lion, 48 Parliament Street',
        representation_deadline: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
        extras: {
          premises_name: 'The Red Lion',
          premises_address: '48 Parliament Street, Westminster, SW1A 2NH',
          activities: ['sale_of_alcohol', 'live_music'],
          deadline: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: '550e8400-e29b-41d4-a701-446655440003',
        applicant_name: 'Westminster Plaza Developments Ltd',
        council_id: westminsterCouncilId,
        department_id: planningDeptId,
        notice_type: 'planning-application',
        applicant: 'Westminster Plaza Developments Ltd',
        status: 'published',
        published_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        location: 'POINT(-0.1359 51.4952)', // Westminster coordinates
        premises_address: 'Westminster Plaza, Victoria Street, Westminster',
        description: 'Westminster Plaza - Planning Application',
        preview_text: 'Erection of 5-storey mixed-use development at Westminster Plaza',
        representation_deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        extras: {
          application_reference: 'PP/2026/00123',
          description: 'Erection of 5-storey mixed-use development',
          deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: '550e8400-e29b-41d4-a701-446655440004',
        applicant_name: 'Blue Moon Entertainment Ltd',
        council_id: westminsterCouncilId,
        department_id: licensingDeptId,
        notice_type: 'premises-licence',
        applicant: 'Blue Moon Entertainment Ltd',
        status: 'draft',
        published_at: null,
        location: 'POINT(-0.1337 51.5007)', // Westminster coordinates
        premises_address: '82 Shaftesbury Avenue, Westminster, W1D 6ND',
        description: 'Blue Moon Bar - New Premises Licence',
        preview_text: 'Application for new premises licence at Blue Moon Bar',
        extras: {
          premises_name: 'Blue Moon Bar',
          premises_address: '82 Shaftesbury Avenue, Westminster, W1D 6ND'
        }
      },
      {
        id: '550e8400-e29b-41d4-a701-446655440005',
        applicant_name: 'Golden Eagle Holdings',
        council_id: westminsterCouncilId,
        department_id: licensingDeptId,
        notice_type: 'transfer',
        applicant: 'Golden Eagle Holdings',
        status: 'published',
        published_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
        location: 'POINT(-0.1415 51.4985)', // Westminster coordinates
        premises_address: '99 Marylebone High Street, Westminster, W1U 4QB',
        description: 'The Golden Eagle - Transfer of Licence',
        preview_text: 'Application to transfer premises licence for The Golden Eagle',
        representation_deadline: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(), // Expired
        extras: {
          premises_name: 'The Golden Eagle',
          premises_address: '99 Marylebone High Street, Westminster, W1U 4QB',
          deadline: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString() // Expired
        }
      }
    ];

    // Insert notices
    for (const notice of notices) {
      const { data, error } = await supabase
        .from('notices')
        .upsert(notice)
        .select()
        .single();

      if (error) {
        console.error(`Error creating notice ${notice.description}:`, error.message);
      } else {
        console.log(`✓ Created notice: ${notice.description}`);
      }
    }

    // Update existing representations to link to our new notices
    const { data: existingReps, error: repsError } = await supabase
      .from('representations')
      .select('id')
      .limit(6);

    if (existingReps && existingReps.length > 0) {
      // Link first 3 reps to The Crown Tavern
      for (let i = 0; i < Math.min(3, existingReps.length); i++) {
        await supabase
          .from('representations')
          .update({ notice_id: '550e8400-e29b-41d4-a701-446655440001' })
          .eq('id', existingReps[i].id);
      }
      console.log('\n✓ Linked 3 representations to The Crown Tavern');

      // Link next 2 reps to The Red Lion
      for (let i = 3; i < Math.min(5, existingReps.length); i++) {
        await supabase
          .from('representations')
          .update({ notice_id: '550e8400-e29b-41d4-a701-446655440002' })
          .eq('id', existingReps[i].id);
      }
      console.log('✓ Linked 2 representations to The Red Lion');

      // Link last rep to Westminster Plaza
      if (existingReps.length > 5) {
        await supabase
          .from('representations')
          .update({ notice_id: '550e8400-e29b-41d4-a701-446655440003' })
          .eq('id', existingReps[5].id);
        console.log('✓ Linked 1 representation to Westminster Plaza');
      }
    }

    console.log('\n✅ Westminster analytics test data created successfully!');
    console.log('\nSummary:');
    console.log('- 5 notices (3 published, 1 draft, 1 expired)');
    console.log('- 2 departments (Licensing, Planning)');
    console.log('- 6 representations linked');
    console.log('\nAnalytics page should now show data when logged in as Westminster Council.');

  } catch (err) {
    console.error('Error creating test data:', err);
  }
}

createWestminsterAnalyticsData();