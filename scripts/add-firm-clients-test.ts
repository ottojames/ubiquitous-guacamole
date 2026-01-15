#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Adding test clients for Wilson & Partners firm...');

  // Test clients data
  const firmClients = [
    {
      id: '850e8400-e29b-41d4-c001-446655440001',
      firm_id: '850e8400-e29b-41d4-f001-446655440001', // Wilson & Partners ID
      name: 'The Red Lion Pub',
      company: 'Red Lion Holdings Ltd',
      email: 'manager@redlion.com',
      phone: '020 1234 5678',
      default_address: '123 High Street',
      default_postcode: 'SW1A 1AA',
      active: true,
      recent_premises: ['The Red Lion', 'Red Lion Beer Garden']
    },
    {
      id: '850e8400-e29b-41d4-c001-446655440002',
      firm_id: '850e8400-e29b-41d4-f001-446655440001',
      name: 'The Crown Hotel',
      company: 'Crown Holdings PLC',
      email: 'licensing@crownhotel.co.uk',
      phone: '020 2345 6789',
      default_address: '456 Kings Road',
      default_postcode: 'SW10 2BB',
      active: true,
      recent_premises: ['The Crown Hotel', 'Crown Bar & Lounge']
    },
    {
      id: '850e8400-e29b-41d4-c001-446655440003',
      firm_id: '850e8400-e29b-41d4-f001-446655440001',
      name: 'Blue Moon Restaurant',
      company: 'Blue Moon Dining Ltd',
      email: 'info@bluemoon.restaurant',
      phone: '020 3456 7890',
      default_address: '789 Queens Avenue',
      default_postcode: 'W1D 3CC',
      active: true,
      recent_premises: ['Blue Moon Restaurant', 'Blue Moon Terrace']
    },
    {
      id: '850e8400-e29b-41d4-c001-446655440004',
      firm_id: '850e8400-e29b-41d4-f001-446655440001',
      name: 'The White Hart Inn',
      company: 'White Hart Hospitality',
      email: 'manager@whitehart.pub',
      phone: '020 4567 8901',
      default_address: '321 Victoria Street',
      default_postcode: 'SW1E 4DD',
      active: true,
      recent_premises: ['The White Hart Inn']
    },
    {
      id: '850e8400-e29b-41d4-c001-446655440005',
      firm_id: '850e8400-e29b-41d4-f001-446655440001',
      name: 'Green Gardens Cafe',
      company: 'Green Gardens Ltd',
      email: 'hello@greengarden.cafe',
      phone: '020 5678 9012',
      default_address: '654 Park Lane',
      default_postcode: 'W1K 5EE',
      active: true,
      recent_premises: ['Green Gardens Cafe', 'Garden Terrace']
    }
  ];

  // Check if table exists
  const { data: existingTable, error: tableCheckError } = await supabase
    .from('firm_clients')
    .select('id')
    .limit(1);

  if (tableCheckError && tableCheckError.code === '42P01') {
    // Table doesn't exist, create it
    console.log('Creating firm_clients table...');

    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS firm_clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          firm_id UUID NOT NULL,
          name TEXT NOT NULL,
          company TEXT,
          email TEXT,
          phone TEXT,
          default_address TEXT,
          default_postcode TEXT,
          active BOOLEAN DEFAULT true,
          recent_premises TEXT[],
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (createTableError) {
      console.error('Failed to create table via RPC. Table may not exist.');
      console.log('Please create the firm_clients table manually in Supabase dashboard with the following SQL:');
      console.log(`
CREATE TABLE firm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  default_address TEXT,
  default_postcode TEXT,
  active BOOLEAN DEFAULT true,
  recent_premises TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
      `);
      process.exit(1);
    }
  }

  // Insert clients
  for (const client of firmClients) {
    const { error } = await supabase
      .from('firm_clients')
      .upsert(client, { onConflict: 'id' });

    if (error) {
      console.error(`Error adding client ${client.name}:`, error);
    } else {
      console.log(`✓ Added client: ${client.name} (${client.company})`);
    }
  }

  console.log('\nTest clients added successfully!');
  console.log('You can now use Quick Publish from the firm dashboard.');
}

main().catch(console.error);