const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
  try {
    const { data: authData, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error listing users:', error);
      return;
    }

    console.log('Total users:', authData?.users?.length || 0);

    if (authData?.users) {
      authData.users.forEach(user => {
        console.log(`- ${user.email} (ID: ${user.id}, Created: ${user.created_at})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

listUsers();