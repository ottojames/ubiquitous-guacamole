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

async function addFirmNotices() {
  console.log('Adding firm notices...');

  const orgId = '850e8400-e29b-41d4-f001-446655440001';

  // Create test notices with valid UUIDs (changed 'n' to 'a' to make valid UUID)
  const firmNotices = [
    {
      id: '650e8400-e29b-41d4-a001-446655440001',
      notice_type: 'premises-licence',
      status: 'published',
      organization_id: orgId,
      premises: {
        name: 'The Crown',
        address: '10 King Street, London',
        postcode: 'W1A 1AA'
      },
      applicant: {
        name: 'Crown Holdings Ltd',
        email: 'crown@example.com'
      },
      consultation: {
        repsDeadline: '2026-02-20',
        applicationDate: '2026-01-10'
      },
      extras: {
        activities: ['sale-of-alcohol']
      },
      preview_text: 'Premises licence application for The Crown',
      latitude: 51.5074,
      longitude: -0.1278
    },
    {
      id: '650e8400-e29b-41d4-a002-446655440001',
      notice_type: 'variation',
      status: 'draft',
      organization_id: orgId,
      premises: {
        name: 'Jazz Club',
        address: '42 Music Lane, London',
        postcode: 'W1D 3QY'
      },
      applicant: {
        name: 'Jazz Entertainment Ltd',
        email: 'jazz@example.com'
      },
      consultation: {
        repsDeadline: '2026-02-25',
        applicationDate: '2026-01-15'
      },
      extras: {
        activities: ['live-music', 'recorded-music']
      },
      preview_text: 'Variation application for Jazz Club',
      latitude: 51.5159,
      longitude: -0.1314
    }
  ];

  const { data: noticeData, error: noticeError } = await supabase
    .from('notices')
    .insert(firmNotices)
    .select();

  if (noticeError) {
    console.error('Error creating firm notices:', noticeError);
    return;
  }

  console.log(`Successfully created ${noticeData.length} test notices for Wilson & Partners`);
  console.log('Notice IDs:', noticeData.map(n => n.id).join(', '));
}

addFirmNotices().then(() => process.exit(0)).catch(console.error);