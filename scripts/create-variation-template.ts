import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SAMPLETON_DEPT_ID = 'a654ac45-77b3-4431-bc39-9a99a7461ad5';

const variationTemplate = `LICENSING ACT 2003
NOTICE OF APPLICATION TO VARY A PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} to vary the Premises Licence for {{PREMISES_NAME}}, {{PREMISES_ADDRESS}}.

The proposed variation is:
{{VARIATION_DESCRIPTION}}

The application may be inspected at the Council Offices during normal office hours.

Any person wishing to make representations concerning this application should do so in writing to the Licensing Department or via email by {{DEADLINE_DATE}}.

It is an offence knowingly or recklessly to make a false statement in connection with an application, punishable by a maximum fine of £5,000 on summary conviction.

Date of application: {{APPLICATION_DATE}}
Date of first publication: {{PUBLICATION_DATE}}`;

async function main() {
  console.log('Creating variation template for Sampleton...');

  // Check if template already exists
  const { data: existing } = await supabase
    .from('templates')
    .select('id')
    .eq('department_id', SAMPLETON_DEPT_ID)
    .eq('notice_type', 'licensing-premises-variation')
    .single();

  if (existing) {
    console.log('Template already exists, updating...');
    const { error } = await supabase
      .from('templates')
      .update({
        template_text: variationTemplate,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating template:', error);
    } else {
      console.log('Template updated successfully!');
    }
  } else {
    console.log('Creating new template...');
    const { error } = await supabase
      .from('templates')
      .insert({
        department_id: SAMPLETON_DEPT_ID,
        notice_type: 'licensing-premises-variation',
        name: 'Premises Licence Variation - Standard',
        description: 'Template for variation applications',
        template_text: variationTemplate
      });

    if (error) {
      console.error('Error creating template:', error);
    } else {
      console.log('Template created successfully!');
    }
  }

  // List all templates for this department
  const { data: templates } = await supabase
    .from('templates')
    .select('id, name, notice_type')
    .eq('department_id', SAMPLETON_DEPT_ID);

  console.log('\nAll templates for Sampleton Licensing:');
  console.log(JSON.stringify(templates, null, 2));
}

main().catch(console.error);
