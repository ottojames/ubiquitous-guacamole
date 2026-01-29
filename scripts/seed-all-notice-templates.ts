#!/usr/bin/env npx tsx
/**
 * Seed all notice type templates
 * Creates default templates for all notice types defined in noticeTypes.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Template definitions with proper statutory wording
const templates = [
  // Licensing Act 2003 Templates
  {
    notice_type: 'premises-licence',
    name: 'New Premises Licence Application',
    description: 'Default template for new premises licence applications under Licensing Act 2003',
    template_text: `LICENSING ACT 2003
NOTICE OF APPLICATION FOR A PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a Premises Licence in respect of {{PREMISES_NAME}}, {{PREMISES_ADDRESS}}.

The proposed licensable activities are:
{{ACTIVITIES}}

Opening Hours: {{OPENING_HOURS}}

The application may be inspected at {{AUTHORITY_ADDRESS}} during normal office hours.

Any person wishing to make representations concerning this application should do so in writing to the Licensing Department at the above address or via {{AUTHORITY_EMAIL}} by {{DEADLINE_DATE}}.

It is an offence knowingly or recklessly to make a false statement in connection with an application, punishable by a maximum fine of £5,000 on summary conviction.`,
    council_id: null
  },
  {
    notice_type: 'premises-licence-variation',
    name: 'Premises Licence Variation',
    description: 'Template for premises licence variation applications',
    template_text: `LICENSING ACT 2003
NOTICE OF APPLICATION TO VARY A PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} to vary the Premises Licence for {{PREMISES_NAME}}, {{PREMISES_ADDRESS}}.

The proposed variation is:
{{VARIATION_DESCRIPTION}}

Current licensed activities:
{{CURRENT_ACTIVITIES}}

Proposed changes:
{{PROPOSED_CHANGES}}

The application may be inspected at {{AUTHORITY_ADDRESS}} during normal office hours.

Representations concerning this application should be made in writing to the Licensing Department by {{DEADLINE_DATE}}.

Further information: {{AUTHORITY_EMAIL}}`,
    council_id: null
  },
  {
    notice_type: 'premises-licence-transfer',
    name: 'Premises Licence Transfer',
    description: 'Template for premises licence transfer applications',
    template_text: `LICENSING ACT 2003
NOTICE OF APPLICATION TO TRANSFER A PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} to transfer the Premises Licence for {{PREMISES_NAME}}, {{PREMISES_ADDRESS}}.

Current licence holder: {{CURRENT_HOLDER}}
Proposed new licence holder: {{NEW_HOLDER}}

The Chief Officer of Police may give notice of objection to this application within 14 days of this notice.

Any other person wishing to make representations should contact the Licensing Department at {{AUTHORITY_ADDRESS}} or {{AUTHORITY_EMAIL}} by {{DEADLINE_DATE}}.`,
    council_id: null
  },
  {
    notice_type: 'premises-licence-review',
    name: 'Premises Licence Review',
    description: 'Template for premises licence review applications',
    template_text: `LICENSING ACT 2003
NOTICE OF APPLICATION FOR REVIEW OF PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a review of the Premises Licence for {{PREMISES_NAME}}, {{PREMISES_ADDRESS}}.

Grounds for review:
{{REVIEW_GROUNDS}}

A hearing will be held to determine this application on {{HEARING_DATE}} at {{HEARING_LOCATION}}.

The application may be inspected at {{AUTHORITY_ADDRESS}} during normal office hours.

Representations must be made in writing to the Licensing Department by {{DEADLINE_DATE}}.`,
    council_id: null
  },

  // Planning Templates
  {
    notice_type: 'planning-major',
    name: 'Major Development Planning Application',
    description: 'Template for major planning development applications',
    template_text: `TOWN AND COUNTRY PLANNING ACT 1990
NOTICE OF MAJOR DEVELOPMENT APPLICATION

Planning Application Reference: {{APPLICATION_REF}}

Notice is hereby given that {{APPLICANT_NAME}} has submitted a planning application to {{AUTHORITY_NAME}}.

Site Address: {{SITE_ADDRESS}}

Proposed Development: {{DEVELOPMENT_DESCRIPTION}}

The application is for a MAJOR DEVELOPMENT comprising:
{{DEVELOPMENT_DETAILS}}

The application and plans may be inspected at {{AUTHORITY_ADDRESS}} during office hours or online at {{ONLINE_REGISTER_URL}}.

Comments must be received by {{DEADLINE_DATE}} and should quote the application reference.

Email: {{AUTHORITY_EMAIL}}
Post: Planning Department, {{AUTHORITY_ADDRESS}}`,
    council_id: null
  },
  {
    notice_type: 'planning-outline',
    name: 'Outline Planning Application',
    description: 'Template for outline planning permission applications',
    template_text: `TOWN AND COUNTRY PLANNING ACT 1990
NOTICE OF OUTLINE PLANNING APPLICATION

Planning Application Reference: {{APPLICATION_REF}}

{{APPLICANT_NAME}} has applied for outline planning permission at {{SITE_ADDRESS}}.

Development: {{DEVELOPMENT_DESCRIPTION}}

Matters for consideration:
{{MATTERS_RESERVED}}

Plans available at: {{AUTHORITY_ADDRESS}} or {{ONLINE_REGISTER_URL}}

Representations by: {{DEADLINE_DATE}}
Contact: {{AUTHORITY_EMAIL}}`,
    council_id: null
  },
  {
    notice_type: 'planning-listed-building',
    name: 'Listed Building Consent',
    description: 'Template for listed building consent applications',
    template_text: `PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990
NOTICE OF APPLICATION AFFECTING A LISTED BUILDING

Application Reference: {{APPLICATION_REF}}

Notice is hereby given that {{APPLICANT_NAME}} has applied for Listed Building Consent.

Listed Building: {{BUILDING_NAME}}
Address: {{SITE_ADDRESS}}
Grade: {{LISTING_GRADE}}

Proposed Works: {{WORKS_DESCRIPTION}}

The application affects the character of a Listed Building and may be inspected at {{AUTHORITY_ADDRESS}} or online at {{ONLINE_REGISTER_URL}}.

Written comments should be submitted by {{DEADLINE_DATE}} to:
Planning Department (Conservation)
{{AUTHORITY_ADDRESS}}
Email: {{AUTHORITY_EMAIL}}`,
    council_id: null
  },
  {
    notice_type: 'planning-advertisement',
    name: 'Advertisement Consent',
    description: 'Template for advertisement consent applications',
    template_text: `TOWN AND COUNTRY PLANNING (CONTROL OF ADVERTISEMENTS) REGULATIONS 2007
NOTICE OF APPLICATION FOR ADVERTISEMENT CONSENT

Application Reference: {{APPLICATION_REF}}

{{APPLICANT_NAME}} has applied for consent to display advertisements at {{SITE_ADDRESS}}.

Type of Advertisement: {{ADVERT_TYPE}}
Illumination: {{ILLUMINATION_DETAILS}}

View application: {{ONLINE_REGISTER_URL}}
Comments by: {{DEADLINE_DATE}}
Contact: {{AUTHORITY_EMAIL}}`,
    council_id: null
  },
  {
    notice_type: 'planning-trees',
    name: 'Tree Works Application',
    description: 'Template for tree works in conservation areas',
    template_text: `TOWN AND COUNTRY PLANNING ACT 1990
NOTICE OF PROPOSED WORKS TO TREES IN A CONSERVATION AREA

Notice is given that {{APPLICANT_NAME}} has notified {{AUTHORITY_NAME}} of intention to carry out works to trees.

Location: {{SITE_ADDRESS}}
Tree Species: {{TREE_SPECIES}}
Proposed Works: {{WORKS_DESCRIPTION}}

Conservation Area: {{CONSERVATION_AREA}}

The notification may be inspected at {{AUTHORITY_ADDRESS}}.

Comments should be submitted within 6 weeks to:
Tree Officer, {{AUTHORITY_ADDRESS}}
Email: {{AUTHORITY_EMAIL}}`,
    council_id: null
  },

  // Environmental Health Templates
  {
    notice_type: 'environmental-noise',
    name: 'Noise Abatement Notice',
    description: 'Template for noise abatement notices under Environmental Protection Act',
    template_text: `ENVIRONMENTAL PROTECTION ACT 1990
NOISE ABATEMENT NOTICE

Notice Reference: {{NOTICE_REF}}

TO: {{RECIPIENT_NAME}}
AT: {{RECIPIENT_ADDRESS}}

You are hereby notified that {{AUTHORITY_NAME}} is satisfied that noise amounting to a statutory nuisance exists/is likely to occur/recur at the above premises.

Nature of Noise: {{NOISE_DESCRIPTION}}

YOU ARE REQUIRED TO: {{REQUIREMENTS}}

Compliance Date: {{COMPLIANCE_DATE}}

Failure to comply with this notice without reasonable excuse is an offence punishable on summary conviction by a fine.

Appeals must be made to the Magistrates' Court within 21 days.

Environmental Health Department
{{AUTHORITY_ADDRESS}}
{{AUTHORITY_EMAIL}}`,
    council_id: null
  },
  {
    notice_type: 'environmental-food-safety',
    name: 'Food Safety Notice',
    description: 'Template for food hygiene improvement notices',
    template_text: `FOOD SAFETY ACT 1990
HYGIENE IMPROVEMENT NOTICE

Notice Reference: {{NOTICE_REF}}
Food Business: {{BUSINESS_NAME}}
Address: {{PREMISES_ADDRESS}}

Following inspection on {{INSPECTION_DATE}}, the following contraventions were identified:

{{CONTRAVENTIONS}}

YOU MUST:
{{REQUIRED_ACTIONS}}

Compliance required by: {{DEADLINE_DATE}}

Right of Appeal: Within one month to the Magistrates' Court.

Environmental Health (Food Safety)
{{AUTHORITY_ADDRESS}}
{{AUTHORITY_EMAIL}}`,
    council_id: null
  },
  {
    notice_type: 'environmental-permit',
    name: 'Environmental Permit Application',
    description: 'Template for environmental permit applications',
    template_text: `ENVIRONMENTAL PERMITTING (ENGLAND AND WALES) REGULATIONS 2016
NOTICE OF ENVIRONMENTAL PERMIT APPLICATION

Permit Reference: {{PERMIT_REF}}

{{APPLICANT_NAME}} has applied for an Environmental Permit for:
{{ACTIVITY_DESCRIPTION}}

Installation/Mobile Plant: {{INSTALLATION_NAME}}
Location: {{SITE_ADDRESS}}

The application and supporting documents can be viewed at:
{{AUTHORITY_ADDRESS}}
Online: {{ONLINE_REGISTER_URL}}

Written representations should be made by {{DEADLINE_DATE}} to:
Environmental Permitting Team
{{AUTHORITY_ADDRESS}}
Email: {{AUTHORITY_EMAIL}}`,
    council_id: null
  },

  // Traffic Regulation Order Templates
  {
    notice_type: 'traffic-order',
    name: 'Permanent Traffic Regulation Order',
    description: 'Template for permanent traffic regulation orders',
    template_text: `ROAD TRAFFIC REGULATION ACT 1984
{{AUTHORITY_NAME}}
{{ORDER_TITLE}}

NOTICE IS HEREBY GIVEN that {{AUTHORITY_NAME}} proposes to make the above Order.

EFFECT OF ORDER: {{ORDER_EFFECT}}

ROADS AFFECTED: {{ROADS_AFFECTED}}

REASON: {{REASON}}

Full details in the draft Order, Statement of Reasons and map available for inspection at:
{{AUTHORITY_ADDRESS}}
Online: {{ONLINE_REGISTER_URL}}

OBJECTIONS must be made in writing, stating grounds, by {{DEADLINE_DATE}} to:
Traffic Orders Team
{{AUTHORITY_ADDRESS}}
Email: {{AUTHORITY_EMAIL}}`,
    council_id: null
  },
  {
    notice_type: 'traffic-order-temporary',
    name: 'Temporary Traffic Regulation Order',
    description: 'Template for temporary traffic regulation orders',
    template_text: `ROAD TRAFFIC REGULATION ACT 1984 - SECTION 14
TEMPORARY TRAFFIC REGULATION ORDER

Order Reference: {{ORDER_REF}}

{{AUTHORITY_NAME}} has made a Temporary Order affecting:
{{ROADS_AFFECTED}}

RESTRICTIONS: {{RESTRICTIONS}}

REASON: {{REASON}}

DURATION: From {{START_DATE}} to {{END_DATE}}

DIVERSION ROUTE: {{DIVERSION}}

Further information:
Traffic Management Team
{{AUTHORITY_ADDRESS}}
{{AUTHORITY_EMAIL}}`,
    council_id: null
  },
  {
    notice_type: 'traffic-order-experimental',
    name: 'Experimental Traffic Order',
    description: 'Template for experimental traffic orders',
    template_text: `ROAD TRAFFIC REGULATION ACT 1984 - SECTION 9
EXPERIMENTAL TRAFFIC ORDER

{{AUTHORITY_NAME}} has made an Experimental Traffic Order:
{{ORDER_TITLE}}

COMING INTO FORCE: {{START_DATE}}

EFFECT: {{ORDER_EFFECT}}

ROADS AFFECTED: {{ROADS_AFFECTED}}

The experimental period is 18 months maximum. Objections may be made within 6 months to:
Traffic Orders Team
{{AUTHORITY_ADDRESS}}
Email: {{AUTHORITY_EMAIL}}`,
    council_id: null
  },

  // Highways Templates
  {
    notice_type: 'highways-road-closure',
    name: 'Road Closure Notice',
    description: 'Template for temporary road closure notices',
    template_text: `HIGHWAYS ACT 1980
NOTICE OF TEMPORARY ROAD CLOSURE

{{AUTHORITY_NAME}} intends to close:
{{ROAD_NAME}}

FROM: {{CLOSURE_START}}
TO: {{CLOSURE_END}}

EXTENT: {{CLOSURE_EXTENT}}

REASON: {{REASON}}

DIVERSION: {{DIVERSION_ROUTE}}

Contact: Highways Department
{{AUTHORITY_ADDRESS}}
{{AUTHORITY_EMAIL}}`,
    council_id: null
  },
  {
    notice_type: 'highways-footpath-diversion',
    name: 'Footpath Diversion Order',
    description: 'Template for public footpath diversion orders',
    template_text: `HIGHWAYS ACT 1980 - SECTION 119
PUBLIC PATH DIVERSION ORDER

{{AUTHORITY_NAME}} proposes to divert:
Footpath No: {{FOOTPATH_NUMBER}}
Parish: {{PARISH}}

Current Route: {{CURRENT_ROUTE}}
Proposed Route: {{PROPOSED_ROUTE}}

Plans available at: {{AUTHORITY_ADDRESS}}

Objections/representations by {{DEADLINE_DATE}} to:
Rights of Way Team
{{AUTHORITY_ADDRESS}}
{{AUTHORITY_EMAIL}}`,
    council_id: null
  },

  // Building Control Templates
  {
    notice_type: 'building-control-dangerous-structure',
    name: 'Dangerous Structure Notice',
    description: 'Template for dangerous structure notices',
    template_text: `BUILDING ACT 1984 - SECTION 77
DANGEROUS STRUCTURE NOTICE

TO: {{OWNER_NAME}}
PROPERTY: {{PROPERTY_ADDRESS}}

The above structure is in a dangerous condition.

DEFECTS: {{DEFECTS}}

YOU MUST: {{REQUIRED_ACTIONS}}

Time for Compliance: {{COMPLIANCE_TIME}}

If you fail to comply, the Authority may execute the work and recover expenses.

Building Control
{{AUTHORITY_ADDRESS}}
{{AUTHORITY_EMAIL}}`,
    council_id: null
  },
  {
    notice_type: 'building-control-demolition',
    name: 'Demolition Notice',
    description: 'Template for building demolition notices',
    template_text: `BUILDING ACT 1984 - SECTION 81
NOTICE OF INTENDED DEMOLITION

Notice is given that demolition is intended at:
{{PROPERTY_ADDRESS}}

Demolition to commence: {{START_DATE}}
Contractor: {{CONTRACTOR_NAME}}

Method Statement and safety measures available for inspection.

Building Control must be notified before commencement.

Building Control Department
{{AUTHORITY_ADDRESS}}
{{AUTHORITY_EMAIL}}`,
    council_id: null
  }
];

async function seedTemplates() {
  console.log('🌱 Starting template seeding...');

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const template of templates) {
    try {
      // Check if template already exists
      const { data: existing } = await supabase
        .from('notice_templates')
        .select('id, name')
        .eq('notice_type', template.notice_type)
        .is('council_id', null)  // Only check for default templates
        .single();

      if (existing) {
        console.log(`✓ Template already exists: ${template.notice_type} - ${existing.name}`);
        skippedCount++;
        continue;
      }

      // Insert new template
      const { data, error } = await supabase
        .from('notice_templates')
        .insert({
          ...template,
          use_count: 0,
          default_values: {}
        })
        .select()
        .single();

      if (error) {
        console.error(`✗ Failed to insert ${template.notice_type}:`, error.message);
        errorCount++;
      } else {
        console.log(`✓ Created template: ${template.notice_type} - ${template.name}`);
        successCount++;
      }
    } catch (err) {
      console.error(`✗ Error processing ${template.notice_type}:`, err);
      errorCount++;
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log(`✓ Created: ${successCount} templates`);
  console.log(`⏩ Skipped: ${skippedCount} templates (already exist)`);
  console.log(`✗ Errors: ${errorCount} templates`);
  console.log(`Total: ${templates.length} templates`);

  // List all templates in database
  const { data: allTemplates, error: listError } = await supabase
    .from('notice_templates')
    .select('notice_type, name, description')
    .is('council_id', null)  // Only show default templates
    .order('notice_type', { ascending: true });

  if (!listError && allTemplates) {
    console.log('\n📋 All Default Templates in Database:');

    // Group by category based on notice_type prefix
    const byCategory: Record<string, any[]> = {};

    allTemplates.forEach(t => {
      const category = t.notice_type.split('-')[0];
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(t);
    });

    Object.entries(byCategory).forEach(([category, items]) => {
      console.log(`\n${category.toUpperCase()}:`);
      items.forEach(item => {
        console.log(`  ✓ ${item.notice_type}: ${item.name}`);
      });
    });

    console.log(`\nTotal templates in database: ${allTemplates.length}`);
  }
}

// Run the seed script
seedTemplates()
  .then(() => {
    console.log('\n✅ Template seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Template seeding failed:', error);
    process.exit(1);
  });