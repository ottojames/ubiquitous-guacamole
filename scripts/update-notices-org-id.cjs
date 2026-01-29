const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateNoticesOrgId() {
  try {
    // Get Westminster notices
    const { data: notices, error: fetchError } = await supabase
      .from('notices')
      .select('id, department_id')
      .in('department_id', [
        '2145bf45-da2d-421d-8d8e-8ad46bc6bbef', // Licensing
        '3f825911-43bc-4fb4-9557-6ad93d3760c8'  // Planning
      ]);

    if (fetchError) {
      console.error('Error fetching notices:', fetchError);
      return;
    }

    console.log(`Found ${notices.length} Westminster notices to update`);

    // Update each notice with organization_id
    for (const notice of notices) {
      const { error: updateError } = await supabase
        .from('notices')
        .update({ organization_id: '0e536037-48c3-4196-8fb6-c31803621050' })
        .eq('id', notice.id);

      if (updateError) {
        console.error(`Error updating notice ${notice.id}:`, updateError.message);
      } else {
        console.log(`✓ Updated notice ${notice.id} with organization_id`);
      }
    }

    console.log('\n✅ All notices updated with organization_id');

    // Test analytics again
    const { data: analyticsData, error: analyticsError } = await supabase.rpc(
      'get_analytics_for_period',
      {
        p_organization_id: '0e536037-48c3-4196-8fb6-c31803621050',
        p_start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: new Date().toISOString(),
      }
    );

    console.log('\nAnalytics after update:', analyticsData);

  } catch (err) {
    console.error('Error:', err);
  }
}

updateNoticesOrgId();