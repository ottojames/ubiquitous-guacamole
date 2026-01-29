const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStructure() {
  try {
    // Get a sample representation to see the columns
    const { data: sampleRep, error } = await supabase
      .from('representations')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching representation:', error);
      return;
    }

    if (sampleRep) {
      console.log('Representation columns:', Object.keys(sampleRep));
      console.log('\nSample representation:', sampleRep);
    } else {
      console.log('No representations in the table yet');
      
      // Try to insert a simple test representation to see what fields are accepted
      const { data: testInsert, error: insertError } = await supabase
        .from('representations')
        .insert({
          notice_id: '550e8400-e29b-41d4-a716-446655440001', // The Pilot Inn
          respondent_name: 'Test User',
          representation_text: 'Test representation',
          stance: 'comment'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
      } else {
        console.log('Successfully created test representation:', testInsert);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkStructure();
