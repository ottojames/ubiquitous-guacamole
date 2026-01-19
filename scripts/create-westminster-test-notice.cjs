require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestNotice() {
  // Find Westminster Licensing department
  const { data: dept } = await supabase
    .from('departments')
    .select('id, name, organization_id')
    .eq('id', '2145bf45-da2d-421d-8d8e-8ad46bc6bbef')
    .single();

  console.log('Westminster Licensing dept:', dept);

  if (!dept) {
    console.log('Westminster Licensing department not found!');
    return;
  }

  // Create a test notice for Westminster
  const noticeData = {
    id: '550e8400-e29b-41d4-a001-446655440001', // New ID for Westminster test
    notice_type: 'premises-licence',
    status: 'published',
    department_id: dept.id,
    premises: {
      name: 'The Crown Tavern',
      address: '25 Victoria Street, Westminster',
      postcode: 'SW1H 0EX'
    },
    applicant: {
      name: 'Westminster Pub Company Ltd',
      email: 'admin@westminster-pubs.com',
      address: '100 Victoria Street, Westminster, SW1E 5JL'
    },
    consultation: {
      repsDeadline: '2026-02-28',
      applicationDate: '2026-01-15'
    },
    publication: {
      newspaper: 'Westminster Gazette',
      targetDate: '2026-01-20'
    },
    extras: {
      activities: ['sale-of-alcohol', 'live-music'],
      hours: {
        monday: '11:00 - 23:00',
        tuesday: '11:00 - 23:00',
        wednesday: '11:00 - 23:00',
        thursday: '11:00 - 23:00',
        friday: '11:00 - 00:00',
        saturday: '11:00 - 00:00',
        sunday: '12:00 - 22:30'
      },
      applicationReference: 'WCC/LIC/2026/001'
    },
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    location: `POINT(-0.1357 51.4975)` // PostGIS format: POINT(longitude latitude)
  };

  const { data, error } = await supabase
    .from('notices')
    .insert(noticeData);

  if (error) {
    console.error('Error creating notice:', error);
  } else {
    console.log('Successfully created Westminster test notice with ID:', noticeData.id);

    // Verify it was created
    const { data: checkNotice } = await supabase
      .from('notices')
      .select('id, department_id, notice_type, premises')
      .eq('id', noticeData.id)
      .single();

    console.log('Created notice:', checkNotice);
  }
}

createTestNotice().catch(console.error);