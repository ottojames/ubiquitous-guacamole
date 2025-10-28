import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  try {
    console.log('Resetting password for solicitor@wilsonpartners.com...');

    // Get the user ID
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === 'solicitor@wilsonpartners.com');

    if (!user) {
      console.error('User not found!');
      return;
    }

    console.log('Found user:', user.id);

    // Update the user's password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: 'SolicitorTest123!' }
    );

    if (error) {
      console.error('Error updating password:', error);
      return;
    }

    console.log('✅ Password reset successfully!');
    console.log('Email: solicitor@wilsonpartners.com');
    console.log('Password: SolicitorTest123!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetPassword();
