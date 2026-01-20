import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get all organizations with their departments
  const { data: orgs, error: orgsErr } = await supabase
    .from('organizations')
    .select('id, name, slug, departments(id, name, slug)')
    .ilike('name', '%sampleton%');

  if (orgsErr) {
    console.error('Error:', orgsErr);
    return;
  }

  console.log('Sampleton organizations and departments:');
  console.log(JSON.stringify(orgs, null, 2));

  // Also check if there are any templates for Sampleton departments
  if (orgs && orgs.length > 0) {
    for (const org of orgs) {
      const departments = (org as any).departments || [];
      for (const dept of departments) {
        const { data: templates } = await supabase
          .from('templates')
          .select('id, name, notice_type, template_text')
          .eq('department_id', dept.id);

        console.log('\nTemplates for ' + dept.name + ' (' + dept.id + '):');
        if (templates && templates.length > 0) {
          templates.forEach((t: any) => {
            console.log('  - ' + t.name + ' (' + t.notice_type + '): ' + (t.template_text ? 'has text' : 'no text'));
          });
        } else {
          console.log('  No templates');
        }
      }
    }
  }

  // Check if there's a notice with Sampleton department
  const { data: notices } = await supabase
    .from('notices')
    .select('id, notice_type, organization_id, department_id, description')
    .not('organization_id', 'is', null)
    .limit(5);

  console.log('\n\nRecent notices with organization_id set:');
  console.log(JSON.stringify(notices, null, 2));
}

main().catch(console.error);
