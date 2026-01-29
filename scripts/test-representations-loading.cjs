const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRepresentations() {
  try {
    // First get Westminster Licensing department
    const { data: dept, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('slug', 'licensing')
      .single();

    if (deptError) {
      console.error('Error fetching department:', deptError);
      return;
    }

    console.log('Westminster Licensing Department:', dept.id, dept.name);

    // Check if there are any notices for this department
    const { data: notices, error: noticesError } = await supabase
      .from('notices')
      .select('id, application_type, premises_name')
      .eq('department_id', dept.id);

    if (noticesError) {
      console.error('Error fetching notices:', noticesError);
      return;
    }

    console.log('\nNotices for this department:', notices?.length || 0);
    if (notices && notices.length > 0) {
      console.log('Sample notices:', notices.slice(0, 3));
    }

    // Now test the exact query from Representations.tsx
    const { data: reps, error: repsError } = await supabase
      .from('representations')
      .select(`
        *,
        notices!inner (
          id,
          application_type,
          trading_name,
          premises_name,
          premises_address,
          department_id
        )
      `)
      .eq('notices.department_id', dept.id)
      .order('created_at', { ascending: false });

    if (repsError) {
      console.error('Error fetching representations:', repsError);
      return;
    }

    console.log('\nRepresentations for this department:', reps?.length || 0);
    if (reps && reps.length > 0) {
      console.log('Sample representations:', reps.slice(0, 2));
    }

    // If no representations, create some test data
    if (!reps || reps.length === 0) {
      console.log('\nNo representations found. Creating test data...');
      
      // Get a notice for this department (or create one)
      let noticeId;
      if (notices && notices.length > 0) {
        noticeId = notices[0].id;
      } else {
        // Create a test notice
        const { data: newNotice, error: createNoticeError } = await supabase
          .from('notices')
          .insert({
            id: '550e8400-e29b-41d4-a003-446655440001',
            application_type: 'premises-licence',
            premises_name: 'The Westminster Arms',
            premises_address: { 
              line1: '123 Westminster Road',
              town: 'London',
              postcode: 'SW1A 1AA'
            },
            applicant: 'Westminster Pub Co',
            department_id: dept.id,
            status: 'published',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createNoticeError) {
          console.error('Error creating test notice:', createNoticeError);
          return;
        }
        noticeId = newNotice.id;
        console.log('Created test notice:', noticeId);
      }

      // Create test representations
      const testReps = [
        {
          id: '550e8400-e29b-41d4-r001-446655440001',
          notice_id: noticeId,
          respondent_name: 'John Smith',
          respondent_email: 'john@example.com',
          representation_text: 'I object to this application due to noise concerns.',
          stance: 'object',
          is_anonymous: false,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '550e8400-e29b-41d4-r002-446655440001',
          notice_id: noticeId,
          respondent_name: 'Sarah Johnson',
          respondent_email: 'sarah@example.com',
          representation_text: 'I support this application as it will bring jobs to the area.',
          stance: 'support',
          is_anonymous: false,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '550e8400-e29b-41d4-r003-446655440001',
          notice_id: noticeId,
          respondent_name: 'Local Resident',
          respondent_email: 'resident@example.com',
          representation_text: 'Please ensure adequate parking is provided.',
          stance: 'comment',
          is_anonymous: true,
          created_at: new Date().toISOString()
        }
      ];

      const { error: insertError } = await supabase
        .from('representations')
        .insert(testReps);

      if (insertError) {
        console.error('Error creating test representations:', insertError);
      } else {
        console.log('Created 3 test representations successfully');
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testRepresentations();
