import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://puemqhpqxgrvrukyrfkm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZW1xaHBxeGdydnJ1a3lyZmttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMTk1MiwiZXhwIjoyMDcwNDg3OTUyfQ.GZiPMAq6RGMUDQYW9I1AwlcuDyRUXwn_hoLkQgCh8Uw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCouncilDropdown() {
  console.log('Testing council dropdown and auto-population...\n');

  // Check if Sampletonborough exists in organizations
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .ilike('name', '%sampletonborough%');

  if (orgsError) {
    console.error('Error fetching organizations:', orgsError);
    return;
  }

  console.log('Sampletonborough organizations found:', orgs?.length || 0);
  orgs?.forEach(org => {
    console.log(`- ${org.name} (ID: ${org.id})`);
  });

  // Check departments
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select(`
      id,
      name,
      type,
      organization:organizations (
        id,
        name
      )
    `)
    .eq('type', 'licensing');

  if (deptError) {
    console.error('Error fetching departments:', deptError);
    return;
  }

  console.log('\nLicensing departments found:', departments?.length || 0);
  const sampletonborough = departments?.find(d =>
    d.organization?.name?.toLowerCase().includes('sampletonborough')
  );

  if (sampletonborough) {
    console.log('✅ Sampletonborough Licensing department exists:');
    console.log(`   Organization: ${sampletonborough.organization?.name}`);
    console.log(`   Department: ${sampletonborough.name}`);
    console.log(`   Org ID: ${sampletonborough.organization?.id}`);

    // Check council settings
    const { data: settings, error: settingsError } = await supabase
      .from('council_settings')
      .select('*')
      .eq('organization_id', sampletonborough.organization?.id)
      .single();

    if (settings && !settingsError) {
      console.log('\n✅ Council settings exist for auto-population:');
      console.log(`   Authority Address: ${settings.authority_address}`);
      console.log(`   Authority Email: ${settings.authority_email}`);
      console.log(`   Online Register URL: ${settings.online_register_url}`);
    } else {
      console.log('\n❌ No council settings found for Sampletonborough!');
    }
  } else {
    console.log('❌ Sampletonborough Licensing department NOT found!');
  }
}

testCouncilDropdown().catch(console.error);