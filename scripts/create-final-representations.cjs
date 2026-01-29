const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createRepresentations() {
  try {
    // Get Westminster Licensing department
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'westminster')
      .single();

    const { data: dept } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', org.id)
      .eq('slug', 'licensing')
      .single();

    console.log('Westminster Licensing Department:', dept.id);

    // Use the existing Westminster notice
    const noticeId = '550e8400-e29b-41d4-a001-446655440001'; // The Crown Tavern
    console.log('Using notice:', noticeId);

    // Create representations with all required fields
    const testReps = [
      {
        notice_id: noticeId,
        representor_name: 'John Smith',
        representor_email: 'john.smith@example.com',
        representation_text: 'I strongly object to this application due to potential noise issues that will affect local residents.',
        type: 'objection',
        is_anonymous: false
      },
      {
        notice_id: noticeId,
        representor_name: 'Sarah Johnson',
        representor_email: 'sarah.j@example.com',
        representation_text: 'I support this application as it will bring much-needed jobs and investment to the area.',
        type: 'support',
        is_anonymous: false
      },
      {
        notice_id: noticeId,
        representor_name: 'Anonymous',
        representor_email: 'anonymous@civicnotices.co.uk', // Required even for anonymous
        representation_text: 'Please ensure adequate parking provision is made for customers.',
        type: 'comment',
        is_anonymous: true
      }
    ];

    // Clear any existing test representations for this notice first
    await supabase
      .from('representations')
      .delete()
      .eq('notice_id', noticeId)
      .in('representor_name', ['John Smith', 'Sarah Johnson', 'Anonymous']);

    // Insert new representations
    const { data: insertedReps, error: insertError } = await supabase
      .from('representations')
      .insert(testReps)
      .select();

    if (insertError) {
      console.error('Error creating representations:', insertError);
    } else {
      console.log(`✓ Successfully created ${insertedReps.length} test representations`);
      console.log('IDs:', insertedReps.map(r => r.id).join(', '));
    }

    // Verify the query works
    const { data: reps, error: queryError } = await supabase
      .from('representations')
      .select(`
        *,
        notices!inner (
          id,
          application_type,
          notice_type,
          trading_name,
          applicant,
          premises,
          department_id
        )
      `)
      .eq('notices.department_id', dept.id)
      .order('submitted_at', { ascending: false });

    if (queryError) {
      console.error('Query error:', queryError);
    } else {
      console.log(`\n✓ Query successful: Found ${reps.length} representations for Westminster Licensing`);
      if (reps.length > 0) {
        console.log('\nSample representation:');
        console.log('- Name:', reps[0].representor_name);
        console.log('- Type:', reps[0].type);
        console.log('- Notice:', reps[0].notices?.applicant || reps[0].notices?.notice_type);
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createRepresentations();
