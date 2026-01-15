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

async function setupTestFirm() {
  console.log('Setting up test firm data...');

  // 1. Create Wilson & Partners organization
  const orgId = '850e8400-e29b-41d4-f001-446655440001';

  // First try to find existing organization
  let { data: org, error: findOrgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', 'wilson-partners')
    .single();

  if (!org) {
    // Create if doesn't exist
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        id: orgId,
        name: 'Wilson & Partners',
        slug: 'wilson-partners',
        type: 'firm',
        contact_email: 'solicitor@wilsonpartners.com',
        practice_areas: ['licensing', 'planning']
      }])
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      // Try without practice_areas if column doesn't exist
      const { data: simpleOrg, error: simpleError } = await supabase
        .from('organizations')
        .insert([{
          id: orgId,
          name: 'Wilson & Partners',
          slug: 'wilson-partners',
          type: 'firm',
          contact_email: 'solicitor@wilsonpartners.com'
        }])
        .select()
        .single();

      if (simpleError) {
        console.error('Error creating simple organization:', simpleError);
        return;
      }
      org = simpleOrg;
    } else {
      org = newOrg;
    }
  }

  const finalOrgId = org.id;
  console.log('Created/found Wilson & Partners organization:', finalOrgId);

  // 2. Create test user for firm
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'solicitor@wilsonpartners.com',
    password: 'testpass123',
    email_confirm: true
  });

  if (authError && !authError.message?.includes('already been registered')) {
    console.error('Error creating user:', authError);
  } else {
    console.log('Created/found test user: solicitor@wilsonpartners.com');
  }

  // 3. Create a professional_users entry linking user to firm
  const userId = authData?.user?.id || 'test-user-id';

  // Check if professional_users table exists
  const { data: profUser, error: profError } = await supabase
    .from('professional_users')
    .upsert([{
      user_id: userId,
      organization_id: finalOrgId,
      role: 'solicitor',
      is_primary: true
    }])
    .select()
    .single();

  if (profError) {
    console.log('Note: professional_users table may not exist, continuing...');
  } else {
    console.log('Created professional user link');
  }

  // 4. Create some test invoices/billing data
  const invoices = [
    {
      id: '950e8400-e29b-41d4-i001-446655440001',
      organization_id: finalOrgId,
      amount: 125.00,
      status: 'pending',
      description: 'Premises Licence Application - The Crown',
      due_date: '2026-02-15',
      created_at: new Date().toISOString()
    },
    {
      id: '950e8400-e29b-41d4-i002-446655440001',
      organization_id: finalOrgId,
      amount: 95.00,
      status: 'pending',
      description: 'Variation Application - Jazz Club',
      due_date: '2026-02-20',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '950e8400-e29b-41d4-i003-446655440001',
      organization_id: finalOrgId,
      amount: 125.00,
      status: 'paid',
      description: 'Premises Licence - Previous Month',
      due_date: '2026-01-15',
      paid_date: '2026-01-14',
      created_at: new Date(Date.now() - 2592000000).toISOString() // 30 days ago
    }
  ];

  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoices)
    .select();

  if (invoiceError) {
    console.log('Note: invoices table may not exist, continuing...');
  } else {
    console.log(`Created ${invoiceData.length} test invoices`);
  }

  // 5. Create some test notices for the firm
  const firmNotices = [
    {
      id: '650e8400-e29b-41d4-n001-446655440001',
      notice_type: 'premises-licence',
      status: 'published',
      organization_id: finalOrgId,
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
      id: '650e8400-e29b-41d4-n002-446655440001',
      notice_type: 'variation',
      status: 'draft',
      organization_id: finalOrgId,
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
  } else {
    console.log(`Created ${noticeData.length} test notices for firm`);
  }

  console.log('\nSetup complete!');
  console.log('Test credentials:');
  console.log('  Email: solicitor@wilsonpartners.com');
  console.log('  Password: testpass123');
  console.log('  Firm portal URL: http://localhost:5173/f/wilson-partners/dashboard');
  console.log('  2 outstanding invoices totaling £220.00');
}

setupTestFirm().then(() => process.exit(0)).catch(console.error);