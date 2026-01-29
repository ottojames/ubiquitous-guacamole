import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

const router = Router();

// ============================================================================
// Template Engine (replicated from src/next/publish/templates/engine.ts)
// ============================================================================

const CONDITIONAL_REGEX = /\{\{#if\s+([A-Z0-9_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
const TOKEN_REGEX = /\{\{([A-Z0-9_]+)\}\}/g;

function applyConditionals(template: string, tokens: Record<string, any>): string {
  return template.replace(CONDITIONAL_REGEX, (_match, key: string, block: string) => {
    const raw = tokens[key];
    const value = typeof raw === 'string' ? raw.trim() : String(raw || '');
    if (value && value !== 'false') {
      return applyConditionals(block, tokens);
    }
    return '';
  });
}

function replaceTokens(template: string, tokens: Record<string, any>): string {
  return template.replace(TOKEN_REGEX, (_match, key: string) => {
    const raw = tokens[key];
    const value = typeof raw === 'string' ? raw.trim() : String(raw || '');
    return value.length ? value : `[[missing:${key}]]`;
  });
}

function cleanParagraphs(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .reduce<string[]>((acc, line) => {
      if (!line) {
        if (acc.length === 0 || acc[acc.length - 1] !== '') {
          acc.push('');
        }
      } else {
        acc.push(line);
      }
      return acc;
    }, [])
    .filter((line, index, arr) => !(line === '' && (index === 0 || index === arr.length - 1)))
    .join('\n');
}

function renderNoticeTemplate(template: string, tokens: Record<string, any>): string {
  const withConditionals = applyConditionals(template, tokens);
  const withTokens = replaceTokens(withConditionals, tokens);
  const normalised = withTokens.replace(/\n{3,}/g, '\n\n');
  return cleanParagraphs(normalised).trim();
}

// ============================================================================
// All Notice Templates
// ============================================================================

const LICENSING_TEMPLATES: Record<string, string> = {
  'licensing-premises-new': `LICENSING ACT 2003\nAPPLICATION FOR A NEW PREMISES LICENCE\n\nNotice is hereby given that {{APPLICANT_NAME}}{{#if APPLICANT_TRADING_AS}} trading as {{APPLICANT_TRADING_AS}}{{/if}} has applied{{#if HAS_MULTIPLE_AUTHORITIES}} concurrently{{/if}} to {{AUTHORITY_NAMES_LIST}} for a new premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.\n\nLicensable activities applied for: {{LICENSABLE_ACTIVITIES}}.\nProposed hours: {{ACTIVITY_SCHEDULE}}.{{#if OPENING_HOURS}} Opening hours: {{OPENING_HOURS}}.{{/if}}\n\nThe application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.\n\nAny representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.\n\nIt is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,
  'licensing-premises-variation': `LICENSING ACT 2003\nAPPLICATION TO VARY A PREMISES LICENCE\n\n{{APPLICANT_NAME}} has applied{{#if HAS_MULTIPLE_AUTHORITIES}} concurrently{{/if}} to {{AUTHORITY_NAMES_LIST}} to vary the premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.\n\nNature of variation: {{NATURE_OF_VARIATION}}.\nLicensable activities/hours after variation: {{ACTIVITY_SCHEDULE}}.{{#if OPENING_HOURS}} Opening hours: {{OPENING_HOURS}}.{{/if}}\n\nThe application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.\n\nAny representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.\n\nIt is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,
  'licensing-premises-review': `LICENSING ACT 2003\nAPPLICATION FOR REVIEW OF A PREMISES LICENCE\n\n{{REVIEW_APPLICANT_NAME}} has applied{{#if HAS_MULTIPLE_AUTHORITIES}} concurrently{{/if}} to {{AUTHORITY_NAMES_LIST}} for a review of the premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.\n\nGrounds for review: {{REVIEW_GROUNDS}}{{#if LICENSING_OBJECTIVES}} (relating to: {{LICENSING_OBJECTIVES}}){{/if}}.\n\nThe application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.\n\nAny representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.\n\nIt is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,
  'licensing-club-new': `LICENSING ACT 2003\nAPPLICATION FOR A NEW CLUB PREMISES CERTIFICATE\n\n{{APPLICANT_NAME}} has applied{{#if HAS_MULTIPLE_AUTHORITIES}} concurrently{{/if}} to {{AUTHORITY_NAMES_LIST}} for a club premises certificate at {{PREMISES_ADDRESS}} for the following qualifying club activities: {{LICENSABLE_ACTIVITIES}}. Proposed hours: {{ACTIVITY_SCHEDULE}}.\n\nThe application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.\n\nAny representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.\n\nIt is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,
  'licensing-club-variation': `LICENSING ACT 2003\nAPPLICATION TO VARY A CLUB PREMISES CERTIFICATE\n\n{{APPLICANT_NAME}} seeks to vary{{#if HAS_MULTIPLE_AUTHORITIES}} concurrently with {{AUTHORITY_NAMES_LIST}}{{/if}} the club premises certificate at {{PREMISES_ADDRESS}}. Nature of variation: {{NATURE_OF_VARIATION}}. Hours/activities after variation: {{ACTIVITY_SCHEDULE}}.\n\nThe application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.\n\nAny representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.\n\nIt is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,
  'licensing-club-review': `LICENSING ACT 2003\nAPPLICATION FOR REVIEW OF A CLUB PREMISES CERTIFICATE\n\n{{REVIEW_APPLICANT_NAME}} has applied{{#if HAS_MULTIPLE_AUTHORITIES}} concurrently{{/if}} to {{AUTHORITY_NAMES_LIST}} for a review of the club premises certificate for {{PREMISES_ADDRESS}}. Grounds: {{REVIEW_GROUNDS}}.\n\nThe application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.\n\nAny representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.\n\nIt is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,
};

const GAMBLING_TEMPLATES: Record<string, string> = {
  'gambling-betting-new': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION FOR A NEW BETTING PREMISES LICENCE\n\n{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a betting premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.{{#if LICENSABLE_ACTIVITIES}} Proposed activities: {{LICENSABLE_ACTIVITIES}}.{{/if}}{{#if OPENING_HOURS}} Proposed hours: {{OPENING_HOURS}}.{{/if}}\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.\n\nThe application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}. Any representations must be made {{REPRESENTATION_METHOD}} to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.`,
  'gambling-betting-variation': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION TO VARY A BETTING PREMISES LICENCE\n\n{{APPLICANT_NAME}} seeks to vary the betting premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Nature of variation: {{NATURE_OF_VARIATION}}.{{#if OPENING_HOURS}} Hours/arrangements after variation: {{OPENING_HOURS}}.{{/if}}\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
  'gambling-betting-review': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION FOR REVIEW OF A BETTING PREMISES LICENCE\n\n{{REVIEW_APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a review of the betting premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Grounds: {{REVIEW_GROUNDS}}.\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
  'gambling-betting-transfer': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION TO TRANSFER A BETTING PREMISES LICENCE\n\nApplication has been made to {{AUTHORITY_NAME}} to transfer the betting premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}} from {{TRANSFER_FROM_NAME}} to {{TRANSFER_TO_NAME}}.\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
  'gambling-bingo-new': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION FOR A NEW BINGO PREMISES LICENCE\n\n{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a bingo premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.{{#if LICENSABLE_ACTIVITIES}} Proposed activities: {{LICENSABLE_ACTIVITIES}}.{{/if}}{{#if OPENING_HOURS}} Proposed hours: {{OPENING_HOURS}}.{{/if}}\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nThe application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}. Any representations must be made {{REPRESENTATION_METHOD}} to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.`,
  'gambling-bingo-variation': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION TO VARY A BINGO PREMISES LICENCE\n\n{{APPLICANT_NAME}} seeks to vary the bingo premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Nature of variation: {{NATURE_OF_VARIATION}}.{{#if OPENING_HOURS}} Hours/arrangements after variation: {{OPENING_HOURS}}.{{/if}}\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
  'gambling-bingo-review': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION FOR REVIEW OF A BINGO PREMISES LICENCE\n\n{{REVIEW_APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a review of the bingo premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Grounds: {{REVIEW_GROUNDS}}.\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
  'gambling-bingo-transfer': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION TO TRANSFER A BINGO PREMISES LICENCE\n\nApplication has been made to {{AUTHORITY_NAME}} to transfer the bingo premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}} from {{TRANSFER_FROM_NAME}} to {{TRANSFER_TO_NAME}}.\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
  'gambling-agc-new': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION FOR A NEW ADULT GAMING CENTRE PREMISES LICENCE\n\n{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for an Adult Gaming Centre premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.{{#if LICENSABLE_ACTIVITIES}} Proposed activities: {{LICENSABLE_ACTIVITIES}}.{{/if}}{{#if OPENING_HOURS}} Proposed hours: {{OPENING_HOURS}}.{{/if}}\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nThe application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}. Any representations must be made {{REPRESENTATION_METHOD}} to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.`,
  'gambling-agc-variation': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION TO VARY AN ADULT GAMING CENTRE PREMISES LICENCE\n\n{{APPLICANT_NAME}} seeks to vary the Adult Gaming Centre premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Nature of variation: {{NATURE_OF_VARIATION}}.{{#if OPENING_HOURS}} Hours/arrangements after variation: {{OPENING_HOURS}}.{{/if}}\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
  'gambling-agc-review': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION FOR REVIEW OF AN ADULT GAMING CENTRE PREMISES LICENCE\n\n{{REVIEW_APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a review of the Adult Gaming Centre premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Grounds: {{REVIEW_GROUNDS}}.\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
  'gambling-agc-transfer': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION TO TRANSFER AN ADULT GAMING CENTRE PREMISES LICENCE\n\nApplication has been made to {{AUTHORITY_NAME}} to transfer the Adult Gaming Centre premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}} from {{TRANSFER_FROM_NAME}} to {{TRANSFER_TO_NAME}}.\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
  'gambling-fec-new': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION FOR A NEW FAMILY ENTERTAINMENT CENTRE PREMISES LICENCE\n\n{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a Family Entertainment Centre premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.{{#if LICENSABLE_ACTIVITIES}} Proposed activities: {{LICENSABLE_ACTIVITIES}}.{{/if}}{{#if OPENING_HOURS}} Proposed hours: {{OPENING_HOURS}}.{{/if}}\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nThe application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}. Any representations must be made {{REPRESENTATION_METHOD}} to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.`,
  'gambling-fec-variation': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION TO VARY A FAMILY ENTERTAINMENT CENTRE PREMISES LICENCE\n\n{{APPLICANT_NAME}} seeks to vary the Family Entertainment Centre premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Nature of variation: {{NATURE_OF_VARIATION}}.{{#if OPENING_HOURS}} Hours/arrangements after variation: {{OPENING_HOURS}}.{{/if}}\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
  'gambling-fec-review': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION FOR REVIEW OF A FAMILY ENTERTAINMENT CENTRE PREMISES LICENCE\n\n{{REVIEW_APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a review of the Family Entertainment Centre premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Grounds: {{REVIEW_GROUNDS}}.\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
  'gambling-fec-transfer': `GAMBLING ACT 2005, SCHEDULE 9\nAPPLICATION TO TRANSFER A FAMILY ENTERTAINMENT CENTRE PREMISES LICENCE\n\nApplication has been made to {{AUTHORITY_NAME}} to transfer the Family Entertainment Centre premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}} from {{TRANSFER_FROM_NAME}} to {{TRANSFER_TO_NAME}}.\n\nAny representations must relate to one or more of the licensing objectives under the Gambling Act 2005.\n\nInspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
};

const PLANNING_TEMPLATES: Record<string, string> = {
  'planning-major': `TOWN AND COUNTRY PLANNING ACT 1990\nAPPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — MAJOR DEVELOPMENT\n\n{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.\n\nDetails can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} by {{DEADLINE_DATE}}.`,
  'planning-eia': `TOWN AND COUNTRY PLANNING (ENVIRONMENTAL IMPACT ASSESSMENT) REGULATIONS\nAPPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — EIA DEVELOPMENT\n\nAn application accompanied by an Environmental Statement has been made by {{APPLICANT_NAME}} to {{AUTHORITY_NAME}} at {{SITE_ADDRESS}}: {{PROPOSAL_DESCRIPTION}}.\n\nThe Environmental Statement and application documents may be inspected at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Any representations must be submitted {{COMMENT_METHOD}} by {{DEADLINE_DATE}}.`,
  'planning-listed': `PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990\nAPPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — LISTED BUILDING\n\n{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.\n\nThis application affects a listed building and has been notified to Historic England and other statutory consultees as required by the Planning (Listed Buildings and Conservation Areas) Act 1990.\n\nDetails can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} by {{DEADLINE_DATE}}.`,
  'planning-conservation': `PLANNING (LISTED BUILDINGS AND CONSERVATION AREAS) ACT 1990\nAPPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — CONSERVATION AREA\n\n{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.\n\nThis application affects a conservation area and has been notified to relevant heritage bodies and statutory consultees as required by the Planning (Listed Buildings and Conservation Areas) Act 1990.\n\nDetails can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} by {{DEADLINE_DATE}}.`,
  'planning-prow': `TOWN AND COUNTRY PLANNING ACT 1990\nAPPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — PUBLIC RIGHT OF WAY\n\n{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.\n\nDetails can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} by {{DEADLINE_DATE}}.`,
  'planning-departure': `TOWN AND COUNTRY PLANNING ACT 1990\nAPPLICATION REFERENCE: {{APPLICATION_REFERENCE}} — DEPARTURE\n\n{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for planning permission at {{SITE_ADDRESS}} described as: {{PROPOSAL_DESCRIPTION}}.\n\nDetails can be viewed at {{INSPECTION_LOCATION}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}. Comments must be submitted {{COMMENT_METHOD}} to {{AUTHORITY_NAME}} by {{DEADLINE_DATE}}.`,
};

const TRO_TEMPLATES: Record<string, string> = {
  'tro-permanent': `ROAD TRAFFIC REGULATION ACT 1984\n\n{{AUTHORITY_NAME}}\n\n{{ORDER_TITLE}}\n\nNOTICE IS HEREBY GIVEN that {{AUTHORITY_NAME}} proposes to make the above Order.\n\nThe effect of the Order will be to {{ORDER_DESCRIPTION}}.\n\nRoads affected: {{ROADS_AFFECTED}}.\n\n{{#if REASON_FOR_ORDER}}Reason: {{REASON_FOR_ORDER}}.{{/if}}\n\nA copy of the proposed Order and a map showing the roads to which it relates, together with a statement of the Council's reasons for proposing to make the Order, may be inspected at {{INSPECTION_LOCATION}}{{#if INSPECTION_HOURS}} during {{INSPECTION_HOURS}}{{/if}}.\n\nIf you wish to object to the proposed Order you should send the grounds of your objection in writing to {{OBJECTION_METHOD}} by {{OBJECTION_DEADLINE}}.{{#if OBJECTION_ADDRESS}} Address: {{OBJECTION_ADDRESS}}.{{/if}}\n\nIf no objections are received, or if objections received are subsequently withdrawn, {{AUTHORITY_NAME}} may make the Order in the form proposed.\n\nDated {{PUBLICATION_DATE}}`,
  'tro-temporary': `ROAD TRAFFIC REGULATION ACT 1984\n\n{{AUTHORITY_NAME}}\n\n{{ORDER_TITLE}}\n\nTEMPORARY TRAFFIC REGULATION ORDER\n\nNOTICE IS HEREBY GIVEN that {{AUTHORITY_NAME}} has made a Temporary Order.\n\nThe effect of the Order is to {{ORDER_DESCRIPTION}}.\n\nRoads affected: {{ROADS_AFFECTED}}.\n\n{{#if REASON_FOR_ORDER}}Reason: {{REASON_FOR_ORDER}}.{{/if}}\n\nThe Order will come into effect on {{EFFECTIVE_DATE}}{{#if EXPIRY_DATE}} and will remain in force until {{EXPIRY_DATE}}{{/if}}.\n\nA copy of the Order may be inspected at {{INSPECTION_LOCATION}}{{#if INSPECTION_HOURS}} during {{INSPECTION_HOURS}}{{/if}}.\n\nFor further information please contact {{AUTHORITY_NAME}}{{#if AUTHORITY_EMAIL}} at {{AUTHORITY_EMAIL}}{{/if}}.\n\nDated {{PUBLICATION_DATE}}`,
  'tro-experimental': `ROAD TRAFFIC REGULATION ACT 1984\n\n{{AUTHORITY_NAME}}\n\n{{ORDER_TITLE}}\n\nEXPERIMENTAL TRAFFIC ORDER\n\nNOTICE IS HEREBY GIVEN that {{AUTHORITY_NAME}} has made an Experimental Traffic Order.\n\nThe effect of the Order will be to {{ORDER_DESCRIPTION}}.\n\nRoads affected: {{ROADS_AFFECTED}}.\n\n{{#if REASON_FOR_ORDER}}Reason: {{REASON_FOR_ORDER}}.{{/if}}\n\nThe Experimental Order will come into effect on {{EFFECTIVE_DATE}}{{#if EXPERIMENTAL_PERIOD}} and will operate for a period of {{EXPERIMENTAL_PERIOD}}{{/if}}.\n\nA copy of the Order and a map showing the roads to which it relates may be inspected at {{INSPECTION_LOCATION}}{{#if INSPECTION_HOURS}} during {{INSPECTION_HOURS}}{{/if}}.\n\nPersons wishing to object to the experimental scheme becoming permanent should send the grounds of their objection in writing to {{OBJECTION_METHOD}} by {{OBJECTION_DEADLINE}}.{{#if OBJECTION_ADDRESS}} Address: {{OBJECTION_ADDRESS}}.{{/if}}\n\nThe Council will consider all objections received during the experimental period before deciding whether to make the Order permanent (with or without modification).\n\nDated {{PUBLICATION_DATE}}`,
};

const GVOL_TEMPLATES: Record<string, string> = {
  'gvol-new': `GOODS VEHICLE (OPERATOR'S) LICENCE\n\n{{APPLICANT_NAME}}{{#if APPLICANT_TRADING_AS}} trading as {{APPLICANT_TRADING_AS}}{{/if}} of {{APPLICANT_ADDRESS}} is applying for a {{LICENCE_CATEGORY}} operator's licence in the {{TRAFFIC_AREA}} Traffic Area.\n\nProposed operating centre: {{OPERATING_CENTRE_ADDRESS}}.\nAuthorisation: {{NUMBER_OF_VEHICLES}} goods vehicles and {{NUMBER_OF_TRAILERS}} trailers.\n\nOwners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected may make representations to the Traffic Commissioner at {{TRAFFIC_COMMISSIONER_OFFICE}} by {{DEADLINE_DATE}}.\n\nRepresentations must be made in writing. Representors must at the same time send a copy to the applicant at the address given above.`,
  'gvol-variation': `GOODS VEHICLE (OPERATOR'S) LICENCE — VARIATION\n\n{{APPLICANT_NAME}}{{#if APPLICANT_TRADING_AS}} trading as {{APPLICANT_TRADING_AS}}{{/if}} of {{APPLICANT_ADDRESS}} has applied to vary the operator's licence in the {{TRAFFIC_AREA}} Traffic Area as follows: {{GVOL_VARIATION_DETAILS}}.\n\nOperating centre: {{OPERATING_CENTRE_ADDRESS}}.\nAuthorisation after variation: {{NUMBER_OF_VEHICLES}} goods vehicles and {{NUMBER_OF_TRAILERS}} trailers.\n\nOwners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected may make representations to the Traffic Commissioner at {{TRAFFIC_COMMISSIONER_OFFICE}} by {{DEADLINE_DATE}}.\n\nRepresentations must be made in writing. Representors must at the same time send a copy to the applicant at the address given above.`,
};

const PROBATE_TEMPLATE = `TRUSTEE ACT 1925, SECTION 27\nESTATE OF {{DECEASED_NAME}}{{#if DECEASED_ALIAS}} (also known as {{DECEASED_ALIAS}}){{/if}}\nLast address: {{DECEASED_LAST_ADDRESS}} — Date of death: {{DATE_OF_DEATH}}\n\nNOTICE is hereby given pursuant to section 27 of the Trustee Act 1925 that any persons having claims against or an interest in the estate of the above-named deceased should send particulars of their claims to {{PERSONAL_REPRESENTATIVE}}{{#if SOLICITOR_NAME}} / {{SOLICITOR_NAME}}{{/if}} at {{SOLICITOR_ADDRESS}}{{#if CLAIM_REFERENCE}} quoting reference {{CLAIM_REFERENCE}}{{/if}} not later than {{DEADLINE_DATE}}.\n\nAfter this date the personal representatives will distribute the estate among the persons entitled thereto having regard only to the claims and interests of which they have had notice and will not be liable for the assets of the estate or any part thereof so distributed to any person of whose claims or interests they have not had notice at the time of distribution.`;

const ALL_TEMPLATES: Record<string, string> = {
  ...LICENSING_TEMPLATES,
  ...GAMBLING_TEMPLATES,
  ...PLANNING_TEMPLATES,
  ...TRO_TEMPLATES,
  ...GVOL_TEMPLATES,
  'probate': PROBATE_TEMPLATE,
};

// ============================================================================
// PDF Generation
// ============================================================================

interface PdfGenerationRequest {
  category: string;
  variant?: string;
  tokens: Record<string, string>;
  premisesName?: string;
  premisesAddress?: string;
  noticeType?: string;
  deadline?: string;
}

async function generateNoticePdf(data: PdfGenerationRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Determine which template to use
      let templateKey: string;
      if (data.category === 'probate') {
        templateKey = 'probate';
      } else if (data.variant) {
        templateKey = data.variant;
      } else {
        templateKey = `${data.category}-${data.variant || 'new'}`;
      }

      const template = ALL_TEMPLATES[templateKey];
      if (!template) {
        throw new Error(`Unknown template: ${templateKey}`);
      }

      // Render the notice text
      const noticeText = renderNoticeTemplate(template, data.tokens);

      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        info: {
          Title: `Notice - ${data.noticeType || data.category}`,
          Author: 'CivicNotices',
          Subject: `Public Notice - ${data.premisesName || data.category}`,
          Keywords: 'public notice, legal notice'
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('PUBLIC NOTICE', {
          align: 'center'
        });

      doc.moveDown();

      // Notice type badge
      if (data.noticeType) {
        doc.fontSize(11)
          .font('Helvetica')
          .fillColor('#666666')
          .text(data.noticeType.toUpperCase(), {
            align: 'center'
          });
        doc.fillColor('#000000');
        doc.moveDown();
      }

      // Premises info if available
      if (data.premisesName || data.premisesAddress) {
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .text(data.premisesName || '');
        if (data.premisesAddress) {
          doc.fontSize(10)
            .font('Helvetica')
            .text(data.premisesAddress);
        }
        doc.moveDown();
      }

      // Divider
      doc.strokeColor('#cccccc')
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke();

      doc.moveDown();

      // Notice text
      doc.fontSize(11)
        .font('Helvetica')
        .text(noticeText, {
          align: 'justify',
          lineGap: 4
        });

      doc.moveDown(2);

      // Deadline highlight if available
      if (data.deadline) {
        doc.rect(50, doc.y, doc.page.width - 100, 40)
          .fillColor('#fff3cd')
          .fill();

        doc.fillColor('#856404')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`Deadline for representations: ${data.deadline}`, 60, doc.y - 30, {
            width: doc.page.width - 120
          });

        doc.fillColor('#000000');
        doc.y += 20;
      }

      // Footer
      const footerY = doc.page.height - 80;

      doc.strokeColor('#cccccc')
        .moveTo(50, footerY)
        .lineTo(doc.page.width - 50, footerY)
        .stroke();

      doc.fontSize(8)
        .fillColor('#666666')
        .text('Generated by CivicNotices', 50, footerY + 10, {
          align: 'center',
          width: doc.page.width - 100
        });

      doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, {
        align: 'center',
        width: doc.page.width - 100
      });

      // Finalize
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/pdf/generate
 * Generate a PDF for a notice
 * 
 * Body:
 * - category: string (licensing, gambling, planning, tro, gvol, probate)
 * - variant: string (e.g., 'licensing-premises-new')
 * - tokens: Record<string, string>
 * - premisesName?: string
 * - premisesAddress?: string
 * - noticeType?: string
 * - deadline?: string
 */
router.post('/generate', async (req, res) => {
  try {
    const { category, variant, tokens, premisesName, premisesAddress, noticeType, deadline } = req.body;

    if (!category || !tokens) {
      return res.status(400).json({ error: 'Missing required fields: category, tokens' });
    }

    console.log('[PDF] Generating PDF for:', { category, variant, noticeType });

    const pdfBuffer = await generateNoticePdf({
      category,
      variant,
      tokens,
      premisesName,
      premisesAddress,
      noticeType,
      deadline
    });

    // Return as base64 or direct buffer
    const returnFormat = req.query.format || 'buffer';

    if (returnFormat === 'base64') {
      return res.json({
        success: true,
        pdf: pdfBuffer.toString('base64'),
        contentType: 'application/pdf'
      });
    }

    // Default: return as PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="notice-${Date.now()}.pdf"`);
    return res.send(pdfBuffer);

  } catch (error: any) {
    console.error('[PDF] Generation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate PDF' });
  }
});

/**
 * GET /api/pdf/templates
 * List available templates
 */
router.get('/templates', (_req, res) => {
  const templates = Object.keys(ALL_TEMPLATES).map(key => {
    const parts = key.split('-');
    return {
      key,
      category: parts[0],
      variant: parts.slice(1).join('-') || null
    };
  });

  return res.json({ templates });
});

export default router;
