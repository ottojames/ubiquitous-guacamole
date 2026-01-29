const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestData() {
  try {
    // Get Westminster organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'westminster')
      .single();

    console.log('Westminster Organization:', org.id);

    // Get Westminster Licensing department
    const { data: dept } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', org.id)
      .eq('slug', 'licensing')
      .single();

    console.log('Westminster Licensing Department:', dept.id);

    // Get or create a notice for Westminster
    let { data: notices } = await supabase
      .from('notices')
      .select('*')
      .eq('department_id', dept.id)
      .limit(1);

    let noticeId;
    if (notices && notices.length > 0) {
      noticeId = notices[0].id;
      console.log('Using existing notice:', noticeId);
    } else {
      // Create a test notice
      const { data: newNotice } = await supabase
        .from('notices')
        .insert({
          notice_type: 'premises-licence',
          application_type: 'New Premises Licence',
          applicant: 'Westminster Pub Company',
          trading_name: 'The Westminster Arms',
          premises: {
            name: 'The Westminster Arms',
            address: {
              line1: '123 Westminster Road',
              town: 'London',
              postcode: 'SW1A 1AA'
            }
          },
          department_id: dept.id,
          status: 'published'
        })
        .select()
        .single();
      
      noticeId = newNotice.id;
      console.log('Created new notice:', noticeId);
    }

    // Create test representations
    const testReps = [
      {
        notice_id: noticeId,
        representor_name: 'John Smith',
        representor_email: 'john.smith@example.com',
        representation_text: 'I strongly object to this application due to potential noise issues that will affect local residents, particularly during late night hours. The area is primarily residential and adding another licensed premises will disturb the peace.',
        type: 'object',
        is_anonymous: false,
        status: 'submitted'
      },
      {
        notice_id: noticeId,
        representor_name: 'Sarah Johnson',
        representor_email: 'sarah.j@example.com',
        representation_text: 'I support this application as it will bring much-needed investment and jobs to the area. The applicant has a good track record of managing similar establishments responsibly.',
        type: 'support',
        is_anonymous: false,
        status: 'submitted'
      },
      {
        notice_id: noticeId,
        representor_name: 'Local Business Owner',
        representor_email: null,
        representation_text: 'Please ensure adequate parking provision is made for customers. Also consider limiting delivery times to avoid congestion during peak hours.',
        type: 'comment',
        is_anonymous: true,
        status: 'submitted'
      },
      {
        notice_id: noticeId,
        representor_name: 'Michael Brown',
        representor_email: 'mbrown@residents.org',
        representation_text: 'As chair of the residents association, I object to the proposed opening hours. We request that closing time be no later than 11pm on weekdays and midnight on weekends.',
        type: 'object',
        is_anonymous: false,
        status: 'submitted'
      },
      {
        notice_id: noticeId,
        representor_name: 'Emma Wilson',
        representor_email: 'emma.wilson@gmail.com',
        representation_text: 'This is a welcome addition to our high street. The premises has been vacant for too long and this will help regenerate the area.',
        type: 'support',
        is_anonymous: false,
        status: 'submitted'
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
      console.log(`\nSuccessfully created ${insertedReps.length} test representations for Westminster Licensing`);
      console.log('Representation IDs:', insertedReps.map(r => r.id));
    }

    // Verify they can be queried
    const { data: finalCheck, error: checkError } = await supabase
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

    if (checkError) {
      console.error('Error checking representations:', checkError);
    } else {
      console.log(`\nVerification: Found ${finalCheck.length} representations for Westminster Licensing`);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createTestData();
