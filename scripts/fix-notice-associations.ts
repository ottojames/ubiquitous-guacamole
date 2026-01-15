import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNoticeAssociations() {
  console.log('Fixing notice associations...\n');

  // 1. Check if demo organizations exist
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, slug, type')
    .eq('type', 'council')
    .limit(5);

  if (orgsError) {
    console.error('Error fetching organizations:', orgsError);
    return;
  }

  console.log(`Found ${orgs?.length || 0} council organizations`);

  if (!orgs || orgs.length === 0) {
    console.log('No council organizations found. Creating demo organization...');

    const { data: newOrg, error: createOrgError } = await supabase
      .from('organizations')
      .insert({
        id: 'demo-westminster-org',
        name: 'Westminster City Council',
        slug: 'westminster',
        type: 'council',
        contact_email: 'licensing@westminster.gov.uk'
      })
      .select()
      .single();

    if (createOrgError) {
      console.error('Error creating organization:', createOrgError);
      return;
    }

    console.log('Created organization:', newOrg);
    orgs.push(newOrg);
  }

  const demoOrg = orgs[0];

  // 2. Check if departments exist
  const { data: depts, error: deptsError } = await supabase
    .from('departments')
    .select('id, name, slug, type, organization_id')
    .eq('organization_id', demoOrg.id);

  if (deptsError) {
    console.error('Error fetching departments:', deptsError);
    return;
  }

  console.log(`Found ${depts?.length || 0} departments for ${demoOrg.name}`);

  if (!depts || depts.length === 0) {
    console.log('No departments found. Creating demo departments...');

    const { data: newDepts, error: createDeptsError } = await supabase
      .from('departments')
      .insert([
        {
          id: 'demo-westminster-licensing',
          organization_id: demoOrg.id,
          name: 'Licensing',
          slug: 'licensing',
          type: 'licensing'
        },
        {
          id: 'demo-westminster-planning',
          organization_id: demoOrg.id,
          name: 'Planning',
          slug: 'planning',
          type: 'planning'
        }
      ])
      .select();

    if (createDeptsError) {
      console.error('Error creating departments:', createDeptsError);
      return;
    }

    console.log('Created departments:', newDepts);
    depts.push(...(newDepts || []));
  }

  const licensingDept = depts.find(d => d.type === 'licensing' || d.slug === 'licensing') || depts[0];

  // 3. Update notices to have organization_id and department_id
  const { data: notices, error: noticesError } = await supabase
    .from('notices')
    .select('id, notice_type, organization_id, department_id')
    .is('organization_id', null)
    .limit(50);

  if (noticesError) {
    console.error('Error fetching notices:', noticesError);
    return;
  }

  console.log(`\nFound ${notices?.length || 0} notices without organization/department`);

  if (notices && notices.length > 0) {
    console.log(`Updating notices to link to ${demoOrg.name} / ${licensingDept.name}...`);

    const { error: updateError } = await supabase
      .from('notices')
      .update({
        organization_id: demoOrg.id,
        department_id: licensingDept.id
      })
      .is('organization_id', null);

    if (updateError) {
      console.error('Error updating notices:', updateError);
      return;
    }

    console.log(`✅ Successfully updated ${notices.length} notices`);
  }

  // 4. Verify
  const { data: updatedNotices, error: verifyError } = await supabase
    .from('notices')
    .select('id, organization_id, department_id')
    .eq('organization_id', demoOrg.id)
    .limit(5);

  if (!verifyError && updatedNotices) {
    console.log(`\n✅ Verification: ${updatedNotices.length} notices now linked to organization and department`);
    console.log('Sample:', updatedNotices[0]);
  }

  console.log('\n✅ Done! Council portal should now show notices.');
}

fixNoticeAssociations().catch(console.error);
