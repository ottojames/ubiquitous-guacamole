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

async function addTestRepresentations() {
  console.log('Adding test representations...');

  const noticeId = '550e8400-e29b-41d4-a716-446655440001';

  const testRepresentations = [
    {
      id: '750e8400-e29b-41d4-a001-446655440001',
      notice_id: noticeId,
      representor_name: 'John Resident',
      representor_email: 'john@example.com',
      representor_address: '25 High Street, Sheffield',
      representation_text: 'I object to this application due to noise concerns.',
      type: 'objection',
      grounds: ['noise', 'public-nuisance'],
      submitted_at: new Date().toISOString(),
      is_anonymous: false
    },
    {
      id: '750e8400-e29b-41d4-a002-446655440001',
      notice_id: noticeId,
      representor_name: 'Sarah Neighbor',
      representor_email: 'sarah@example.com',
      representor_address: '27 High Street, Sheffield',
      representation_text: 'I support this application as it will benefit the local community.',
      type: 'support',
      grounds: [],
      submitted_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      is_anonymous: false
    },
    {
      id: '750e8400-e29b-41d4-a003-446655440001',
      notice_id: noticeId,
      representor_name: 'Local Business Owner',
      representor_email: 'business@example.com',
      representor_address: '30 High Street, Sheffield',
      representation_text: 'The proposed hours are too late and will affect other businesses.',
      type: 'objection',
      grounds: ['hours', 'crime-disorder'],
      submitted_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      is_anonymous: false
    }
  ];

  const { data, error } = await supabase
    .from('representations')
    .insert(testRepresentations)
    .select();

  if (error) {
    console.error('Error adding representations:', error);
    return;
  }

  console.log(`Successfully added ${data.length} test representations for The Pilot Inn`);
  console.log('Representation IDs:', data.map(r => r.id).join(', '));
}

addTestRepresentations().then(() => process.exit(0));