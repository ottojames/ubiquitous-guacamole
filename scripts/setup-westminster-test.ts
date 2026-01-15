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

async function setupWestminsterCouncil() {
  console.log('Setting up Westminster Council test data...');

  // 1. Create Westminster City Council
  const councilId = '550e8400-e29b-41d4-c001-446655440001';
  const { data: council, error: councilError } = await supabase
    .from('councils')
    .insert([{
      id: councilId,
      name: 'Westminster City Council',
      website: 'https://www.westminster.gov.uk',
      reps_email: 'licensing@westminster.gov.uk'
    }])
    .select()
    .single();

  if (councilError && councilError.code !== '23505') { // Ignore if already exists
    console.error('Error creating council:', councilError);
    // Try to get existing council
    const { data: existingCouncil } = await supabase
      .from('councils')
      .select('*')
      .eq('name', 'Westminster City Council')
      .single();

    if (!existingCouncil) return;
  }

  console.log('Created/found Westminster City Council');

  // 2. Create or find Westminster organization
  const orgId = '550e8400-e29b-41d4-c002-446655440001';

  // First try to find existing organization
  let { data: org, error: findOrgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', 'westminster')
    .single();

  if (!org) {
    // Create if doesn't exist
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        id: orgId,
        name: 'Westminster City Council',
        slug: 'westminster',
        type: 'council',
        contact_email: 'licensing@westminster.gov.uk'
      }])
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return;
    }
    org = newOrg;
  }

  const finalOrgId = org.id;
  console.log('Created/found Westminster organization:', finalOrgId);

  // 3. Create Licensing Department
  const deptId = '550e8400-e29b-41d4-c003-446655440001';

  // Check if department exists first
  let { data: dept, error: findDeptError } = await supabase
    .from('departments')
    .select('*')
    .eq('organization_id', finalOrgId)
    .eq('slug', 'licensing')
    .single();

  if (!dept) {
    const { data: newDept, error: deptError } = await supabase
      .from('departments')
      .insert([{
        id: deptId,
        organization_id: finalOrgId,
        name: 'Licensing Department',
        type: 'licensing',
        slug: 'licensing'
      }])
      .select()
      .single();

    if (deptError) {
      console.error('Error creating department:', deptError);
      return;
    }
    dept = newDept;
  }

  const finalDeptId = dept.id;
  console.log('Created/found Licensing Department:', finalDeptId);

  // 4. Create test user for Westminster
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'licensing@westminster.gov.uk',
    password: 'testpass123',
    email_confirm: true
  });

  if (authError && !authError.message?.includes('already been registered')) {
    console.error('Error creating user:', authError);
  } else {
    console.log('Created/found test user: licensing@westminster.gov.uk');
  }

  // 5. Link our existing notice to Westminster department
  const { error: updateError } = await supabase
    .from('notices')
    .update({
      department_id: finalDeptId,
      council_id: councilId
    })
    .eq('id', '550e8400-e29b-41d4-a716-446655440001');

  if (updateError) {
    console.error('Error linking notice to department:', updateError);
  } else {
    console.log('Linked The Pilot Inn notice to Westminster Licensing Department');
  }

  // 6. Add more test notices for Westminster
  const testNotices = [
    {
      id: 'notice-westminster-001',
      notice_type: 'premises-licence',
      status: 'published',
      department_id: finalDeptId,
      council_id: councilId,
      premises: {
        name: 'The Crown Pub',
        address: '10 Downing Street, Westminster',
        postcode: 'SW1A 2AA'
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
        activities: ['sale-of-alcohol', 'late-night-refreshment']
      },
      preview_text: 'Application for premises licence at The Crown Pub, Westminster',
      latitude: 51.5034,
      longitude: -0.1276
    },
    {
      id: 'notice-westminster-002',
      notice_type: 'variation',
      status: 'published',
      department_id: finalDeptId,
      council_id: councilId,
      premises: {
        name: 'Jazz Club London',
        address: '42 Soho Square, Westminster',
        postcode: 'W1D 3QX'
      },
      applicant: {
        name: 'Jazz Entertainment Ltd',
        email: 'jazz@example.com'
      },
      consultation: {
        repsDeadline: '2026-02-25',
        applicationDate: '2026-01-12'
      },
      extras: {
        activities: ['live-music', 'recorded-music']
      },
      preview_text: 'Variation application for Jazz Club London',
      latitude: 51.5159,
      longitude: -0.1314
    }
  ];

  const { error: noticesError } = await supabase
    .from('notices')
    .insert(testNotices);

  if (noticesError) {
    console.error('Error adding test notices:', noticesError);
  } else {
    console.log('Added 2 additional test notices for Westminster');
  }

  console.log('\nSetup complete!');
  console.log('Test credentials:');
  console.log('  Email: licensing@westminster.gov.uk');
  console.log('  Password: testpass123');
  console.log('  Council portal URL: http://localhost:5173/c/westminster/licensing');
  console.log('  3 test notices linked to department');
}

setupWestminsterCouncil().then(() => process.exit(0)).catch(console.error);