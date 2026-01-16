import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestNotices() {
  const notices = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      notice_type: 'premises-licence',
      title: 'The Pilot Inn - New Premises Licence Application',
      description: 'Application for new premises licence to sell alcohol',
      council_id: null,
      department_id: null,
      location: {
        type: 'Point',
        coordinates: [-0.141, 51.501]  // Near Buckingham Palace
      },
      address: 'The Pilot Inn, 1 Palace Road, Westminster, London, SW1A 1AA',
      extras: {
        applicant: 'John Smith',
        premises: { name: 'The Pilot Inn', address: '1 Palace Road, Westminster, London, SW1A 1AA' },
        activities: ['Sale of alcohol (on and off premises)'],
        hours: 'Monday-Sunday: 11:00-23:00'
      },
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      notice_type: 'premises-licence',
      title: 'The Crown Hotel - Premises Licence Variation',
      description: 'Application to vary premises licence - extend hours',
      council_id: null,
      department_id: null,
      location: {
        type: 'Point',
        coordinates: [-0.140, 51.502]
      },
      address: 'The Crown Hotel, 5 Victoria Street, Westminster, London, SW1A 2AB',
      extras: {
        applicant: 'Crown Hotels Ltd',
        premises: { name: 'The Crown Hotel', address: '5 Victoria Street, Westminster, London, SW1A 2AB' },
        activities: ['Sale of alcohol (on premises)', 'Live music'],
        hours: 'Proposed: Monday-Sunday: 10:00-01:00'
      },
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      notice_type: 'premises-licence',
      title: 'Palace View Restaurant - New Premises Licence',
      description: 'New restaurant premises licence application',
      council_id: null,
      department_id: null,
      location: {
        type: 'Point',
        coordinates: [-0.142, 51.500]
      },
      address: 'Palace View Restaurant, 10 Constitution Hill, Westminster, London, SW1A 1BA',
      extras: {
        applicant: 'Restaurant Group PLC',
        premises: { name: 'Palace View Restaurant', address: '10 Constitution Hill, Westminster, London, SW1A 1BA' },
        activities: ['Sale of alcohol (on premises)', 'Late night refreshment'],
        hours: 'Monday-Sunday: 12:00-00:00'
      },
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  for (const notice of notices) {
    const { error } = await supabase
      .from('notices')
      .upsert(notice, { onConflict: 'id' });

    if (error) {
      console.error('Error inserting notice:', error);
    } else {
      console.log('✓ Added notice:', notice.title);
    }
  }
}

addTestNotices()
  .then(() => {
    console.log('✅ Test notices added successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });