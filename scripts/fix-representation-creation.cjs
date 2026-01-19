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

    // Create representations with correct type values ('objection' not 'object')
    const testReps = [
      {
        notice_id: noticeId,
        representor_name: 'John Smith',
        representor_email: 'john.smith@example.com',
        representation_text: 'I strongly object to this application due to potential noise issues.',
        type: 'objection', // Use 'objection' not 'object'
        is_anonymous: false
      },
      {
        notice_id: noticeId,
        representor_name: 'Sarah Johnson',
        representor_email: 'sarah.j@example.com',
        representation_text: 'I support this application as it will bring jobs to the area.',
        type: 'support',
        is_anonymous: false
      },
      {
        notice_id: noticeId,
        representor_name: 'Local Resident',
        representation_text: 'Please ensure adequate parking is provided.',
        type: 'comment',
        is_anonymous: true
      }
    ];

    // Insert representations
    const { data: insertedReps, error: insertError } = await supabase
      .from('representations')
      .insert(testReps)
      .select();

    if (insertError) {
      console.error('Error creating representations:', insertError);
    } else {
      console.log(`Successfully created ${insertedReps.length} representations`);
      console.log('IDs:', insertedReps.map(r => r.id));
    }

    // Test the query
    const { data: reps, error: queryError } = await supabase
      .from('representations')
      .select(`
        *,
        notices!inner (
          id,
          department_id
        )
      `)
      .eq('notices.department_id', dept.id)
      .order('submitted_at', { ascending: false })
      .limit(5);

    if (queryError) {
      console.error('Query error:', queryError);
    } else {
      console.log(`\nFound ${reps.length} representations for Westminster Licensing`);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createRepresentations();
