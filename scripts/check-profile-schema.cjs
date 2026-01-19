const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfileSchema() {
  try {
    // Try to get a profile to see what columns exist
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Profile columns:', Object.keys(data[0]));
      console.log('Sample profile:', data[0]);
    } else {
      console.log('No profiles found in table');
    }

    // Check if the user has a profile
    const userId = '168b695f-f831-4ffb-82f5-d1a68392947b';
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
    } else if (userProfile) {
      console.log('\nWestminster user profile exists:', userProfile);
    } else {
      console.log('\nWestminster user profile does not exist, creating...');

      // Create profile with correct schema
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: 'licensing@westminster.gov.uk',
          full_name: 'Westminster Licensing Officer'
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
      } else {
        console.log('Profile created successfully');
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkProfileSchema();