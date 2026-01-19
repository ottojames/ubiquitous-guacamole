const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAnalyticsData() {
  try {
    // 1. Check Westminster organization
    const { data: westminster, error: westError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', 'westminster')
      .single();

    console.log('Westminster org:', westminster?.id);

    // 2. Check Westminster departments
    const { data: depts, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', '0e536037-48c3-4196-8fb6-c31803621050');

    console.log('Westminster departments:', depts?.map(d => ({ id: d.id, name: d.name })));

    // 3. Check notices with department_id
    const { data: deptNotices, error: deptNoticesError } = await supabase
      .from('notices')
      .select('id, title, council_id, department_id, status, published_at')
      .eq('department_id', '2145bf45-da2d-421d-8d8e-8ad46bc6bbef')
      .limit(5);

    console.log('\nNotices with Westminster Licensing department_id:', deptNotices?.length || 0);
    if (deptNotices?.length > 0) {
      console.log('Sample notice:', deptNotices[0]);
    }

    // 4. Check notices with council_id
    const { data: councilNotices, error: councilNoticesError } = await supabase
      .from('notices')
      .select('id, title, council_id, status')
      .eq('council_id', '0e536037-48c3-4196-8fb6-c31803621050')
      .limit(5);

    console.log('\nNotices with Westminster council_id:', councilNotices?.length || 0);

    // 5. Update notices to set council_id from department
    if (deptNotices && deptNotices.length > 0 && !councilNotices?.length) {
      console.log('\nNotices have department_id but not council_id. Updating...');

      for (const notice of deptNotices) {
        const { error: updateError } = await supabase
          .from('notices')
          .update({ council_id: '0e536037-48c3-4196-8fb6-c31803621050' })
          .eq('id', notice.id);

        if (updateError) {
          console.error('Error updating notice:', updateError);
        } else {
          console.log(`Updated notice ${notice.id} with council_id`);
        }
      }
    }

    // 6. Check representations
    const { data: reps, error: repsError } = await supabase
      .from('representations')
      .select('*, notices!inner(department_id)')
      .eq('notices.department_id', '2145bf45-da2d-421d-8d8e-8ad46bc6bbef')
      .limit(5);

    console.log('\nRepresentations for Westminster notices:', reps?.length || 0);

  } catch (err) {
    console.error('Error:', err);
  }
}

checkAnalyticsData();