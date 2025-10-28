import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'NOT FOUND');
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'NOT FOUND');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createFirmUser() {
  try {
    console.log('Creating firm user via Supabase Admin API...');

    // Create user via Admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'solicitor@wilsonpartners.com',
      password: 'SolicitorTest123!',
      email_confirm: true,
      user_metadata: {
        email_verified: true
      },
      app_metadata: {
        provider: 'email',
        providers: ['email']
      }
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return;
    }

    console.log('User created successfully:', userData.user.id);

    // Create organization membership
    const { error: membershipError } = await supabaseAdmin
      .from('organization_memberships')
      .insert({
        user_id: userData.user.id,
        organization_id: '00000000-0000-0000-0000-000000000101', // Wilson & Partners
        role: 'owner'
      });

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      return;
    }

    console.log('Organization membership created successfully');
    console.log('\n✅ Firm user ready!');
    console.log('Email: solicitor@wilsonpartners.com');
    console.log('Password: SolicitorTest123!');
    console.log('User ID:', userData.user.id);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createFirmUser();
