#!/usr/bin/env tsx
/**
 * Generate Full Notice Text for All Notices
 *
 * Uses the template system to generate properly formatted statutory notice text
 * for all notices in the database, matching the templates used in the publish flow.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map notice types to template categories
const noticeTypeToCategory: Record<string, { category: string; variant: string }> = {
  'licensing-premises-new': { category: 'licensing', variant: 'licensing-premises-new' },
  'licensing-premises-variation': { category: 'licensing', variant: 'licensing-premises-variation' },
  'licensing-premises-review': { category: 'licensing', variant: 'licensing-premises-review' },
  'club-premises-certificate': { category: 'licensing', variant: 'licensing-club-new' },
  'gambling-premises': { category: 'gambling', variant: 'gambling-premises' },
  'gvol-new': { category: 'gvol', variant: 'gvol-new' },
  'planning-application': { category: 'planning', variant: 'planning-major' },
  'planning-major-application': { category: 'planning', variant: 'planning-major' },
  'planning-listed-building': { category: 'planning', variant: 'planning-listed' },
  'planning-conservation-area': { category: 'planning', variant: 'planning-conservation' },
  'tro-permanent': { category: 'tro', variant: 'tro-permanent' },
  'tro-temporary': { category: 'tro', variant: 'tro-temporary' },
  'tro-experimental': { category: 'tro', variant: 'tro-experimental' },
};

function generateLicensingText(notice: any): string {
  const premises = notice.premises || {};
  const applicant = notice.applicant || {};
  const extras = notice.extras || {};
  const consultation = notice.consultation || {};

  const variant = noticeTypeToCategory[notice.notice_type]?.variant || 'licensing-premises-new';
  const premisesName = premises.name || 'the premises';
  const premisesAddress = premises.address || premises.postcode || 'Unknown Address';
  const applicantName = applicant.name || 'An applicant';
  const dpsName = extras.dpsName || 'To be confirmed';

  // Format activities
  const activities = extras.activities || [];
  const activitiesText = activities.length > 0
    ? activities.join(', ')
    : 'Sale of alcohol for consumption on the premises';

  // Format hours
  const hours = extras.hours || 'Monday-Sunday: 10:00-23:00';

  // Format deadline
  const deadlineDate = consultation.repsDeadline
    ? new Date(consultation.repsDeadline).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
    : '28 days from publication';

  // Get council info
  const councilEmail = notice.contact_email || 'licensing@council.gov.uk';

  if (variant === 'licensing-premises-new') {
    return `LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

Notice is hereby given that ${applicantName} has applied for a new premises licence for ${premisesName}, ${premisesAddress}.

LICENSABLE ACTIVITIES APPLIED FOR:
${activities.map((a: string) => `• ${a}`).join('\n')}

PROPOSED OPERATING HOURS:
${hours.split('\n').map((line: string) => line.trim()).filter((line: string) => line).join('\n')}

THE DESIGNATED PREMISES SUPERVISOR:
${dpsName}${extras.dpsLicenceNumber ? ` (Licence No: ${extras.dpsLicenceNumber})` : ''}

APPLICATION REFERENCE:
${extras.applicationReference || 'To be confirmed'}

HOW TO VIEW THE APPLICATION:
The application and supporting documents may be inspected by arrangement with the licensing authority during normal office hours.

HOW TO MAKE REPRESENTATIONS:
Any person wishing to make a representation about this application should do so in writing to the licensing authority at ${councilEmail} by ${deadlineDate}.

Representations must relate to one or more of the following licensing objectives:
• The prevention of crime and disorder
• Public safety
• The prevention of public nuisance
• The protection of children from harm

IMPORTANT NOTICE:
It is an offence to knowingly or recklessly make a false statement in connection with an application. The maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`;
  }

  if (variant === 'licensing-premises-variation') {
    return `LICENSING ACT 2003
APPLICATION TO VARY A PREMISES LICENCE

${applicantName} has applied to vary the premises licence at ${premisesName}, ${premisesAddress}.

NATURE OF VARIATION:
${notice.description || 'Variation of licensable activities and/or hours'}

LICENSABLE ACTIVITIES/HOURS AFTER VARIATION:
${activities.map((a: string) => `• ${a}`).join('\n')}

PROPOSED OPERATING HOURS:
${hours.split('\n').map((line: string) => line.trim()).filter((line: string) => line).join('\n')}

${extras.dpsName ? `DESIGNATED PREMISES SUPERVISOR:\n${dpsName}${extras.dpsLicenceNumber ? ` (Licence No: ${extras.dpsLicenceNumber})` : ''}` : ''}

APPLICATION REFERENCE:
${extras.applicationReference || 'To be confirmed'}

HOW TO MAKE REPRESENTATIONS:
Any representations must be made in writing to ${councilEmail} by ${deadlineDate}.

Representations must relate to one or more of the licensing objectives under the Licensing Act 2003.`;
  }

  if (variant === 'licensing-premises-review') {
    return `LICENSING ACT 2003
APPLICATION FOR REVIEW OF A PREMISES LICENCE

An application has been made for a review of the premises licence for ${premisesName}, ${premisesAddress}.

GROUNDS FOR REVIEW:
${notice.description || 'Issues relating to the licensing objectives'}

APPLICATION REFERENCE:
${extras.applicationReference || 'To be confirmed'}

HOW TO MAKE REPRESENTATIONS:
Any representations must be made in writing to ${councilEmail} by ${deadlineDate}.

The review will be conducted in accordance with the Licensing Act 2003 and relevant regulations.`;
  }

  return `LICENSING ACT 2003\n\n${applicantName} has applied for a premises licence for ${premisesName}, ${premisesAddress}.\n\nFull details available from the licensing authority.`;
}

function generatePlanningText(notice: any): string {
  const premises = notice.premises || {};
  const applicant = notice.applicant || {};
  const extras = notice.extras || {};
  const consultation = notice.consultation || {};

  const siteAddress = premises.address || premises.postcode || 'the site';
  const applicantName = applicant.name || 'An applicant';
  const proposalDescription = notice.description || premises.name || 'development works';

  const deadlineDate = consultation.repsDeadline
    ? new Date(consultation.repsDeadline).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
    : '21 days from publication';

  const councilEmail = notice.contact_email || 'planning@council.gov.uk';
  const appRef = extras.applicationReference || `PLAN/${new Date().getFullYear()}/${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;

  return `TOWN AND COUNTRY PLANNING ACT 1990
APPLICATION REFERENCE: ${appRef}

${applicantName} has applied for planning permission at ${siteAddress}.

PROPOSED DEVELOPMENT:
${proposalDescription}

HOW TO VIEW THE APPLICATION:
Full details of the application, including plans and supporting documents, may be viewed at the council's planning office during normal office hours or online via the council's planning portal.

HOW TO COMMENT:
Comments on this application must be submitted in writing to ${councilEmail} by ${deadlineDate}.

When making comments, please quote the application reference number ${appRef}.

All comments received will be placed on the public planning register and may be viewed by members of the public.`;
}

function generateGamblingText(notice: any): string {
  const premises = notice.premises || {};
  const applicant = notice.applicant || {};
  const extras = notice.extras || {};
  const consultation = notice.consultation || {};

  const premisesName = premises.name || 'the premises';
  const premisesAddress = premises.address || premises.postcode || 'Unknown Address';
  const applicantName = applicant.name || 'An applicant';

  const deadlineDate = consultation.repsDeadline
    ? new Date(consultation.repsDeadline).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
    : '28 days from publication';

  const councilEmail = notice.contact_email || 'licensing@council.gov.uk';

  return `GAMBLING ACT 2005
APPLICATION FOR PREMISES LICENCE

${applicantName} has applied for a premises licence under the Gambling Act 2005 for ${premisesName}, ${premisesAddress}.

TYPE OF PREMISES:
Adult Gaming Centre / Betting Premises / Bingo Premises (as applicable)

APPLICATION REFERENCE:
${extras.applicationReference || 'To be confirmed'}

HOW TO VIEW THE APPLICATION:
The application may be inspected by arrangement with the licensing authority during normal office hours.

HOW TO MAKE REPRESENTATIONS:
Any person may make representations about this application by writing to ${councilEmail} by ${deadlineDate}.

Representations should be based on one or more of the licensing objectives under the Gambling Act 2005:
• Preventing gambling from being a source of crime or disorder
• Ensuring gambling is conducted in a fair and open way
• Protecting children and other vulnerable persons from being harmed or exploited by gambling

IMPORTANT NOTICE:
It is an offence to provide false or misleading information in connection with this application.`;
}

function generateGvolText(notice: any): string {
  const premises = notice.premises || {};
  const applicant = notice.applicant || {};
  const consultation = notice.consultation || {};

  const operatingCentre = premises.address || premises.postcode || 'the operating centre';
  const applicantName = applicant.name || 'An applicant';

  const deadlineDate = consultation.repsDeadline
    ? new Date(consultation.repsDeadline).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
    : '21 days from publication';

  return `GOODS VEHICLES (LICENSING OF OPERATORS) ACT 1995

${applicantName} of ${operatingCentre} is applying for a licence to use that location as an operating centre for ${Math.floor(Math.random() * 10) + 1} goods vehicle(s) and ${Math.floor(Math.random() * 10) + 1} trailer(s).

Owners or occupiers of land (including buildings) near the operating centre who believe their use or enjoyment of that land would be affected should make written representations to the Traffic Commissioner at Hillcrest House, 386 Harehills Lane, Leeds, LS9 6NF, stating their reasons, within ${deadlineDate}.

Representors must at the same time send a copy of their representations to the applicant at the address given above. A guide to making representations is available from the Traffic Commissioner's office.`;
}

function generateTroText(notice: any): string {
  const premises = notice.premises || {};
  const consultation = notice.consultation || {};
  const extras = notice.extras || {};

  const roadName = premises.name || 'the highway';
  const location = premises.address || premises.postcode || 'the area';

  const deadlineDate = consultation.repsDeadline
    ? new Date(consultation.repsDeadline).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
    : '21 days from publication';

  const councilEmail = notice.contact_email || 'highways@council.gov.uk';
  const orderRef = extras.applicationReference || `TRO/${new Date().getFullYear()}/${Math.floor(Math.random() * 999)}`;

  return `ROAD TRAFFIC REGULATION ACT 1984
PROPOSED TRAFFIC REGULATION ORDER

Notice is hereby given that the Council proposes to make a Traffic Regulation Order affecting ${roadName}, ${location}.

ORDER REFERENCE:
${orderRef}

EFFECT OF THE ORDER:
${notice.description || 'The effect of the Order will be to regulate traffic in the interest of road safety and traffic management.'}

REASON FOR THE PROPOSAL:
To improve road safety, reduce congestion, and facilitate the passage of traffic.

HOW TO VIEW THE PROPOSALS:
Full details of the proposals, including plans, may be inspected at the council's highways office during normal office hours or online via the council's website.

HOW TO OBJECT:
Any objections to the proposals must be submitted in writing to ${councilEmail}, stating the grounds of objection, by ${deadlineDate}.

When objecting, please quote the order reference ${orderRef}.`;
}

function generateNoticeText(notice: any): string {
  const category = noticeTypeToCategory[notice.notice_type];

  if (!category) {
    // Fallback for unknown notice types
    const premises = notice.premises || {};
    const applicant = notice.applicant || {};
    return `PUBLIC NOTICE\n\n${applicant.name || 'Notice'} regarding ${premises.name || premises.address || 'application'}.\n\n${notice.description || 'Full details available from the relevant authority.'}`;
  }

  switch (category.category) {
    case 'licensing':
      return generateLicensingText(notice);
    case 'planning':
      return generatePlanningText(notice);
    case 'gambling':
      return generateGamblingText(notice);
    case 'gvol':
      return generateGvolText(notice);
    case 'tro':
      return generateTroText(notice);
    default:
      return notice.description || 'Public Notice - Full details available from the authority.';
  }
}

async function main() {
  console.log('🚀 Starting full notice text generation...\n');

  // Fetch all notices
  const { data: notices, error } = await supabase
    .from('notices')
    .select('*');

  if (error || !notices) {
    console.error('❌ Error fetching notices:', error);
    return;
  }

  console.log(`📋 Found ${notices.length} notices to process\n`);

  let updated = 0;
  let skipped = 0;

  for (const notice of notices) {
    try {
      const fullText = generateNoticeText(notice);

      // Update notice with generated text in description field (this is what the API reads)
      const { error: updateError } = await supabase
        .from('notices')
        .update({
          description: fullText
        })
        .eq('id', notice.id);

      if (updateError) {
        console.error(`❌ Error updating notice ${notice.id}:`, updateError.message);
        skipped++;
      } else {
        updated++;
        if (updated % 20 === 0) {
          console.log(`✅ Updated ${updated} notices...`);
        }
      }
    } catch (err: any) {
      console.error(`❌ Error processing notice ${notice.id}:`, err.message);
      skipped++;
    }
  }

  console.log(`\n🎉 Generation complete!\n`);
  console.log('📊 Summary:');
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  📝 Total: ${notices.length}`);
}

main()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
