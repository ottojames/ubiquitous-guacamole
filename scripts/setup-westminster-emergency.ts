import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://puemqhpqxgrvrukyrfkm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZW1xaHBxeGdydnJ1a3lyZmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTE5NTIsImV4cCI6MjA3MDQ4Nzk1Mn0.nL0AW6pWGGfpS64mKd4wuqVfudOtiW4M7_wydIjzMsc'
);

async function setupWestminster() {
  console.log('🚀 EMERGENCY: Setting up Westminster City Council...\n');

  // 1. Check if Westminster exists
  let { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', 'westminster')
    .maybeSingle();

  if (!org) {
    console.log('📝 Creating Westminster organization...');
    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert({
        name: 'Westminster City Council',
        slug: 'westminster',
        type: 'council',
        contact_email: 'licensing@westminster.gov.uk'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating org:', error);
      return;
    }
    org = newOrg;
    console.log(`✅ Created Westminster org: ${org.id}`);
  } else {
    console.log(`✅ Westminster org exists: ${org.id}`);
  }

  // 2. Check if licensing department exists
  let { data: dept } = await supabase
    .from('departments')
    .select('id, name')
    .eq('organization_id', org.id)
    .eq('type', 'licensing')
    .maybeSingle();

  if (!dept) {
    console.log('📝 Creating licensing department...');
    const { data: newDept, error } = await supabase
      .from('departments')
      .insert({
        organization_id: org.id,
        name: 'Licensing',
        slug: 'licensing',
        type: 'licensing',
        email: 'licensing@westminster.gov.uk'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating dept:', error);
      return;
    }
    dept = newDept;
    console.log(`✅ Created licensing dept: ${dept.id}`);
  } else {
    console.log(`✅ Licensing dept exists: ${dept.id}`);
  }

  // 3. Check if custom template exists
  let { data: template } = await supabase
    .from('templates')
    .select('id, name')
    .eq('department_id', dept.id)
    .eq('notice_type', 'licensing-premises-new')
    .maybeSingle();

  if (!template) {
    console.log('📝 Creating custom template...');
    const templateText = `NOTICE OF APPLICATION FOR A PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}} has applied to Westminster City Council for a premises licence under the Licensing Act 2003 in respect of:

**{{PREMISES_NAME}}**
{{PREMISES_ADDRESS}}

The application is for the following licensable activities:
{{LICENSABLE_ACTIVITIES}}

Operating hours:
{{ACTIVITY_SCHEDULE}}

Application received: {{APPLICATION_DATE}}

Any person wishing to make representations concerning this application should do so in writing to:

Westminster City Council Licensing Team
licensing@westminster.gov.uk

Representations must be received no later than {{DEADLINE_DATE}}.

A copy of the application and operating schedule may be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}, or online at {{ONLINE_REGISTER_URL}}.

For information about responsible authorities, visit {{RESPONSIBLE_AUTHORITIES_LIST_URL}}.

Dated: {{PUBLICATION_DATE}}`;

    const { data: newTemplate, error } = await supabase
      .from('templates')
      .insert({
        department_id: dept.id,
        notice_type: 'licensing-premises-new',
        name: 'Westminster Premises Licence Template',
        description: 'Professional Westminster licensing template with statutory wording',
        template_text: templateText,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating template:', error);
      console.error('Full error:', JSON.stringify(error, null, 2));
      return;
    }
    template = newTemplate;
    console.log(`✅ Created custom template: ${template.id}`);
  } else {
    console.log(`✅ Custom template exists: ${template.id}`);
  }

  console.log('\n🎉 WESTMINSTER IS READY!');
  console.log(`\nDepartment ID: ${dept.id}`);
  console.log('Notice Type ID: licensing-premises-new');
  console.log(`Template ID: ${template!.id}\n`);
  console.log('✅ Now go back to your browser and CLICK on the Westminster City Council dropdown option (don\'t just type it).\n');
}

setupWestminster().catch(console.error);
