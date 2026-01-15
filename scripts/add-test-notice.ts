import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTestNotice() {
  console.log('Adding test notice for The Pilot Inn...');

  const testNotice = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    notice_type: 'premises-licence',
    status: 'published',
    premises: {
      name: 'The Pilot Inn',
      address: '123 High Street, Sheffield',
      postcode: 'S32 5UY'
    },
    applicant: {
      name: 'John Smith',
      email: 'john@example.com',
      address: '456 Main Road, Sheffield'
    },
    consultation: {
      repsDeadline: '2026-02-15',
      applicationDate: '2026-01-01'
    },
    publication: {
      newspaper: 'Sheffield Telegraph',
      targetDate: '2026-01-05'
    },
    extras: {
      viewUrl: 'https://example.com/notice/550e8400',
      applicationReference: 'PL/2026/001',
      activities: ['sale-of-alcohol'],
      hours: {
        monday: '11:00 - 23:00',
        tuesday: '11:00 - 23:00',
        wednesday: '11:00 - 23:00',
        thursday: '11:00 - 23:00',
        friday: '11:00 - 00:00',
        saturday: '11:00 - 00:00',
        sunday: '12:00 - 22:30'
      }
    },
    preview_text: 'Application for a new premises licence for The Pilot Inn, 123 High Street, Sheffield, S32 5UY',
    // Coordinates for Sheffield area
    latitude: 53.3811,
    longitude: -1.4701
  };

  const { data, error } = await supabase
    .from('notices')
    .insert([testNotice])
    .select()
    .single();

  if (error) {
    console.error('Error adding notice:', error);
    return;
  }

  console.log('Successfully added test notice:', data.id);
  console.log('Notice can be searched with postcode: S325UY or S32 5UY');
}

addTestNotice().then(() => process.exit(0));