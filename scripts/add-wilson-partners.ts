#!/usr/bin/env npx tsx
/**
 * Script to create Wilson & Partners law firm
 * For testing FIX-001: Fix Demo Authentication
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env file.');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function createWilsonPartners() {
  try {
    // 1. Check if Wilson & Partners already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .or(`name.eq.Wilson & Partners,name.eq.Wilson and Partners,slug.eq.wilson-partners`)
      .single();

    if (existingOrg) {
      console.log('✅ Wilson & Partners already exists:', existingOrg.name, '(ID:', existingOrg.id, ')');
      return existingOrg.id;
    }

    console.log('Creating Wilson & Partners law firm...');

    // 2. Create organization
    const orgId = '550e8400-e29b-41d4-b001-446655440001'; // Fixed UUID for Wilson Partners
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: orgId,
        name: 'Wilson & Partners',
        slug: 'wilson-partners',
        type: 'firm',
        domain: 'wilsonpartners.com',
        status: 'active',
        contact_email: 'info@wilsonpartners.com',
        contact_phone: '020 7234 5678',
        address_line_1: '100 Fleet Street',
        city: 'London',
        postcode: 'EC4Y 1DH',
        country: 'UK',
        created_at: new Date().toISOString(),
        subscription_tier: 'professional',
        subscription_status: 'active',
        settings: {
          practice_areas: ['licensing', 'planning'],
          default_timezone: 'Europe/London'
        }
      })
      .select()
      .single();

    if (orgError) {
      // If already exists error, just continue
      if (orgError.code === '23505') {
        console.log('✅ Wilson & Partners organization already exists');
      } else {
        console.error('Error creating organization:', orgError);
        throw orgError;
      }
    } else {
      console.log('✅ Created Wilson & Partners organization');
    }

    // 3. Check if firm clients exist (for demo purposes)
    const clientNames = [
      'The Red Lion Pub',
      'Crown Hotel',
      'Blue Moon Restaurant'
    ];

    console.log('\n📋 Creating demo clients for Wilson & Partners...');

    for (const clientName of clientNames) {
      const clientSlug = clientName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');

      // Note: Since clients table doesn't exist yet, we'll just log what would be created
      console.log(`   Would create client: ${clientName} (${clientSlug})`);

      // In a real implementation with clients table:
      /*
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          organization_id: orgId,
          name: clientName,
          slug: clientSlug,
          contact_email: `${clientSlug}@example.com`,
          created_at: new Date().toISOString()
        });
      */
    }

    console.log('\n🎉 Wilson & Partners setup complete!');
    console.log('\nFirm details:');
    console.log('- Name: Wilson & Partners');
    console.log('- Slug: wilson-partners');
    console.log('- Type: firm');
    console.log('- Practice Areas: Licensing, Planning');
    console.log('- Demo account: solicitor@wilsonpartners.com');

    return orgId;

  } catch (error) {
    console.error('❌ Failed to create Wilson & Partners:', error);
    process.exit(1);
  }
}

// Run the script
createWilsonPartners();