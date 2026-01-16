#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ensureWilsonPartners() {
  console.log('🔧 Ensuring Wilson & Partners organization exists...\n');

  // Check if organization exists
  const { data: existingOrg, error: fetchError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', '550e8400-e29b-41d4-b001-446655440001')
    .single();

  if (existingOrg) {
    console.log('✓ Wilson & Partners already exists');
    return existingOrg;
  }

  // Create Wilson & Partners organization
  const { data: newOrg, error: insertError } = await supabase
    .from('organizations')
    .insert({
      id: '550e8400-e29b-41d4-b001-446655440001',
      type: 'firm',
      name: 'Wilson & Partners LLP',
      slug: 'wilson-partners',
      domain: 'wilsonpartners.com',
      status: 'active',
      contact_email: 'contact@wilsonpartners.com',
      settings: {
        practice_areas: ['licensing', 'planning', 'environmental_health'],
        default_timezone: 'Europe/London'
      }
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error creating organization:', insertError);
    return null;
  }

  console.log('✓ Wilson & Partners organization created');

  // Add some demo clients
  const clients = [
    {
      organization_id: '550e8400-e29b-41d4-b001-446655440001',
      name: 'The Red Lion Pub',
      slug: 'red-lion-pub',
      contact_person: 'John Smith',
      contact_email: 'john@redlionpub.com',
      contact_phone: '020 7123 4567',
      address: '123 High Street, Westminster',
      postcode: 'SW1A 1AA',
      active_notices: 2,
      total_notices: 5
    },
    {
      organization_id: '550e8400-e29b-41d4-b001-446655440001',
      name: 'Crown Hotel',
      slug: 'crown-hotel',
      contact_person: 'Sarah Johnson',
      contact_email: 'sarah@crownhotel.co.uk',
      contact_phone: '020 7234 5678',
      address: '456 Park Lane, Mayfair',
      postcode: 'W1K 1PN',
      active_notices: 1,
      total_notices: 3
    },
    {
      organization_id: '550e8400-e29b-41d4-b001-446655440001',
      name: 'Blue Moon Restaurant',
      slug: 'blue-moon-restaurant',
      contact_person: 'Michael Chen',
      contact_email: 'michael@bluemoon.co.uk',
      contact_phone: '020 7345 6789',
      address: '789 Oxford Street',
      postcode: 'W1D 2HJ',
      active_notices: 3,
      total_notices: 8
    }
  ];

  // Check if firm_clients table exists and insert clients
  const { error: clientError } = await supabase
    .from('firm_clients')
    .insert(clients);

  if (!clientError) {
    console.log('✓ Demo clients created');
  } else {
    console.log('ℹ️ Could not create demo clients:', clientError.message);
  }

  return newOrg;
}

// Run the setup
ensureWilsonPartners()
  .then(() => console.log('\n✅ Organization setup complete!'))
  .catch(console.error);