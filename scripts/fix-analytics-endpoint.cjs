const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAnalyticsEndpoint() {
  try {
    // Test if the RPC function exists
    const { data, error } = await supabase.rpc('get_analytics_for_period', {
      p_organization_id: '0e536037-48c3-4196-8fb6-c31803621050',
      p_start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      p_end_date: new Date().toISOString()
    });

    if (error) {
      console.log('RPC function error:', error.message);
      console.log('The RPC function get_analytics_for_period does not exist or has errors.');
      console.log('The analytics endpoint needs to be updated to query data directly.');
    } else {
      console.log('RPC function exists and returned:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

fixAnalyticsEndpoint();