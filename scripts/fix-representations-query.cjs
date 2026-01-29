const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRepresentations() {
  try {
    // Get Westminster organization first
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'westminster')
      .single();

    // Get Westminster Licensing department
    const { data: dept } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', org.id)
      .eq('slug', 'licensing')
      .single();

    console.log('Westminster Licensing Department:', dept.id);

    // Check what columns actually exist in notices table
    const { data: sampleNotice } = await supabase
      .from('notices')
      .select('*')
      .limit(1)
      .single();

    if (sampleNotice) {
      console.log('\nNotice columns:', Object.keys(sampleNotice));
    }

    // Get any existing notice for Westminster
    const { data: existingNotice } = await supabase
      .from('notices')
      .select('*')
      .eq('department_id', dept.id)
      .limit(1)
      .single();

    let noticeId;
    
    if (existingNotice) {
      noticeId = existingNotice.id;
      console.log('\nFound existing Westminster notice:', noticeId);
    } else {
      // Create a test notice with the correct structure
      const { data: newNotice, error: createError } = await supabase
        .from('notices')
        .insert({
          notice_type: 'premises-licence',
          notice_title: 'The Westminster Arms - New Premises Licence Application',
          applicant: 'Westminster Pub Co',
          notice_text: 'Application for a new premises licence for The Westminster Arms, 123 Westminster Road, London SW1A 1AA',
          department_id: dept.id,
          status: 'published',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating notice:', createError);
        return;
      }
      
      noticeId = newNotice.id;
      console.log('\nCreated new Westminster notice:', noticeId);
    }

    // Check if there are any representations
    const { data: existingReps } = await supabase
      .from('representations')
      .select('*')
      .eq('notice_id', noticeId);

    console.log('\nExisting representations for this notice:', existingReps?.length || 0);

    if (!existingReps || existingReps.length === 0) {
      // Create test representations
      const testReps = [
        {
          notice_id: noticeId,
          respondent_name: 'John Smith',
          respondent_email: 'john@example.com',
          representation_text: 'I object to this application due to noise concerns that will affect local residents.',
          stance: 'object',
          is_anonymous: false
        },
        {
          notice_id: noticeId,
          respondent_name: 'Sarah Johnson',
          respondent_email: 'sarah@example.com',
          representation_text: 'I support this application as it will bring jobs and investment to the area.',
          stance: 'support',
          is_anonymous: false
        },
        {
          notice_id: noticeId,
          respondent_name: 'Local Business Owner',
          respondent_email: 'business@example.com',
          representation_text: 'Please ensure adequate parking provision is made for customers.',
          stance: 'comment',
          is_anonymous: false
        }
      ];

      const { data: newReps, error: insertError } = await supabase
        .from('representations')
        .insert(testReps)
        .select();

      if (insertError) {
        console.error('Error creating representations:', insertError);
      } else {
        console.log('Created 3 test representations successfully');
      }
    }

    // Now test the query that the UI uses (with correct column names)
    const { data: finalReps, error: finalError } = await supabase
      .from('representations')
      .select(`
        *,
        notices!inner (
          id,
          notice_type,
          notice_title,
          applicant,
          department_id
        )
      `)
      .eq('notices.department_id', dept.id)
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('Error fetching representations:', finalError);
    } else {
      console.log('\nFinal check - Representations for Westminster Licensing:', finalReps?.length || 0);
      if (finalReps && finalReps.length > 0) {
        console.log('First representation:', {
          id: finalReps[0].id,
          respondent: finalReps[0].respondent_name,
          stance: finalReps[0].stance,
          notice_title: finalReps[0].notices?.notice_title
        });
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

fixRepresentations();
