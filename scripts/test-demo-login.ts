import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

async function testDemoLogin() {
  console.log('Testing demo account logins...\n');

  const accounts = [
    { email: 'licensing@westminster.gov.uk', password: 'testpass123', name: 'Westminster' },
    { email: 'solicitor@wilsonpartners.com', password: 'testpass123', name: 'Wilson Partners' }
  ];

  for (const account of accounts) {
    console.log(`Testing ${account.name}: ${account.email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password
    });

    if (error) {
      console.log(`  ❌ Login failed: ${error.message}`);
    } else if (data.user) {
      console.log(`  ✅ Login successful!`);
      console.log(`     User ID: ${data.user.id}`);
      console.log(`     Email: ${data.user.email}`);

      // Sign out
      await supabase.auth.signOut();
    }
    console.log();
  }
}

testDemoLogin();