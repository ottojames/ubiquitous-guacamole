import type { NoticeBase } from "@/types/notice";
import { renderNoticeTemplate, renderHtmlFromText } from "./engine";

type LicensingExtras = {
  category: "licensing";
  variant: string;
  tokens?: Record<string, string>;
};

type LicensingVariant =
  | "licensing-premises-new"
  | "licensing-premises-variation"
  | "licensing-premises-review"
  | "licensing-club-new"
  | "licensing-club-variation"
  | "licensing-club-review";

const TEMPLATES: Record<LicensingVariant, string> = {
  "licensing-premises-new": `LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}}{{#if APPLICANT_TRADING_AS}} trading as {{APPLICANT_TRADING_AS}}{{/if}} has applied to {{AUTHORITY_NAME}} for a new premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.

Licensable activities applied for: {{LICENSABLE_ACTIVITIES}}.
Proposed hours: {{ACTIVITY_SCHEDULE}}.{{#if OPENING_HOURS}} Opening hours: {{OPENING_HOURS}}.{{/if}}{{#if DPS_NAME}} The proposed designated premises supervisor is {{DPS_NAME}}.{{/if}}

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.

Any representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,

  "licensing-premises-variation": `LICENSING ACT 2003
APPLICATION TO VARY A PREMISES LICENCE

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} to vary the premises licence at {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.

Nature of variation: {{NATURE_OF_VARIATION}}.
Licensable activities/hours after variation: {{ACTIVITY_SCHEDULE}}.{{#if OPENING_HOURS}} Opening hours: {{OPENING_HOURS}}.{{/if}}{{#if DPS_NAME}} Designated premises supervisor (if applicable): {{DPS_NAME}}.{{/if}}

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.

Any representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,

  "licensing-premises-review": `LICENSING ACT 2003
APPLICATION FOR REVIEW OF A PREMISES LICENCE

{{REVIEW_APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a review of the premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.

Grounds for review: {{REVIEW_GROUNDS}}{{#if LICENSING_OBJECTIVES}} (relating to: {{LICENSING_OBJECTIVES}}){{/if}}.

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.

Any representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,

  "licensing-club-new": `LICENSING ACT 2003
APPLICATION FOR A NEW CLUB PREMISES CERTIFICATE

{{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a club premises certificate at {{PREMISES_ADDRESS}} for the following qualifying club activities: {{LICENSABLE_ACTIVITIES}}. Proposed hours: {{ACTIVITY_SCHEDULE}}.

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.

Any representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,

  "licensing-club-variation": `LICENSING ACT 2003
APPLICATION TO VARY A CLUB PREMISES CERTIFICATE

{{APPLICANT_NAME}} seeks to vary the club premises certificate at {{PREMISES_ADDRESS}}. Nature of variation: {{NATURE_OF_VARIATION}}. Hours/activities after variation: {{ACTIVITY_SCHEDULE}}.

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.

Any representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,

  "licensing-club-review": `LICENSING ACT 2003
APPLICATION FOR REVIEW OF A CLUB PREMISES CERTIFICATE

{{REVIEW_APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a review of the club premises certificate for {{PREMISES_ADDRESS}}. Grounds: {{REVIEW_GROUNDS}}.

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.

Any representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`,
};

function getLicensingContext(notice: NoticeBase): { variant: LicensingVariant; tokens: Record<string, string> } {
  const extras = (notice.extras ?? {}) as LicensingExtras;
  if (extras.category !== "licensing") {
    throw new Error("Licensing template requires licensing extras");
  }
  const variant = extras.variant as LicensingVariant;
  if (!variant || !(variant in TEMPLATES)) {
    throw new Error(`Unsupported licensing variant: ${extras.variant}`);
  }
  const tokens = extras.tokens ?? {};
  return { variant, tokens };
}

export function renderLicensingText(notice: NoticeBase): string {
  const { variant, tokens } = getLicensingContext(notice);
  const template = TEMPLATES[variant];
  return renderNoticeTemplate(template, tokens);
}

export function renderLicensingHtml(notice: NoticeBase): string {
  return renderHtmlFromText(renderLicensingText(notice));
}

export async function renderLicensingPdf(): Promise<Uint8Array> {
  throw new Error("PDF rendering is server-only. TODO: move licensing PDF generation to an API endpoint.");
}
