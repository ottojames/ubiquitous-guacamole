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

async function addSampletonborough() {
  console.log('Adding Sampletonborough Council...');

  // Create Sampletonborough Council
  const councilId = '950e8400-e29b-41d4-c001-446655440001';
  const { data: council, error: councilError } = await supabase
    .from('councils')
    .insert([{
      id: councilId,
      name: 'Sampletonborough Council',
      website: 'https://www.sampletonborough.gov.uk',
      reps_email: 'licensing@sampletonborough.gov.uk'
    }])
    .select()
    .single();

  if (councilError && councilError.code !== '23505') {
    console.error('Error creating council:', councilError);
  } else {
    console.log('✓ Created Sampletonborough Council');
  }

  // Create organization for the council
  const orgId = '950e8400-e29b-41d4-c002-446655440001';
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert([{
      id: orgId,
      name: 'Sampletonborough Council',
      slug: 'sampletonborough',
      type: 'council',
      contact_email: 'licensing@sampletonborough.gov.uk'
    }])
    .select()
    .single();

  if (orgError && orgError.code !== '23505') {
    console.error('Error creating organization:', orgError);
  } else {
    console.log('✓ Created Sampletonborough organization');
  }

  // Create Licensing Department
  const deptId = '950e8400-e29b-41d4-c003-446655440001';
  const { data: dept, error: deptError } = await supabase
    .from('departments')
    .insert([{
      id: deptId,
      organization_id: orgId,
      name: 'Licensing Department',
      type: 'licensing',
      slug: 'licensing'
    }])
    .select()
    .single();

  if (deptError && deptError.code !== '23505') {
    console.error('Error creating department:', deptError);
  } else {
    console.log('✓ Created Licensing Department');
  }

  console.log('\nSampletonborough Council added successfully!');
  console.log('Council ID:', councilId);
  console.log('Organization ID:', orgId);
  console.log('Department ID:', deptId);
}

addSampletonborough().then(() => process.exit(0)).catch(console.error);