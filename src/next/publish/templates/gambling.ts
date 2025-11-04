import type { NoticeBase } from "@/types/notice";
import { renderNoticeTemplate, renderHtmlFromText } from "./engine";

type GamblingExtras = {
  category: "gambling";
  variant: string;
  tokens?: Record<string, string>;
};

const TEMPLATES: Record<string, string> = {
  "gambling-betting-new": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION FOR A NEW BETTING PREMISES LICENCE

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a betting premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.{{#if OPENING_HOURS}} Proposed hours: {{OPENING_HOURS}}.{{/if}}

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}. Any representations must be made {{REPRESENTATION_METHOD}} to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.`,

  "gambling-betting-variation": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION TO VARY A BETTING PREMISES LICENCE

{{APPLICANT_NAME}} seeks to vary the betting premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Nature of variation: {{NATURE_OF_VARIATION}}.{{#if OPENING_HOURS}} Hours/arrangements after variation: {{OPENING_HOURS}}.{{/if}}

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,

  "gambling-betting-review": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION FOR REVIEW OF A BETTING PREMISES LICENCE

{{REVIEW_APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a review of the betting premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Grounds: {{REVIEW_GROUNDS}}.

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,

  "gambling-betting-transfer": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION TO TRANSFER A BETTING PREMISES LICENCE

Application has been made to {{AUTHORITY_NAME}} to transfer the betting premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}} from {{TRANSFER_FROM_NAME}} to {{TRANSFER_TO_NAME}}.

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,

  "gambling-bingo-new": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION FOR A NEW BINGO PREMISES LICENCE

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a bingo premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.{{#if OPENING_HOURS}} Proposed hours: {{OPENING_HOURS}}.{{/if}}

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}. Any representations must be made {{REPRESENTATION_METHOD}} to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.`,

  "gambling-bingo-variation": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION TO VARY A BINGO PREMISES LICENCE

{{APPLICANT_NAME}} seeks to vary the bingo premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Nature of variation: {{NATURE_OF_VARIATION}}.{{#if OPENING_HOURS}} Hours/arrangements after variation: {{OPENING_HOURS}}.{{/if}}

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,

  "gambling-bingo-review": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION FOR REVIEW OF A BINGO PREMISES LICENCE

{{REVIEW_APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a review of the bingo premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Grounds: {{REVIEW_GROUNDS}}.

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,

  "gambling-bingo-transfer": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION TO TRANSFER A BINGO PREMISES LICENCE

Application has been made to {{AUTHORITY_NAME}} to transfer the bingo premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}} from {{TRANSFER_FROM_NAME}} to {{TRANSFER_TO_NAME}}.

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,

  "gambling-agc-new": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION FOR A NEW ADULT GAMING CENTRE PREMISES LICENCE

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for an Adult Gaming Centre premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.{{#if OPENING_HOURS}} Proposed hours: {{OPENING_HOURS}}.{{/if}}

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}. Any representations must be made {{REPRESENTATION_METHOD}} to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.`,

  "gambling-agc-variation": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION TO VARY AN ADULT GAMING CENTRE PREMISES LICENCE

{{APPLICANT_NAME}} seeks to vary the Adult Gaming Centre premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Nature of variation: {{NATURE_OF_VARIATION}}.{{#if OPENING_HOURS}} Hours/arrangements after variation: {{OPENING_HOURS}}.{{/if}}

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,

  "gambling-agc-review": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION FOR REVIEW OF AN ADULT GAMING CENTRE PREMISES LICENCE

{{REVIEW_APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a review of the Adult Gaming Centre premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Grounds: {{REVIEW_GROUNDS}}.

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,

  "gambling-agc-transfer": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION TO TRANSFER AN ADULT GAMING CENTRE PREMISES LICENCE

Application has been made to {{AUTHORITY_NAME}} to transfer the Adult Gaming Centre premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}} from {{TRANSFER_FROM_NAME}} to {{TRANSFER_TO_NAME}}.

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,

  "gambling-fec-new": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION FOR A NEW FAMILY ENTERTAINMENT CENTRE PREMISES LICENCE

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a Family Entertainment Centre premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.{{#if OPENING_HOURS}} Proposed hours: {{OPENING_HOURS}}.{{/if}}

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}. Any representations must be made {{REPRESENTATION_METHOD}} to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.`,

  "gambling-fec-variation": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION TO VARY A FAMILY ENTERTAINMENT CENTRE PREMISES LICENCE

{{APPLICANT_NAME}} seeks to vary the Family Entertainment Centre premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Nature of variation: {{NATURE_OF_VARIATION}}.{{#if OPENING_HOURS}} Hours/arrangements after variation: {{OPENING_HOURS}}.{{/if}}

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,

  "gambling-fec-review": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION FOR REVIEW OF A FAMILY ENTERTAINMENT CENTRE PREMISES LICENCE

{{REVIEW_APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a review of the Family Entertainment Centre premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}. Grounds: {{REVIEW_GROUNDS}}.

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,

  "gambling-fec-transfer": `GAMBLING ACT 2005, SCHEDULE 9
APPLICATION TO TRANSFER A FAMILY ENTERTAINMENT CENTRE PREMISES LICENCE

Application has been made to {{AUTHORITY_NAME}} to transfer the Family Entertainment Centre premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}} from {{TRANSFER_FROM_NAME}} to {{TRANSFER_TO_NAME}}.

Any representations must relate to one or more of the licensing objectives under the Gambling Act 2005: (a) preventing gambling from being a source of crime or disorder, being associated with crime or disorder, or being used to support crime; (b) ensuring that gambling is conducted in a fair and open way; (c) protecting children and other vulnerable persons from being harmed or exploited by gambling.

Inspection and representation details as above. Deadline: {{DEADLINE_DATE}}.`,
};

function getGamblingContext(notice: NoticeBase): { variant: string; tokens: Record<string, string> } {
  const extras = (notice.extras ?? {}) as GamblingExtras;
  if (extras.category !== "gambling") {
    throw new Error("Gambling template requires gambling extras");
  }
  const template = TEMPLATES[extras.variant];
  if (!template) {
    throw new Error(`Unsupported gambling variant: ${extras.variant}`);
  }
  return { variant: extras.variant, tokens: extras.tokens ?? {} };
}

export function renderGamblingText(notice: NoticeBase): string {
  const { variant, tokens } = getGamblingContext(notice);
  return renderNoticeTemplate(TEMPLATES[variant], tokens);
}

export function renderGamblingHtml(notice: NoticeBase): string {
  return renderHtmlFromText(renderGamblingText(notice));
}

export async function renderGamblingPdf(): Promise<Uint8Array> {
  throw new Error("PDF rendering is server-only. TODO: move gambling PDF generation to an API endpoint.");
}
