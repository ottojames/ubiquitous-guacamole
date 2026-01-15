#!/usr/bin/env npx tsx
/**
 * Script to create Sampletonborough Council with licensing department
 * For testing US-0125: Licensing Dashboard Widgets
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env file.');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function createSampletonboroughCouncil() {
  try {
    // 1. Check if Sampletonborough already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'sampletonborough-council')
      .single();

    if (existingOrg) {
      console.log('✅ Sampletonborough Council already exists');
      return;
    }

    console.log('Creating Sampletonborough Council...');

    // 2. Create organization
    const orgId = '750e8400-e29b-41d4-s001-446655440001';
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: orgId,
        name: 'Sampletonborough Council',
        type: 'council',
        domain: 'sampletonborough.gov.uk',
        status: 'active',
        contact_email: 'info@sampletonborough.gov.uk',
        contact_phone: '01234 567890',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      throw orgError;
    }

    console.log('✅ Created organization');

    // 3. Create council entry
    const { error: councilError } = await supabase
      .from('councils')
      .insert({
        id: orgId,
        name: 'Sampletonborough Council',
        slug: 'sampletonborough-council',
        website: 'https://sampletonborough.gov.uk',
        reps_email: 'licensing@sampletonborough.gov.uk',
        created_at: new Date().toISOString()
      });

    if (councilError) {
      console.error('Error creating council:', councilError);
      throw councilError;
    }

    console.log('✅ Created council');

    // 4. Create licensing department
    const licensingDeptId = '850e8400-e29b-41d4-d001-446655440001';
    const { error: deptError } = await supabase
      .from('departments')
      .insert({
        id: licensingDeptId,
        org_id: orgId,
        name: 'Licensing Department',
        slug: 'licensing',
        type: 'licensing',
        email: 'licensing@sampletonborough.gov.uk',
        phone: '01234 567891',
        created_at: new Date().toISOString()
      });

    if (deptError) {
      console.error('Error creating department:', deptError);
      throw deptError;
    }

    console.log('✅ Created Licensing Department');

    // 5. Create planning department (for comparison)
    const planningDeptId = '850e8400-e29b-41d4-d002-446655440001';
    const { error: planningError } = await supabase
      .from('departments')
      .insert({
        id: planningDeptId,
        org_id: orgId,
        name: 'Planning Department',
        slug: 'planning',
        type: 'planning',
        email: 'planning@sampletonborough.gov.uk',
        phone: '01234 567892',
        created_at: new Date().toISOString()
      });

    if (planningError) {
      console.error('Error creating planning department:', planningError);
      throw planningError;
    }

    console.log('✅ Created Planning Department');

    // 6. Create test user for licensing head (Sarah)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'licensing@sampletonborough.gov.uk',
      password: 'testpass123',
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      // Continue anyway as user might already exist
    } else {
      console.log('✅ Created user: licensing@sampletonborough.gov.uk');
    }

    // 7. Add some test notices for the licensing department
    const noticeIds = [
      '950e8400-e29b-41d4-n001-446655440001',
      '950e8400-e29b-41d4-n002-446655440002',
      '950e8400-e29b-41d4-n003-446655440003'
    ];

    const noticeData = [
      {
        id: noticeIds[0],
        notice_type: 'premises-licence',
        status: 'published',
        department_id: licensingDeptId,
        council_id: orgId,
        applicant: { name: 'The Golden Lion Pub', email: 'contact@goldenlion.co.uk' },
        premises: { name: 'The Golden Lion', address: '15 Market Square, Sampletonborough' },
        notice_text: 'Application for new premises licence - The Golden Lion',
        reps_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        id: noticeIds[1],
        notice_type: 'premises-licence-variation',
        status: 'published',
        department_id: licensingDeptId,
        council_id: orgId,
        applicant: { name: 'The Blue Anchor', email: 'manager@blueanchor.co.uk' },
        premises: { name: 'The Blue Anchor', address: '22 High Street, Sampletonborough' },
        notice_text: 'Variation to extend opening hours - The Blue Anchor',
        reps_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        id: noticeIds[2],
        notice_type: 'premises-licence-review',
        status: 'published',
        department_id: licensingDeptId,
        council_id: orgId,
        applicant: { name: 'Local Resident', email: 'concerned@resident.com' },
        premises: { name: 'The Night Club', address: '8 Station Road, Sampletonborough' },
        notice_text: 'Review of premises licence - The Night Club',
        reps_deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ];

    for (const notice of noticeData) {
      const { error } = await supabase.from('notices').insert(notice);
      if (error) {
        console.error(`Error creating notice ${notice.id}:`, error);
      }
    }

    console.log('✅ Created test notices');

    // 8. Add some test representations
    const repsData = [
      {
        id: '960e8400-e29b-41d4-r001-446655440001',
        notice_id: noticeIds[0],
        type: 'objection',
        name: 'John Smith',
        email: 'john.smith@email.com',
        comment: 'Concerned about noise levels late at night',
        grounds: ['public_nuisance'],
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '960e8400-e29b-41d4-r002-446655440002',
        notice_id: noticeIds[0],
        type: 'support',
        name: 'Jane Doe',
        email: 'jane.doe@email.com',
        comment: 'Great addition to the community',
        grounds: [],
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const rep of repsData) {
      const { error } = await supabase.from('representations').insert(rep);
      if (error) {
        console.error(`Error creating representation ${rep.id}:`, error);
      }
    }

    console.log('✅ Created test representations');

    console.log('\n🎉 Sampletonborough Council setup complete!');
    console.log('\nYou can now log in with:');
    console.log('Email: licensing@sampletonborough.gov.uk');
    console.log('Password: testpass123');
    console.log('\nDashboard URL: http://localhost:5173/c/sampletonborough-council/licensing/dashboard');

  } catch (error) {
    console.error('❌ Failed to create Sampletonborough Council:', error);
    process.exit(1);
  }
}

// Run the script
createSampletonboroughCouncil();