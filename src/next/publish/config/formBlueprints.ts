import type { NoticeDefinition } from "./noticeTypes";
import { TRAFFIC_AREAS } from "./trafficAreas";

export type PlaceholderKey =
  | "NOTICE_TYPE"
  | "ACT_TITLE"
  | "AUTHORITY_NAME"
  | "AUTHORITY_ADDRESS"
  | "AUTHORITY_EMAIL"
  | "AUTHORITY_PHONE"
  | "ONLINE_REGISTER_URL"
  | "APPLICANT_NAME"
  | "APPLICANT_STATUS"
  | "APPLICANT_TRADING_AS"
  | "APPLICANT_ADDRESS"
  | "APPLICANT_COMPANY_NUMBER"
  | "PREMISES_NAME"
  | "SITE_NAME"
  | "CENTRE_NAME"
  | "PREMISES_ADDRESS"
  | "SITE_ADDRESS"
  | "APPLICATION_DATE"
  | "PUBLICATION_DATE"
  | "DEADLINE_DATE"
  | "INSPECTION_LOCATION"
  | "INSPECTION_TIMES"
  | "REPRESENTATION_ADDRESS"
  | "REPRESENTATION_EMAIL"
  | "REPRESENTATION_METHOD"
  | "REFERENCE"
  | "LICENSABLE_ACTIVITIES"
  | "ACTIVITY_SCHEDULE"
  | "OPENING_HOURS"
  | "DPS_NAME"
  | "DPS_LICENSING_AUTHORITY"
  | "ACTIVITIES_HOURS_DATA"
  | "NATURE_OF_VARIATION"
  | "TRANSFER_FROM_NAME"
  | "TRANSFER_TO_NAME"
  | "REVIEW_APPLICANT_NAME"
  | "REVIEW_GROUNDS"
  | "LICENSING_OBJECTIVES"
  | "GAMBLING_PREMISES_TYPE"
  | "TRAFFIC_AREA_NAME"
  | "LICENCE_CATEGORY"
  | "OPERATING_CENTRE_ADDRESS"
  | "NUMBER_OF_VEHICLES"
  | "NUMBER_OF_TRAILERS"
  | "GVOL_VARIATION_DETAILS"
  | "PLANNING_REASON"
  | "APPLICATION_REFERENCE"
  | "PROPOSAL_DESCRIPTION"
  | "COMMENT_METHOD"
  | "COMMENT_URL"
  | "COMMENT_EMAIL"
  | "DECEASED_NAME"
  | "DECEASED_ALIAS"
  | "DECEASED_LAST_ADDRESS"
  | "DATE_OF_DEATH"
  | "PERSONAL_REPRESENTATIVE"
  | "SOLICITOR_NAME"
  | "SOLICITOR_ADDRESS"
  | "CLAIM_REFERENCE";

export type FieldType = "text" | "textarea" | "email" | "date" | "number" | "tel" | "url" | "select";

export type FieldOption = { value: string; label: string };

export type FieldBlueprint = {
  token: PlaceholderKey;
  label: string;
  type?: FieldType;
  span?: 12 | 8 | 6 | 4;
  placeholder?: string;
  hint?: string;
  rows?: number;
  required?: boolean;
  options?: FieldOption[];
  showIf?: (ctx: BlueprintContext) => boolean;
  maxLength?: number;
};

export type SectionBlueprint = {
  id: string;
  title: string;
  description?: string;
  fields: FieldBlueprint[];
};

export type DeadlineRule =
  | { base: "APPLICATION_DATE"; offsetDays: number }
  | { base: "PUBLICATION_DATE"; offsetDays: number }
  | { base: "PUBLICATION_DATE"; addMonths: number };

export type AtLeastOneRule = {
  tokens: PlaceholderKey[];
  message: string;
};

export type FormBlueprint = {
  sections: SectionBlueprint[];
  autoValues: Array<{ token: PlaceholderKey; value: string }>;
  aliasTokens?: Array<{ source: PlaceholderKey; targets: PlaceholderKey[] }>;
  deadlineRule?: DeadlineRule;
  atLeastOne?: AtLeastOneRule[];
};

type BlueprintContext = {
  definition: NoticeDefinition;
};

type ApplicantSectionOptions = {
  addressRequired?: boolean;
  tradingAsLabel?: string;
};

const LICENCE_CATEGORY_OPTIONS: FieldOption[] = [
  { value: "Standard National", label: "Standard National" },
  { value: "Standard International", label: "Standard International" },
  { value: "Restricted", label: "Restricted" },
];

const TRAFFIC_AREA_OPTIONS: FieldOption[] = TRAFFIC_AREAS.map((area) => ({
  value: area.name,
  label: area.name,
}));

function field(token: PlaceholderKey, overrides: Partial<FieldBlueprint> = {}): FieldBlueprint {
  return {
    token,
    label: token.replace(/_/g, " ").toLowerCase(),
    type: "text",
    span: 6,
    ...overrides,
  };
}

function applicantSection(options: ApplicantSectionOptions = {}): SectionBlueprint {
  const { addressRequired = false, tradingAsLabel = "Trading name (optional)" } = options;
  return {
    id: "applicant",
    title: "Applicant / Publisher",
    fields: [
      field("APPLICANT_NAME", {
        label: "Applicant name",
        required: true,
        span: 12,
      }),
      field("APPLICANT_STATUS", {
        label: "Applicant status",
        hint: "e.g., individual, company, LLP",
        span: 12,
      }),
      field("APPLICANT_TRADING_AS", {
        label: tradingAsLabel,
        span: 12,
      }),
      field("APPLICANT_ADDRESS", {
        label: "Applicant address",
        type: "textarea",
        rows: 3,
        required: addressRequired,
        span: 12,
        hint: "Include postcode and country if outside the UK.",
      }),
      field("APPLICANT_COMPANY_NUMBER", {
        label: "Company number (optional)",
        span: 12,
      }),
    ],
  };
}

function premisesSection(title: string, nameLabel: string, addressToken: PlaceholderKey): SectionBlueprint {
  return {
    id: "premises",
    title,
    fields: [
      field("PREMISES_NAME", {
        label: nameLabel,
        span: 12,
      }),
      field(addressToken, {
        label: "Address",
        type: "textarea",
        rows: 3,
        required: true,
        span: 12,
        hint: "Single block including postcode.",
      }),
    ],
  };
}

/**
 * Get only mandatory fields for OCR confirmation form
 * This filters the full blueprint to show only required fields
 * Special exceptions: AUTHORITY_ADDRESS and REPRESENTATION_ADDRESS are included for address lookup
 */
export function getMandatoryFieldsForOCR(definition: NoticeDefinition): FormBlueprint {
  const fullBlueprint = getFormBlueprint(definition);

  // Fields that should always appear in OCR form even if not required
  const alwaysInclude: PlaceholderKey[] = ["APPLICANT_NAME", "PREMISES_NAME"];

  // Filter sections to include only required fields
  const mandatorySections = fullBlueprint.sections.map(section => {
    const mandatoryFields = section.fields.filter(field => {
      // Exclude ACTIVITY_SCHEDULE from OCR route - hours are already on the uploaded document
      if (field.token === "ACTIVITY_SCHEDULE") return false;

      // Apply showIf condition if present
      if (field.showIf && !field.showIf({ definition })) return false;

      // Include if field is required OR if it's in the alwaysInclude list
      if (field.required || alwaysInclude.includes(field.token)) {
        return true;
      }

      return false;
    });

    // Only return section if it has mandatory fields
    if (mandatoryFields.length === 0) return null;

    return {
      ...section,
      fields: mandatoryFields,
    };
  }).filter((section): section is SectionBlueprint => section !== null);

  return {
    ...fullBlueprint,
    sections: mandatorySections,
  };
}

export function getFormBlueprint(definition: NoticeDefinition): FormBlueprint {
  const ctx: BlueprintContext = { definition };

  switch (definition.category) {
    case "licensing": {
      const isPremises = definition.id.includes("premises");
      const isVariation = definition.id.includes("variation");
      const isReview = definition.id.includes("review");

      const sections: SectionBlueprint[] = [
        {
          id: "applicant",
          title: "Applicant / Publisher",
          fields: [
            field("APPLICANT_NAME", {
              label: "Applicant name",
              required: true,
              span: 12,
            }),
            field("APPLICANT_STATUS", {
              label: "Applicant status",
              hint: "e.g., individual, company, LLP",
              span: 12,
            }),
            field("APPLICANT_TRADING_AS", {
              label: "Trading name (optional)",
              span: 12,
            }),
            field("APPLICANT_ADDRESS", {
              label: "Applicant address",
              type: "textarea",
              rows: 3,
              required: true,
              span: 12,
              hint: "Include postcode and country if outside the UK.",
            }),
            field("APPLICANT_COMPANY_NUMBER", {
              label: "Company number (optional)",
              span: 12,
            }),
          ],
        },
        {
          id: "premises",
          title: "Premises",
          fields: [
            field("PREMISES_NAME", {
              label: "Premises name",
              span: 12,
              required: true,
              hint: "Required if applicable to the premises",
            }),
            field("PREMISES_ADDRESS", {
              label: "Premises address",
              type: "textarea",
              rows: 3,
              required: true,
              span: 12,
              hint: "Single block including postcode.",
            }),
          ],
        },
        {
          id: "activities-hours",
          title: "Activities & hours",
          fields: [
            field("LICENSABLE_ACTIVITIES", {
              label: "Licensable activities",
              type: "textarea",
              rows: 3,
              required: true,
              span: 12,
              hint: "Select from the list or provide a concise summary",
            }),
            field("ACTIVITY_SCHEDULE", {
              label: "Activity schedule (summary)",
              type: "textarea",
              rows: 4,
              required: true,
              span: 12,
              hint: 'Concise one-line summary per activity, e.g., "Sale of alcohol (on/off): Mon–Sun 09:00–23:00"',
            }),
            field("OPENING_HOURS", {
              label: "Opening hours (if different)",
              type: "textarea",
              rows: 3,
              span: 12,
              hint: "Times shown are when the activity may take place. Opening hours may differ.",
            }),
            field("DPS_NAME", {
              label: "Designated premises supervisor (DPS)",
              required: isPremises,
              span: 12,
              showIf: () => isPremises,
              hint: "Only required if alcohol is included.",
            }),
            field("DPS_LICENSING_AUTHORITY", {
              label: "DPS licensing authority",
              span: 12,
              showIf: () => isPremises,
            }),
            field("NATURE_OF_VARIATION", {
              label: "Nature of variation",
              type: "textarea",
              rows: 4,
              required: isVariation,
              span: 12,
              maxLength: 1500,
              hint: "Describe the change in plain English (max 1,500 characters, soft warn at 1,200).",
              showIf: () => isVariation,
            }),
            field("REVIEW_APPLICANT_NAME", {
              label: "Review applicant name",
              required: isReview,
              span: 12,
              showIf: () => isReview,
            }),
            field("REVIEW_GROUNDS", {
              label: "Review grounds",
              type: "textarea",
              rows: 4,
              required: isReview,
              span: 12,
              maxLength: 1500,
              hint: "Outline the grounds briefly (max 1,500 characters, soft warn at 1,200).",
              showIf: () => isReview,
            }),
            field("LICENSING_OBJECTIVES", {
              label: "Licensing objectives (optional)",
              type: "textarea",
              rows: 3,
              span: 12,
              showIf: () => isReview,
            }),
          ],
        },
        {
          id: "dates",
          title: "Dates",
          fields: [
            field("APPLICATION_DATE", {
              label: "Application date",
              type: "date",
              required: true,
              span: 12,
            }),
            field("PUBLICATION_DATE", {
              label: "Publication date (optional)",
              type: "date",
              span: 12,
            }),
            field("DEADLINE_DATE", {
              label: "Representation deadline",
              type: "date",
              required: true,
              span: 12,
              hint: "We've set this to 28 days from the day after your application date. Change only if instructed by the authority.",
            }),
          ],
        },
        {
          id: "authority",
          title: "Authority & representations",
          fields: [
            field("AUTHORITY_NAME", {
              label: "Licensing authority name",
              required: true,
              span: 12,
            }),
            field("AUTHORITY_ADDRESS", {
              label: "Authority address",
              type: "textarea",
              rows: 3,
              span: 12,
            }),
            field("AUTHORITY_EMAIL", {
              label: "Authority email",
              type: "email",
              span: 12,
            }),
            field("AUTHORITY_PHONE", {
              label: "Authority phone (optional)",
              span: 12,
            }),
            field("ONLINE_REGISTER_URL", {
              label: "Online register URL (optional)",
              type: "url",
              span: 12,
            }),
            field("INSPECTION_LOCATION", {
              label: "Inspection location",
              type: "textarea",
              rows: 3,
              required: false,
              span: 12,
              showIf: () => false,
            }),
            field("REPRESENTATION_ADDRESS", {
              label: "Representation address",
              type: "textarea",
              rows: 3,
              span: 12,
              showIf: () => !isPremises,
            }),
            field("REPRESENTATION_EMAIL", {
              label: "Representation email",
              type: "email",
              span: 12,
              showIf: () => !isPremises,
            }),
          ],
        },
      ];

      return {
        sections,
        autoValues: [
          { token: "NOTICE_TYPE", value: definition.label },
          { token: "ACT_TITLE", value: "Licensing Act 2003" },
          { token: "REPRESENTATION_METHOD", value: "in writing" },
        ],
        aliasTokens: [{ source: "PREMISES_NAME", targets: ["SITE_NAME", "CENTRE_NAME"] }],
        deadlineRule: { base: "APPLICATION_DATE", offsetDays: 28 },
        // Only require representation contact for non-premises licences
        atLeastOne: isPremises ? undefined : [
          {
            tokens: ["REPRESENTATION_ADDRESS", "REPRESENTATION_EMAIL"],
            message: "Provide a postal or email contact for representations.",
          },
        ],
      };
    }
    case "gambling": {
      const isVariation = definition.id.includes("variation");
      const isReview = definition.id.includes("review");
      const isTransfer = definition.id.includes("transfer");
      const premisesType = definition.group;

      const sections: SectionBlueprint[] = [
        applicantSection(),
        premisesSection("Premises / site", "Premises or centre name", "PREMISES_ADDRESS"),
        {
          id: "application-details",
          title: "Application details",
          fields: [
            field("GAMBLING_PREMISES_TYPE", {
              label: "Premises type",
              required: true,
              span: 12,
            }),
            field("OPENING_HOURS", {
              label: "Proposed opening hours",
              type: "textarea",
              rows: 3,
              span: 12,
              required: !isReview && !isTransfer,
            }),
            field("NATURE_OF_VARIATION", {
              label: "Nature of variation",
              type: "textarea",
              rows: 4,
              required: isVariation,
              span: 12,
              maxLength: 1500,
              hint: "Describe the variation requested (max 1,500 characters).",
              showIf: () => isVariation,
            }),
            field("REVIEW_APPLICANT_NAME", {
              label: "Review applicant name",
              required: isReview,
              span: 12,
              showIf: () => isReview,
            }),
            field("REVIEW_GROUNDS", {
              label: "Review grounds",
              type: "textarea",
              rows: 4,
              required: isReview,
              span: 12,
              maxLength: 1500,
              hint: "Outline the grounds briefly (max 1,500 characters).",
              showIf: () => isReview,
            }),
            field("TRANSFER_FROM_NAME", {
              label: "Current licence holder",
              required: isTransfer,
              span: 12,
              showIf: () => isTransfer,
            }),
            field("TRANSFER_TO_NAME", {
              label: "Proposed licence holder",
              required: isTransfer,
              span: 12,
              showIf: () => isTransfer,
            }),
          ],
        },
        {
          id: "dates",
          title: "Statutory dates",
          fields: [
            field("APPLICATION_DATE", {
              label: "Application date",
              type: "date",
              required: true,
              span: 4,
            }),
            field("PUBLICATION_DATE", {
              label: "Publication date (optional)",
              type: "date",
              span: 4,
            }),
            field("DEADLINE_DATE", {
              label: "Representation deadline",
              type: "date",
              required: true,
              span: 4,
            }),
          ],
        },
        {
          id: "authority",
          title: "Authority contact",
          fields: [
            field("AUTHORITY_NAME", {
              label: "Licensing authority name",
              required: true,
              span: 12,
            }),
            field("AUTHORITY_ADDRESS", {
              label: "Authority address",
              type: "textarea",
              rows: 3,
              span: 12,
            }),
            field("AUTHORITY_EMAIL", {
              label: "Authority email",
              type: "email",
              span: 12,
            }),
            field("INSPECTION_LOCATION", {
              label: "Inspection location",
              type: "textarea",
              rows: 3,
              required: false,
              span: 12,
              showIf: () => false,
            }),
            field("REPRESENTATION_ADDRESS", {
              label: "Representation address",
              type: "textarea",
              rows: 3,
              span: 12,
            }),
            field("REPRESENTATION_EMAIL", {
              label: "Representation email",
              type: "email",
              span: 12,
            }),
          ],
        },
      ];

      return {
        sections,
        autoValues: [
          { token: "NOTICE_TYPE", value: definition.label },
          { token: "ACT_TITLE", value: "Gambling Act 2005" },
          { token: "GAMBLING_PREMISES_TYPE", value: premisesType },
          { token: "REPRESENTATION_METHOD", value: "in writing" },
        ],
        aliasTokens: [{ source: "PREMISES_NAME", targets: ["SITE_NAME", "CENTRE_NAME"] }],
        deadlineRule: { base: "APPLICATION_DATE", offsetDays: 28 },
        atLeastOne: [
          {
            tokens: ["REPRESENTATION_ADDRESS", "REPRESENTATION_EMAIL"],
            message: "Provide a postal or email contact for representations.",
          },
        ],
      };
    }
    case "gvol": {
      const isVariation = definition.id.includes("variation");

      const sections: SectionBlueprint[] = [
        applicantSection({ addressRequired: true, tradingAsLabel: "Trading name (if any)" }),
        {
          id: "application-details",
          title: "Application details",
          fields: [
            field("LICENCE_CATEGORY", {
              label: "Licence category",
              required: true,
              span: 12,
              type: "select",
              options: LICENCE_CATEGORY_OPTIONS,
            }),
            field("TRAFFIC_AREA_NAME", {
              label: "Traffic area",
              required: true,
              span: 12,
              type: "select",
              options: TRAFFIC_AREA_OPTIONS,
            }),
            field("OPERATING_CENTRE_ADDRESS", {
              label: "Operating centre address",
              type: "textarea",
              rows: 3,
              required: true,
              span: 12,
              hint: "Include full postal address.",
            }),
            field("NUMBER_OF_VEHICLES", {
              label: "Number of vehicles",
              type: "number",
              required: true,
              span: 12,
            }),
            field("NUMBER_OF_TRAILERS", {
              label: "Number of trailers",
              type: "number",
              required: true,
              span: 12,
            }),
            field("GVOL_VARIATION_DETAILS", {
              label: "Variation details",
              type: "textarea",
              rows: 4,
              required: isVariation,
              span: 12,
              maxLength: 1500,
              hint: "Summarise the material changes (max 1,500 characters).",
              showIf: () => isVariation,
            }),
          ],
        },
        {
          id: "dates",
          title: "Statutory dates",
          fields: [
            field("PUBLICATION_DATE", {
              label: "Publication date",
              type: "date",
              required: true,
              span: 6,
            }),
            field("DEADLINE_DATE", {
              label: "Objection deadline",
              type: "date",
              required: true,
              span: 6,
            }),
          ],
        },
        {
          id: "authority",
          title: "Traffic Commissioner contact",
          fields: [
            field("AUTHORITY_NAME", {
              label: "Traffic Commissioner / Area office",
              required: true,
              span: 12,
            }),
            field("AUTHORITY_ADDRESS", {
              label: "Address for representations",
              type: "textarea",
              rows: 3,
              required: true,
              span: 12,
            }),
          ],
        },
      ];

      return {
        sections,
        autoValues: [
          { token: "NOTICE_TYPE", value: definition.label },
          { token: "AUTHORITY_NAME", value: "The Traffic Commissioner" },
          { token: "REPRESENTATION_METHOD", value: "in writing" },
        ],
        aliasTokens: [{ source: "PREMISES_NAME", targets: ["SITE_NAME", "CENTRE_NAME"] }],
        deadlineRule: { base: "PUBLICATION_DATE", offsetDays: 21 },
      };
    }
    case "planning": {
      const sections: SectionBlueprint[] = [
        applicantSection(),
        {
          id: "site",
          title: "Site / proposal",
          fields: [
            field("SITE_NAME", {
              label: "Site name (optional)",
              span: 12,
            }),
            field("SITE_ADDRESS", {
              label: "Site address",
              type: "textarea",
              rows: 3,
              required: true,
              span: 12,
              hint: "Single block including postcode.",
            }),
          ],
        },
        {
          id: "application-details",
          title: "Application details",
          fields: [
            field("APPLICATION_REFERENCE", {
              label: "Application reference",
              required: true,
              span: 12,
            }),
            field("PLANNING_REASON", {
              label: "Press notice reason",
              span: 12,
              hint: "e.g., Major Development, EIA Development.",
            }),
            field("PROPOSAL_DESCRIPTION", {
              label: "Proposal description",
              type: "textarea",
              rows: 4,
              required: true,
              span: 12,
              maxLength: 1500,
              hint: "Concise description of the proposal (max 1,500 characters).",
            }),
            field("COMMENT_METHOD", {
              label: "Comment method",
              required: true,
              span: 12,
            }),
            field("COMMENT_EMAIL", {
              label: "Comment email",
              type: "email",
              span: 12,
            }),
            field("COMMENT_URL", {
              label: "Comment URL",
              type: "url",
              span: 12,
            }),
          ],
        },
        {
          id: "dates",
          title: "Statutory dates",
          fields: [
            field("PUBLICATION_DATE", {
              label: "Publication date",
              type: "date",
              required: true,
              span: 6,
            }),
            field("DEADLINE_DATE", {
              label: "Comment deadline",
              type: "date",
              required: true,
              span: 6,
            }),
          ],
        },
        {
          id: "authority",
          title: "Planning authority",
          fields: [
            field("AUTHORITY_NAME", {
              label: "Authority name",
              required: true,
              span: 12,
            }),
            field("AUTHORITY_ADDRESS", {
              label: "Authority address",
              type: "textarea",
              rows: 3,
              span: 12,
            }),
            field("AUTHORITY_EMAIL", {
              label: "Authority email",
              type: "email",
              span: 12,
            }),
            field("INSPECTION_LOCATION", {
              label: "Inspection location",
              type: "textarea",
              rows: 3,
              span: 12,
              showIf: () => false,
            }),
            field("ONLINE_REGISTER_URL", {
              label: "Online register URL",
              type: "url",
              span: 12,
            }),
            field("REPRESENTATION_ADDRESS", {
              label: "Postal address for comments",
              type: "textarea",
              rows: 3,
              span: 12,
            }),
          ],
        },
      ];

      const offset = definition.id === "planning-eia" ? 30 : 21;

      return {
        sections,
        autoValues: [
          { token: "NOTICE_TYPE", value: definition.label },
          { token: "ACT_TITLE", value: "Town and Country Planning Act 1990" },
        ],
        aliasTokens: [{ source: "SITE_NAME", targets: ["PREMISES_NAME", "CENTRE_NAME"] }],
        deadlineRule: { base: "PUBLICATION_DATE", offsetDays: offset },
        atLeastOne: [
          {
            tokens: ["COMMENT_EMAIL", "COMMENT_URL", "REPRESENTATION_ADDRESS"],
            message: "Provide at least one method for comments (email, URL, or postal address).",
          },
        ],
      };
    }
    case "probate": {
      const sections: SectionBlueprint[] = [
        {
          id: "estate",
          title: "Estate information",
          fields: [
            field("DECEASED_NAME", {
              label: "Deceased name",
              required: true,
              span: 12,
            }),
            field("DECEASED_ALIAS", {
              label: "Also known as (optional)",
              span: 12,
            }),
            field("DECEASED_LAST_ADDRESS", {
              label: "Last known address",
              type: "textarea",
              rows: 3,
              required: true,
              span: 12,
            }),
            field("DATE_OF_DEATH", {
              label: "Date of death",
              type: "date",
              required: true,
              span: 12,
            }),
          ],
        },
        {
          id: "representative",
          title: "Personal representative / solicitor",
          fields: [
            field("PERSONAL_REPRESENTATIVE", {
              label: "Personal representative",
              span: 12,
            }),
            field("SOLICITOR_NAME", {
              label: "Solicitor name",
              span: 12,
            }),
            field("SOLICITOR_ADDRESS", {
              label: "Service address",
              type: "textarea",
              rows: 3,
              required: true,
              span: 12,
            }),
            field("CLAIM_REFERENCE", {
              label: "Reference (optional)",
              span: 12,
            }),
          ],
        },
        {
          id: "dates",
          title: "Statutory dates",
          fields: [
            field("PUBLICATION_DATE", {
              label: "Publication date",
              type: "date",
              required: true,
              span: 6,
            }),
            field("DEADLINE_DATE", {
              label: "Claims deadline",
              type: "date",
              required: true,
              span: 6,
            }),
          ],
        },
      ];

      return {
        sections,
        autoValues: [{ token: "NOTICE_TYPE", value: definition.label }],
        deadlineRule: { base: "PUBLICATION_DATE", addMonths: 2 },
        atLeastOne: [
          {
            tokens: ["PERSONAL_REPRESENTATIVE", "SOLICITOR_NAME"],
            message: "Provide the personal representative or solicitor responsible for the estate.",
          },
        ],
      };
    }
    default:
      return { sections: [], autoValues: [] };
  }
}
