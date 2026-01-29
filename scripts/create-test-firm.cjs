const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestFirm() {
  console.log('Creating test firm organization and user...');

  try {
    // 1. Create organization
    const orgId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // New UUID
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: orgId,
        name: 'Test Law Firm LLP',
        slug: 'test-law-firm',
        type: 'firm',
        contact_email: 'info@testfirm.com',
        settings: {
          practice_areas: ['licensing', 'planning']
        }
      })
      .select()
      .single();

    if (orgError) {
      console.error('Failed to create organization:', orgError);
      return;
    }

    console.log('✅ Created organization:', org.name);

    // 2. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'lawyer@testfirm.com',
      password: 'testpass123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Lawyer'
      }
    });

    if (authError) {
      console.error('Failed to create auth user:', authError);
      // Clean up
      await supabase.from('organizations').delete().eq('id', orgId);
      return;
    }

    const userId = authData.user.id;
    console.log('✅ Created auth user:', authData.user.email);

    // 3. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: 'lawyer@testfirm.com',
        full_name: 'Test Lawyer'
      });

    if (profileError) {
      console.error('Failed to create profile:', profileError);
    } else {
      console.log('✅ Created profile');
    }

    // 4. Create organization membership
    const { error: memberError } = await supabase
      .from('organization_memberships')
      .insert({
        user_id: userId,
        organization_id: orgId,
        role: 'admin',
        status: 'active',
        joined_at: new Date().toISOString()
      });

    if (memberError) {
      console.error('Failed to create membership:', memberError);
    } else {
      console.log('✅ Created organization membership');
    }

    console.log('\n✅ Test firm account created successfully!');
    console.log('Email: lawyer@testfirm.com');
    console.log('Password: testpass123');
    console.log('Organization: Test Law Firm LLP');
    console.log('Portal URL: http://localhost:5173/f/test-law-firm/dashboard');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createTestFirm();