import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addFirmClients() {
  console.log('Adding firm clients...');

  const orgId = '850e8400-e29b-41d4-f001-446655440001'; // Wilson & Partners

  // Create test clients
  const clients = [
    {
      id: '750e8400-e29b-41d4-c001-446655440001',
      name: 'Crown Holdings Ltd',
      slug: 'crown-holdings',
      organization_id: orgId,
      contact_name: 'John Crown',
      contact_email: 'john@crownholdings.com',
      contact_phone: '020 7123 4567',
      created_at: new Date().toISOString()
    },
    {
      id: '750e8400-e29b-41d4-c002-446655440001',
      name: 'Jazz Entertainment Ltd',
      slug: 'jazz-entertainment',
      organization_id: orgId,
      contact_name: 'Sarah Jazz',
      contact_email: 'sarah@jazzent.com',
      contact_phone: '020 7456 7890',
      created_at: new Date().toISOString()
    },
    {
      id: '750e8400-e29b-41d4-c003-446655440001',
      name: 'Riverside Pubs Group',
      slug: 'riverside-pubs',
      organization_id: orgId,
      contact_name: 'Mike Riverside',
      contact_email: 'mike@riversidepubs.com',
      contact_phone: '020 7890 1234',
      created_at: new Date().toISOString()
    }
  ];

  // Try to insert clients
  const { data, error } = await supabase
    .from('clients')
    .insert(clients)
    .select();

  if (error) {
    console.log('Note: clients table may not exist, trying alternative approach...');

    // If clients table doesn't exist, let's link the notices to client_ids
    // Update existing notices to have client associations
    const noticeUpdates = [
      {
        id: '650e8400-e29b-41d4-a001-446655440001', // The Crown notice
        client_id: '750e8400-e29b-41d4-c001-446655440001', // Crown Holdings Ltd
        client_name: 'Crown Holdings Ltd'
      },
      {
        id: '650e8400-e29b-41d4-a002-446655440001', // Jazz Club notice
        client_id: '750e8400-e29b-41d4-c002-446655440001', // Jazz Entertainment Ltd
        client_name: 'Jazz Entertainment Ltd'
      }
    ];

    for (const update of noticeUpdates) {
      const { error: updateError } = await supabase
        .from('notices')
        .update({
          client_id: update.client_id,
          extras: supabase.rpc('jsonb_merge', [
            { extras: { client_name: update.client_name } }
          ])
        })
        .eq('id', update.id);

      if (updateError) {
        // Try simple update without jsonb_merge
        const { error: simpleError } = await supabase
          .from('notices')
          .update({ client_id: update.client_id })
          .eq('id', update.id);

        if (simpleError) {
          console.log(`Could not update notice ${update.id}:`, simpleError.message);
        } else {
          console.log(`Updated notice ${update.id} with client_id ${update.client_id}`);
        }
      }
    }

    // Create client data in organizations table as a workaround
    console.log('Creating client organizations as alternative...');
    const clientOrgs = clients.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      type: 'client',
      contact_email: c.contact_email,
      parent_organization_id: orgId
    }));

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert(clientOrgs)
      .select();

    if (orgError) {
      console.log('Could not create client organizations:', orgError.message);
    } else {
      console.log(`Created ${orgData.length} client organizations`);
    }
  } else {
    console.log(`Successfully created ${data.length} clients for Wilson & Partners`);
    console.log('Client names:', data.map(c => c.name).join(', '));

    // Link notices to clients
    await supabase
      .from('notices')
      .update({ client_id: '750e8400-e29b-41d4-c001-446655440001' })
      .eq('id', '650e8400-e29b-41d4-a001-446655440001');

    await supabase
      .from('notices')
      .update({ client_id: '750e8400-e29b-41d4-c002-446655440001' })
      .eq('id', '650e8400-e29b-41d4-a002-446655440001');

    console.log('Linked notices to respective clients');
  }

  console.log('\nClient setup complete!');
  console.log('Test clients:');
  console.log('  1. Crown Holdings Ltd (slug: crown-holdings)');
  console.log('  2. Jazz Entertainment Ltd (slug: jazz-entertainment)');
  console.log('  3. Riverside Pubs Group (slug: riverside-pubs)');
}

addFirmClients().then(() => process.exit(0)).catch(console.error);