#!/usr/bin/env node
/**
 * Seed script to create all default templates for every notice type
 * Run with: npx tsx scripts/seed-all-templates.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Template definitions for all notice types
const templates = [
  // LICENSING TEMPLATES
  {
    name: 'Premises Licence - New Application',
    template_key: 'licensing_premises_new_v1',
    category: 'Licensing',
    type: 'premises-licence',
    content: `LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}} has applied to {{COUNCIL_NAME}} for a NEW PREMISES LICENCE for the premises described below:

Premises: {{PREMISES_NAME}}
Address: {{PREMISES_ADDRESS}}

The proposed licensable activities are:
{{#if SALE_OF_ALCOHOL}}Sale of alcohol ({{SALE_OF_ALCOHOL_TIMES}}){{/if}}
{{#if LIVE_MUSIC}}Live music ({{LIVE_MUSIC_TIMES}}){{/if}}
{{#if RECORDED_MUSIC}}Recorded music ({{RECORDED_MUSIC_TIMES}}){{/if}}
{{#if LATE_NIGHT_REFRESHMENT}}Late night refreshment ({{LATE_NIGHT_REFRESHMENT_TIMES}}){{/if}}
{{#if PERFORMANCE_OF_DANCE}}Performance of dance ({{PERFORMANCE_OF_DANCE_TIMES}}){{/if}}
{{#if PLAYS}}Plays ({{PLAYS_TIMES}}){{/if}}
{{#if FILMS}}Films ({{FILMS_TIMES}}){{/if}}
{{#if INDOOR_SPORTING_EVENTS}}Indoor sporting events ({{INDOOR_SPORTING_EVENTS_TIMES}}){{/if}}
{{#if BOXING_OR_WRESTLING}}Boxing or wrestling ({{BOXING_OR_WRESTLING_TIMES}}){{/if}}

Opening hours: {{OPENING_HOURS}}

The full application can be inspected at:
{{COUNCIL_ADDRESS}}

Or online at: {{COUNCIL_WEBSITE}}

Any person wishing to make representations in respect of this application should do so in writing to:
{{COUNCIL_LICENSING_ADDRESS}}

Representations must be received no later than: {{DEADLINE_DATE}}

It is an offence knowingly or recklessly to make a false statement in or in connection with an application. The maximum fine for which a person is liable on summary conviction for the offence is Level 5 on the standard scale.

Published: {{PUBLICATION_DATE}}`,
    fields: ['APPLICANT_NAME', 'COUNCIL_NAME', 'PREMISES_NAME', 'PREMISES_ADDRESS', 'OPENING_HOURS', 'DEADLINE_DATE']
  },
  {
    name: 'Premises Licence - Variation',
    template_key: 'licensing_premises_variation_v1',
    category: 'Licensing',
    type: 'premises-licence-variation',
    content: `LICENSING ACT 2003
APPLICATION TO VARY A PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}} has applied to {{COUNCIL_NAME}} to VARY the premises licence for:

Premises: {{PREMISES_NAME}}
Address: {{PREMISES_ADDRESS}}
Current Licence Number: {{LICENCE_NUMBER}}

The variations applied for are:
{{VARIATION_DESCRIPTION}}

{{#if EXTENDED_HOURS}}
Extended hours requested:
{{EXTENDED_HOURS_DETAILS}}
{{/if}}

{{#if NEW_ACTIVITIES}}
Additional licensable activities:
{{NEW_ACTIVITIES_DETAILS}}
{{/if}}

The full application can be inspected at:
{{COUNCIL_ADDRESS}}

Or online at: {{COUNCIL_WEBSITE}}

Any person wishing to make representations should do so in writing to:
{{COUNCIL_LICENSING_ADDRESS}}

Representations must be received no later than: {{DEADLINE_DATE}}

Published: {{PUBLICATION_DATE}}`,
    fields: ['APPLICANT_NAME', 'COUNCIL_NAME', 'PREMISES_NAME', 'PREMISES_ADDRESS', 'LICENCE_NUMBER', 'VARIATION_DESCRIPTION', 'DEADLINE_DATE']
  },
  {
    name: 'Club Premises Certificate - New',
    template_key: 'licensing_club_new_v1',
    category: 'Licensing',
    type: 'club-premises-certificate',
    content: `LICENSING ACT 2003
APPLICATION FOR A NEW CLUB PREMISES CERTIFICATE

Notice is hereby given that {{CLUB_NAME}} has applied to {{COUNCIL_NAME}} for a NEW CLUB PREMISES CERTIFICATE for:

Club Name: {{CLUB_NAME}}
Club Address: {{CLUB_ADDRESS}}

The qualifying club activities applied for are:
{{#if SUPPLY_OF_ALCOHOL}}Supply of alcohol to members ({{SUPPLY_OF_ALCOHOL_TIMES}}){{/if}}
{{#if REGULATED_ENTERTAINMENT}}Regulated entertainment ({{REGULATED_ENTERTAINMENT_TIMES}}){{/if}}

Club opening hours: {{CLUB_HOURS}}

The full application can be inspected at:
{{COUNCIL_ADDRESS}}

Or online at: {{COUNCIL_WEBSITE}}

Representations must be made in writing to:
{{COUNCIL_LICENSING_ADDRESS}}

No later than: {{DEADLINE_DATE}}

Published: {{PUBLICATION_DATE}}`,
    fields: ['CLUB_NAME', 'COUNCIL_NAME', 'CLUB_ADDRESS', 'CLUB_HOURS', 'DEADLINE_DATE']
  },
  {
    name: 'Club Premises Certificate - Variation',
    template_key: 'licensing_club_variation_v1',
    category: 'Licensing',
    type: 'club-premises-variation',
    content: `LICENSING ACT 2003
APPLICATION TO VARY A CLUB PREMISES CERTIFICATE

Notice is hereby given that {{CLUB_NAME}} has applied to {{COUNCIL_NAME}} to VARY the club premises certificate for:

Club: {{CLUB_NAME}}
Address: {{CLUB_ADDRESS}}
Certificate Number: {{CERTIFICATE_NUMBER}}

Proposed variations:
{{VARIATION_DESCRIPTION}}

The full application can be inspected at:
{{COUNCIL_ADDRESS}}

Representations must be made no later than: {{DEADLINE_DATE}}

Published: {{PUBLICATION_DATE}}`,
    fields: ['CLUB_NAME', 'COUNCIL_NAME', 'CLUB_ADDRESS', 'CERTIFICATE_NUMBER', 'VARIATION_DESCRIPTION', 'DEADLINE_DATE']
  },

  // GAMBLING TEMPLATE (generic for all gambling types)
  {
    name: 'Gambling Premises - Generic',
    template_key: 'gambling_premises_generic_v1',
    category: 'Gambling',
    type: 'gambling-premises',
    content: `GAMBLING ACT 2005
{{APPLICATION_TYPE}}

Notice is hereby given that {{APPLICANT_NAME}} has applied to {{COUNCIL_NAME}} for a {{LICENCE_TYPE}} in respect of:

Premises: {{PREMISES_NAME}}
Address: {{PREMISES_ADDRESS}}

{{#if IS_VARIATION}}
The variations applied for are:
{{VARIATION_DETAILS}}
{{/if}}

{{#if IS_TRANSFER}}
Transfer from: {{TRANSFER_FROM}}
Transfer to: {{TRANSFER_TO}}
{{/if}}

The application and plans may be inspected at:
{{COUNCIL_ADDRESS}}

Between the hours of 9:00am and 5:00pm Monday to Friday.

Representations must be made in writing to:
{{COUNCIL_LICENSING_ADDRESS}}

No later than: {{DEADLINE_DATE}}

Any representation must be made within 28 days of the date of this notice and must specify the grounds on which the representation is made.

Published: {{PUBLICATION_DATE}}`,
    fields: ['APPLICANT_NAME', 'COUNCIL_NAME', 'LICENCE_TYPE', 'PREMISES_NAME', 'PREMISES_ADDRESS', 'DEADLINE_DATE']
  },

  // GVOL TEMPLATES
  {
    name: 'Goods Vehicle Operator Licence',
    template_key: 'gvol_operating_centre_v1',
    category: 'Transport',
    type: 'gvol',
    content: `GOODS VEHICLES (LICENSING OF OPERATORS) ACT 1995

{{APPLICATION_TYPE}} APPLICATION

{{OPERATOR_NAME}} trading as {{TRADING_NAME}} of {{OPERATOR_ADDRESS}} is applying {{#if IS_VARIATION}}to vary licence {{LICENCE_NUMBER}}{{else}}for a licence{{/if}} to use:

{{OPERATING_CENTRE_ADDRESS}}

as an operating centre for {{NUMBER_OF_VEHICLES}} goods vehicles and {{NUMBER_OF_TRAILERS}} trailers.

{{#if CURRENT_VEHICLES}}
Current authorisation: {{CURRENT_VEHICLES}} vehicles, {{CURRENT_TRAILERS}} trailers
{{/if}}

Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected, should make written representations to the Traffic Commissioner at:

Office of the Traffic Commissioner
{{TRAFFIC_COMMISSIONER_ADDRESS}}

stating their reasons, within 21 days of this notice.

Representors must at the same time send a copy of their representations to the applicant at the address given above. A guide to making representations is available from the Traffic Commissioner's Office.

Published: {{PUBLICATION_DATE}}`,
    fields: ['OPERATOR_NAME', 'TRADING_NAME', 'OPERATOR_ADDRESS', 'OPERATING_CENTRE_ADDRESS', 'NUMBER_OF_VEHICLES', 'NUMBER_OF_TRAILERS']
  },

  // PLANNING TEMPLATES
  {
    name: 'Planning Press Notice',
    template_key: 'planning_press_notice_v1',
    category: 'Planning',
    type: 'planning',
    content: `TOWN AND COUNTRY PLANNING ACT 1990
{{#if IS_LISTED_BUILDING}}PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990{{/if}}

{{APPLICATION_TYPE}}

Application Reference: {{APPLICATION_REFERENCE}}

Notice is given that {{APPLICANT_NAME}} has applied to {{COUNCIL_NAME}} for:

{{DEVELOPMENT_DESCRIPTION}}

At: {{SITE_ADDRESS}}

{{#if IS_MAJOR}}
This is a MAJOR DEVELOPMENT
{{/if}}

{{#if IS_EIA}}
An Environmental Impact Assessment accompanies this application.
{{/if}}

{{#if AFFECTS_LISTED_BUILDING}}
The development affects the setting of a Listed Building.
{{/if}}

{{#if IN_CONSERVATION_AREA}}
The development is within a Conservation Area.
{{/if}}

{{#if AFFECTS_RIGHT_OF_WAY}}
The development affects a Public Right of Way.
{{/if}}

The application and plans may be viewed:
- Online at {{PLANNING_PORTAL_URL}}
- At {{COUNCIL_PLANNING_ADDRESS}} during office hours

Comments may be submitted:
- Online at the above website
- By email to {{PLANNING_EMAIL}}
- In writing to the above address

Comments must be received by: {{DEADLINE_DATE}}

Please note that comments will be published online.

Published: {{PUBLICATION_DATE}}`,
    fields: ['APPLICATION_REFERENCE', 'APPLICANT_NAME', 'COUNCIL_NAME', 'DEVELOPMENT_DESCRIPTION', 'SITE_ADDRESS', 'DEADLINE_DATE']
  },

  // PROBATE TEMPLATE
  {
    name: 'Trustee Act 1925 s.27 Notice',
    template_key: 'probate_trustee_s27_v1',
    category: 'Probate',
    type: 'trustee-act',
    content: `TRUSTEE ACT 1925 SECTION 27
NOTICE TO CREDITORS AND CLAIMANTS

Estate of {{DECEASED_NAME}} (Deceased)

Pursuant to Section 27 of the Trustee Act 1925, notice is given that:

All persons having claims against or an interest in the estate of {{DECEASED_NAME}} late of {{DECEASED_ADDRESS}} who died on {{DATE_OF_DEATH}} (Probate/Letters of Administration granted on {{GRANT_DATE}}) are required to send written particulars to:

{{SOLICITOR_NAME}}
{{SOLICITOR_ADDRESS}}

by {{DEADLINE_DATE}} after which date the estate will be distributed having regard only to claims and interests of which notice has been received.

{{SOLICITOR_NAME}}
{{PUBLICATION_DATE}}`,
    fields: ['DECEASED_NAME', 'DECEASED_ADDRESS', 'DATE_OF_DEATH', 'GRANT_DATE', 'SOLICITOR_NAME', 'SOLICITOR_ADDRESS', 'DEADLINE_DATE']
  },

  // TRO TEMPLATE
  {
    name: 'Traffic Regulation Order',
    template_key: 'tro_v1',
    category: 'Highways',
    type: 'tro',
    content: `ROAD TRAFFIC REGULATION ACT 1984
{{ORDER_TYPE}} TRAFFIC REGULATION ORDER

{{COUNCIL_NAME}}
{{ORDER_TITLE}}
ORDER {{ORDER_YEAR}} NO. {{ORDER_NUMBER}}

NOTICE IS HEREBY GIVEN that {{COUNCIL_NAME}} proposes to make the above {{#if IS_TEMPORARY}}Temporary {{/if}}{{#if IS_EXPERIMENTAL}}Experimental {{/if}}Traffic Regulation Order under {{LEGAL_BASIS}} of the Road Traffic Regulation Act 1984.

THE EFFECT OF THE ORDER will be to:
{{ORDER_EFFECT}}

{{#if AFFECTED_ROADS}}
ROADS AFFECTED:
{{AFFECTED_ROADS}}
{{/if}}

{{#if ALTERNATIVE_ROUTE}}
ALTERNATIVE ROUTE:
{{ALTERNATIVE_ROUTE}}
{{/if}}

{{#if IS_TEMPORARY}}
The Order will remain in force for {{DURATION}} or until the works are complete.
{{/if}}

{{#if IS_EXPERIMENTAL}}
The experimental period will be for {{EXPERIMENTAL_PERIOD}} months.
{{/if}}

REASON FOR THE ORDER:
{{ORDER_REASON}}

A copy of the proposed Order, plan and statement of reasons may be inspected at:
{{COUNCIL_ADDRESS}}

During normal office hours.

Objections to the proposal, specifying the grounds on which they are made, should be sent in writing to:
{{HIGHWAYS_ADDRESS}}

By: {{DEADLINE_DATE}}

Published: {{PUBLICATION_DATE}}`,
    fields: ['COUNCIL_NAME', 'ORDER_TITLE', 'ORDER_YEAR', 'ORDER_NUMBER', 'ORDER_EFFECT', 'ORDER_REASON', 'DEADLINE_DATE']
  }
];

async function seedTemplates() {
  console.log('🌱 Starting template seed process...\n');

  // First, check what templates already exist
  const { data: existingTemplates, error: fetchError } = await supabase
    .from('notice_templates')
    .select('notice_type, name');

  if (fetchError) {
    console.error('Error fetching existing templates:', fetchError);
    return;
  }

  const existingTypes = new Set((existingTemplates || []).map(t => t.notice_type));
  console.log(`Found ${existingTypes.size} existing templates\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  // Get Sampletonborough Council for templates
  const { data: council } = await supabase
    .from('councils')
    .select('id')
    .eq('name', 'Sampletonborough Council')
    .single();

  const councilId = council?.id || null;

  // If no council, try Westminster
  let finalCouncilId = councilId;
  if (!finalCouncilId) {
    const { data: westminster } = await supabase
      .from('councils')
      .select('id')
      .ilike('name', '%Westminster%')
      .single();
    finalCouncilId = westminster?.id || null;
  }

  for (const template of templates) {
    // Map our template types to actual notice types used in the system
    const noticeType = template.type;

    if (existingTypes.has(noticeType)) {
      console.log(`⏭️  Skipping "${template.name}" - already exists for type: ${noticeType}`);
      skipped++;
      continue;
    }

    const templateData = {
      name: template.name,
      description: `Default template for ${template.category} notices`,
      notice_type: noticeType,
      template_text: template.content,
      default_values: {},
      use_count: 0,
      council_id: finalCouncilId,
      department_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('notice_templates')
      .insert(templateData);

    if (error) {
      console.error(`❌ Failed to create "${template.name}":`, error.message);
      failed++;
    } else {
      console.log(`✅ Created template: ${template.name}`);
      created++;
    }
  }

  console.log('\n📊 Seed Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total templates: ${templates.length}`);

  if (created > 0) {
    console.log('\n✨ Templates seeded successfully!');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run the seed
seedTemplates().catch(console.error);