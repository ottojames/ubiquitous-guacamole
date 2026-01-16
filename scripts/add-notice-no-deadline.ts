import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addNoticeWithoutDeadline() {
  console.log('Adding notice without deadline for testing...');

  const noticeData = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    notice_type: 'premises-licence',
    status: 'published',
    premises_name: 'The Crown Hotel',
    premises_address: '456 Main Road, Sheffield',
    premises_postcode: 'S32 5UY',
    reps_deadline: null, // No deadline set
    application_date: '2026-01-10',
    publication_date: '2026-01-10',
    latitude: 53.3811,
    longitude: -1.4701,
    council_id: '2145bf45-da2d-421d-8d8e-8ad46bc6bbef',
    department_id: '2145bf45-da2d-421d-8d8e-8ad46bc6bbef',
    extras: {
      applicantName: 'Crown Hotels Ltd',
      applicantEmail: 'info@crownhotels.com',
      applicantAddress: '456 Main Road, Sheffield',
      activities: ['Sale of alcohol', 'Live music', 'Dancing'],
      openingHours: 'Monday-Sunday: 11:00-23:00',
      noticeCategory: 'licensing',
      newspaper: 'Sheffield Telegraph',
      viewUrl: 'https://example.com/notice/550e8401'
    }
  };

  const { data, error } = await supabase
    .from('notices')
    .upsert(noticeData, { onConflict: 'id' });

  if (error) {
    console.error('Error adding notice:', error);
  } else {
    console.log('✅ Successfully added notice without deadline: The Crown Hotel');
    console.log('Notice ID:', '550e8400-e29b-41d4-a716-446655440002');
  }
}

addNoticeWithoutDeadline();