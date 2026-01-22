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
  | "ACTIVITIES_HOURS_DATA"
  | "GAMBLING_ACTIVITIES_HOURS_DATA"
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
  | "COMMENT_POSTAL"
  | "EIA_PUBLICISING_DATE"
  | "CLUB_QUALIFYING_CONDITIONS"
  | "CURRENT_HOLDER_NAME"
  | "NEW_HOLDER_NAME"
  | "TRANSFER_DATE"
  | "VARIATION_DETAILS"
  | "ADDITIONAL_LICENSING_AUTHORITIES"
  | "DECEASED_NAME"
  | "DECEASED_ALIAS"
  | "DECEASED_LAST_ADDRESS"
  | "DATE_OF_DEATH"
  | "PERSONAL_REPRESENTATIVE"
  | "SOLICITOR_NAME"
  | "SOLICITOR_ADDRESS"
  | "CLAIM_REFERENCE"
  | "ORDER_TITLE"
  | "ORDER_DESCRIPTION"
  | "ROADS_AFFECTED"
  | "NATURE_OF_ORDER"
  | "REASON_FOR_ORDER"
  | "EFFECTIVE_DATE"
  | "EXPIRY_DATE"
  | "EXPERIMENTAL_PERIOD"
  | "OBJECTION_DEADLINE"
  | "OBJECTION_METHOD"
  | "OBJECTION_ADDRESS"
  | "INSPECTION_HOURS"
  | "variant"
  | "DPS_NAME"
  | "DPS_LICENSING_AUTHORITY";

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
  | { base: "PUBLICATION_DATE"; addMonths: number }
  | { base: "EIA_PUBLICISING_DATE"; offsetDays: number };

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
      // Removed APPLICANT_STATUS as per FIX-004
      // Removed APPLICANT_TRADING_AS as per US-0011
      // Removed APPLICANT_ADDRESS as per US-0011
      // Removed APPLICANT_COMPANY_NUMBER as per US-0011
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
      const isClub = definition.id.includes("club");
      const isVariation = definition.id.includes("variation");
      const isReview = definition.id.includes("review");
      const isNew = !isVariation && !isReview;

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
            // Removed APPLICANT_STATUS as per FIX-004
            // Removed APPLICANT_TRADING_AS as per FIX-004
            // Removed APPLICANT_ADDRESS as per FIX-004 (duplicate field)
            // Removed APPLICANT_COMPANY_NUMBER as per FIX-004
          ],
        },
        {
          id: "premises",
          title: isClub ? "Club premises" : "Premises",
          fields: [
            field("PREMISES_NAME", {
              label: isClub ? "Club name" : "Premises name",
              span: 12,
              required: true,
              hint: isClub ? "Full registered name of the club" : "Required if applicable to the premises",
            }),
            field("PREMISES_ADDRESS", {
              label: isClub ? "Club premises address" : "Premises address",
              type: "textarea",
              rows: 3,
              required: true,
              span: 12,
              hint: "Single block including postcode.",
            }),
            field("CLUB_QUALIFYING_CONDITIONS", {
              label: "Club qualifying conditions",
              type: "textarea",
              rows: 4,
              required: isClub && isNew,
              span: 12,
              hint: "Confirm the club meets qualifying conditions under s.62 of the Licensing Act 2003.",
              showIf: () => isClub && isNew,
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
            // Removed DPS_NAME and DPS_LICENSING_AUTHORITY as per FIX-004
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
            // Removed PUBLICATION_DATE as per FIX-004
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
            // Removed AUTHORITY_PHONE as per FIX-004
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
        {
          id: "applicant",
          title: "Applicant / Publisher",
          fields: [
            field("APPLICANT_NAME", {
              label: "Applicant name",
              required: true,
              span: 12,
            }),
            // Removed APPLICANT_STATUS as per FIX-004
            // Removed APPLICANT_TRADING_AS as per FIX-004
            // Removed APPLICANT_ADDRESS as per FIX-004 (duplicate field)
            // Removed APPLICANT_COMPANY_NUMBER as per FIX-004
          ],
        },
        {
          id: "premises",
          title: "Premises / site",
          fields: [
            field("PREMISES_NAME", {
              label: "Premises or centre name",
              span: 12,
              required: true,
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
        // NEW SECTION: Special handling for gambling activities and hours (only for new/variation)
        ...((!isReview && !isTransfer) ? [{
          id: "gambling-activities-hours",
          title: "Gambling activities and operating hours",
          description: "Select the gambling activities you're applying for and specify operating hours.",
          fields: [
            // Hidden placeholder fields for validation tracking
            // These fields are NOT rendered as form inputs (filtered in TemplateBuilderForm)
            // but ARE tracked by validation logic (blueprintMissingCount)
            // The actual UI is rendered by GamblingActivitiesSection component
            field("LICENSABLE_ACTIVITIES", {
              label: "Licensed activities",
              type: "textarea",
              rows: 3,
              required: true,
              span: 12,
              hint: "Describe the gambling activities permitted.",
            }),
            field("OPENING_HOURS", {
              label: "Proposed opening hours",
              type: "textarea",
              rows: 3,
              span: 12,
              required: true,
              hint: "Days and times of operation.",
            }),
          ],
        }] : []),
        {
          id: "application-details",
          title: "Application details",
          fields: [
            field("GAMBLING_PREMISES_TYPE", {
              label: "Premises type",
              type: "select",
              required: true,
              span: 12,
              hint: "As defined in Gambling Act 2005 Part 8. Each premises type has different activity restrictions.",
              options: [
                { value: "betting", label: "Betting premises" },
                { value: "bingo", label: "Bingo premises" },
                { value: "agc", label: "Adult Gaming Centre (AGC)" },
                { value: "fec", label: "Family Entertainment Centre (FEC)" },
              ],
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
            field("APPLICATION_DATE", {
              label: "Transfer date",
              type: "date",
              required: isTransfer,
              span: 12,
              showIf: () => isTransfer,
              hint: "Date the transfer takes effect.",
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
              required: !isTransfer,
              span: 4,
              showIf: () => !isTransfer,
            }),
            // Removed PUBLICATION_DATE as per FIX-004
            field("DEADLINE_DATE", {
              label: "Representation deadline",
              type: "date",
              required: true,
              span: 4,
              hint: "28 days after application date for new/variation/review.",
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
              required: true,
              span: 12,
            }),
            field("AUTHORITY_EMAIL", {
              label: "Authority email",
              type: "email",
              span: 12,
            }),
            // Removed AUTHORITY_PHONE as per FIX-004
            field("REPRESENTATION_ADDRESS", {
              label: "Representation address",
              type: "textarea",
              rows: 3,
              span: 12,
              hint: "Postal address for submitting representations.",
            }),
            field("REPRESENTATION_EMAIL", {
              label: "Representation email",
              type: "email",
              span: 12,
              hint: "Email address for submitting representations.",
            }),
          ],
        },
      ];

      return {
        sections,
        autoValues: [
          { token: "NOTICE_TYPE", value: definition.label },
          { token: "ACT_TITLE", value: "Gambling Act 2005" },
          { token: "GAMBLING_PREMISES_TYPE", value: premisesType.toLowerCase() },
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
            // Removed PUBLICATION_DATE as per FIX-004
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
      const isEIA = definition.id === "planning-eia";
      const isListed = definition.id === "planning-listed";
      const isConservation = definition.id === "planning-conservation";
      const isPROW = definition.id === "planning-prow";
      const isDeparture = definition.id === "planning-departure";

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
              required: isEIA || isListed || isConservation,
              span: 12,
              hint: isEIA
                ? "Explain why this is classified as EIA development."
                : isListed
                ? "Explain why listed building consent is required."
                : isConservation
                ? "Explain why conservation area consent is required."
                : "e.g., Major Development, Departure from Development Plan.",
              showIf: () => isEIA || isListed || isConservation || isDeparture,
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
            field("EIA_PUBLICISING_DATE", {
              label: "EIA publicising date",
              type: "date",
              required: isEIA,
              span: 12,
              hint: "Date the LPA directed publication under EIA Regulations 2017.",
              showIf: () => isEIA,
            }),
          ],
        },
        {
          id: "comment-methods",
          title: "Comment submission methods",
          description: "Provide at least one method for the public to submit comments.",
          fields: [
            field("COMMENT_URL", {
              label: "Online comment form URL",
              type: "url",
              span: 12,
              hint: "URL where comments can be submitted online.",
            }),
            field("COMMENT_EMAIL", {
              label: "Email for comments",
              type: "email",
              span: 12,
              hint: "Email address for submitting comments.",
            }),
            field("COMMENT_POSTAL", {
              label: "Postal address for comments",
              type: "textarea",
              rows: 3,
              span: 12,
              hint: "Full postal address where written comments can be sent.",
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
              required: !isEIA,
              span: 6,
              showIf: () => !isEIA,
            }),
            field("EIA_PUBLICISING_DATE", {
              label: "EIA publicising date",
              type: "date",
              required: isEIA,
              span: 6,
              showIf: () => isEIA,
              hint: "Date LPA directed publication.",
            }),
            // Removed PUBLICATION_DATE as per FIX-004
            field("DEADLINE_DATE", {
              label: "Comment deadline",
              type: "date",
              required: true,
              span: 6,
              hint: isEIA ? "30 days from publicising date." : "21 days from publication date.",
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
            field("ONLINE_REGISTER_URL", {
              label: "Online planning register URL",
              type: "url",
              span: 12,
              hint: "URL to view the application online.",
            }),
          ],
        },
      ];

      const offset = isEIA ? 30 : 21;

      return {
        sections,
        autoValues: [
          { token: "NOTICE_TYPE", value: definition.label },
          { token: "ACT_TITLE", value: "Town and Country Planning Act 1990" },
        ],
        aliasTokens: [{ source: "SITE_NAME", targets: ["PREMISES_NAME", "CENTRE_NAME"] }],
        deadlineRule: isEIA
          ? { base: "EIA_PUBLICISING_DATE" as const, offsetDays: offset }
          : { base: "PUBLICATION_DATE" as const, offsetDays: offset },
        atLeastOne: [
          {
            tokens: ["COMMENT_EMAIL", "COMMENT_URL", "COMMENT_POSTAL"],
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
            // Removed PUBLICATION_DATE as per FIX-004
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
    case "tro": {
      const isTemporary = definition.id.includes("temporary");
      const isExperimental = definition.id.includes("experimental");

      const sections: SectionBlueprint[] = [
        {
          id: "authority",
          title: "Highway authority",
          fields: [
            field("AUTHORITY_NAME", {
              label: "Authority name",
              required: true,
              span: 12,
              hint: "Full name of the local highway authority",
            }),
            field("AUTHORITY_EMAIL", {
              label: "Authority email (optional)",
              type: "email",
              span: 12,
            }),
          ],
        },
        {
          id: "order",
          title: "Traffic regulation order details",
          fields: [
            field("ORDER_TITLE", {
              label: "Order title",
              required: true,
              span: 12,
              hint: "Full title of the traffic regulation order",
            }),
            field("ORDER_DESCRIPTION", {
              label: "Effect of the order",
              type: "textarea",
              rows: 3,
              required: true,
              span: 12,
              hint: "Describe what the order will do (e.g., prohibit parking, restrict access)",
            }),
            field("NATURE_OF_ORDER", {
              label: "Nature of order",
              required: true,
              span: 12,
              hint: "Type of traffic regulation (e.g., parking restriction, road closure, one-way system)",
            }),
            field("ROADS_AFFECTED", {
              label: "Roads affected",
              type: "textarea",
              rows: 2,
              required: true,
              span: 12,
              hint: "List all roads, streets, or areas affected by this order",
            }),
            field("REASON_FOR_ORDER", {
              label: "Reason for order (optional)",
              type: "textarea",
              rows: 2,
              span: 12,
              hint: "Explain why the order is necessary (e.g., road safety, traffic management)",
            }),
          ],
        },
        {
          id: "dates",
          title: "Key dates",
          fields: [
            // Removed PUBLICATION_DATE as per FIX-004
            field("EFFECTIVE_DATE", {
              label: "Effective date",
              type: "date",
              required: true,
              span: 6,
              hint: "When the order comes into effect",
            }),
            field("EXPIRY_DATE", {
              label: "Expiry date",
              type: "date",
              required: isTemporary,
              span: 6,
              hint: "Required for temporary orders",
              showIf: () => isTemporary,
            }),
            field("EXPERIMENTAL_PERIOD", {
              label: "Experimental period",
              required: isExperimental,
              span: 6,
              hint: "Duration of experimental period (e.g., '18 months')",
              showIf: () => isExperimental,
            }),
            field("OBJECTION_DEADLINE", {
              label: "Objection deadline",
              type: "date",
              required: true,
              span: 6,
            }),
          ],
        },
        {
          id: "consultation",
          title: "Inspection and objections",
          fields: [
            field("INSPECTION_LOCATION", {
              label: "Inspection location",
              type: "textarea",
              rows: 2,
              required: true,
              span: 12,
              hint: "Where the order and supporting documents can be inspected",
            }),
            field("INSPECTION_HOURS", {
              label: "Inspection hours (optional)",
              span: 12,
              hint: "Opening hours for inspection (e.g., 'Monday to Friday, 9am to 5pm')",
            }),
            field("OBJECTION_METHOD", {
              label: "How to object",
              type: "textarea",
              rows: 2,
              required: true,
              span: 12,
              hint: "How objections should be submitted (e.g., 'in writing to the address below')",
            }),
            field("OBJECTION_ADDRESS", {
              label: "Objection address (optional)",
              type: "textarea",
              rows: 2,
              span: 12,
              hint: "Postal address for submitting objections",
            }),
          ],
        },
      ];

      return {
        sections,
        autoValues: [{ token: "NOTICE_TYPE", value: definition.label }],
        deadlineRule: { base: "PUBLICATION_DATE", offsetDays: 21 },
      };
    }
    default:
      return { sections: [], autoValues: [] };
  }
}
