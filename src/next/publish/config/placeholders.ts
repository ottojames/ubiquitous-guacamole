/**
 * Placeholder Registry
 *
 * Defines all available placeholder tokens for notice template customization.
 * Each placeholder represents a field that can be inserted into custom templates
 * and will be replaced with actual notice data during rendering.
 */

export interface PlaceholderDefinition {
  /** Unique token identifier (e.g., "APPLICANT_NAME") */
  token: string;

  /** Human-readable label for the placeholder */
  label: string;

  /** Description of what this placeholder represents */
  description: string;

  /** Example value to help users understand the output */
  example: string;

  /** Whether this placeholder is required for the notice type */
  required: boolean;

  /** Category for grouping in UI (e.g., "applicant", "premises", "consultation") */
  category: 'applicant' | 'premises' | 'licensing' | 'consultation' | 'location' | 'gambling' | 'transport' | 'planning' | 'probate' | 'tro' | 'other';
}

export interface NoticePlaceholderSet {
  /** Notice type identifier */
  noticeType: string;

  /** Display name of the notice type */
  displayName: string;

  /** All available placeholders for this notice type */
  placeholders: PlaceholderDefinition[];
}

/**
 * Common Placeholders (shared across multiple notice types)
 */
const COMMON_APPLICANT_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    token: 'APPLICANT_NAME',
    label: 'Applicant Name',
    description: 'Full name of the applicant or company',
    example: 'John Smith or ABC Hospitality Ltd',
    required: true,
    category: 'applicant',
  },
  {
    token: 'APPLICANT_STATUS',
    label: 'Applicant Status',
    description: 'Legal status of the applicant',
    example: 'Limited company, Individual, Partnership',
    required: false,
    category: 'applicant',
  },
  {
    token: 'APPLICANT_TRADING_AS',
    label: 'Trading Name',
    description: 'Trading name if different from legal name',
    example: 'The Red Lion Pub',
    required: false,
    category: 'applicant',
  },
  {
    token: 'APPLICANT_ADDRESS',
    label: 'Applicant Address',
    description: 'Full postal address of the applicant',
    example: '123 High Street, Bristol, BS1 2AB',
    required: true,
    category: 'applicant',
  },
  {
    token: 'APPLICANT_COMPANY_NUMBER',
    label: 'Company Number',
    description: 'Companies House registration number (if applicable)',
    example: '12345678',
    required: false,
    category: 'applicant',
  },
];

const COMMON_PREMISES_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    token: 'PREMISES_NAME',
    label: 'Premises Name',
    description: 'Trading name of the premises',
    example: 'The Red Lion',
    required: true,
    category: 'premises',
  },
  {
    token: 'PREMISES_ADDRESS',
    label: 'Premises Address',
    description: 'Full postal address of the premises',
    example: '45 Market Street, Bristol, BS1 1HQ',
    required: true,
    category: 'premises',
  },
];

const COMMON_AUTHORITY_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    token: 'AUTHORITY_NAME',
    label: 'Authority Name',
    description: 'Name of the licensing/regulatory authority',
    example: 'Bristol City Council',
    required: true,
    category: 'consultation',
  },
  {
    token: 'AUTHORITY_ADDRESS',
    label: 'Authority Address',
    description: 'Full postal address of the authority',
    example: 'Licensing Office, 100 Temple Street, Bristol, BS1 6AG',
    required: false,
    category: 'consultation',
  },
  {
    token: 'AUTHORITY_EMAIL',
    label: 'Authority Email',
    description: 'Email address for the authority',
    example: 'licensing@bristol.gov.uk',
    required: false,
    category: 'consultation',
  },
  {
    token: 'AUTHORITY_PHONE',
    label: 'Authority Phone',
    description: 'Contact telephone number for the authority',
    example: '0117 922 2500',
    required: false,
    category: 'consultation',
  },
];

const COMMON_DEADLINE_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    token: 'APPLICATION_DATE',
    label: 'Application Date',
    description: 'Date the application was submitted',
    example: '1 November 2025',
    required: true,
    category: 'other',
  },
  {
    token: 'PUBLICATION_DATE',
    label: 'Publication Date',
    description: 'Date when the notice is published',
    example: '17 November 2025',
    required: false,
    category: 'other',
  },
  {
    token: 'DEADLINE_DATE',
    label: 'Representation Deadline',
    description: 'Last date for submitting representations',
    example: '15 December 2025',
    required: true,
    category: 'consultation',
  },
];

/**
 * Licensing Premises (New Application) Placeholders
 */
export const LICENSING_PREMISES_NEW_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...COMMON_APPLICANT_PLACEHOLDERS,
  ...COMMON_PREMISES_PLACEHOLDERS,
  {
    token: 'LICENSABLE_ACTIVITIES',
    label: 'Licensable Activities',
    description: 'List of activities applied for (e.g., sale of alcohol, live music)',
    example: 'Sale of alcohol for consumption on and off premises, Live music, Late night refreshment',
    required: true,
    category: 'licensing',
  },
  {
    token: 'ACTIVITY_SCHEDULE',
    label: 'Activity Schedule',
    description: 'Detailed schedule of operating hours for each activity',
    example: 'Monday-Sunday: 10:00-23:00 (Alcohol), Friday-Saturday: 20:00-01:00 (Live Music)',
    required: true,
    category: 'licensing',
  },
  {
    token: 'OPENING_HOURS',
    label: 'Opening Hours',
    description: 'Overall operating hours of the premises',
    example: 'Monday-Sunday: 09:00-23:30',
    required: false,
    category: 'licensing',
  },
  {
    token: 'DPS_NAME',
    label: 'DPS Name',
    description: 'Name of the Designated Premises Supervisor',
    example: 'Sarah Johnson',
    required: true,
    category: 'licensing',
  },
  {
    token: 'DPS_LICENSING_AUTHORITY',
    label: 'DPS Licensing Authority',
    description: 'Authority that issued the DPS personal licence',
    example: 'Bath and North East Somerset Council',
    required: false,
    category: 'licensing',
  },
  ...COMMON_DEADLINE_PLACEHOLDERS,
  ...COMMON_AUTHORITY_PLACEHOLDERS,
  {
    token: 'ONLINE_REGISTER_URL',
    label: 'Online Register URL',
    description: 'Web address where the licence register can be viewed',
    example: 'https://bristol.gov.uk/licensing/register',
    required: false,
    category: 'consultation',
  },
  {
    token: 'INSPECTION_LOCATION',
    label: 'Inspection Location',
    description: 'Where the application can be inspected',
    example: 'Bristol City Council, Licensing Office, 100 Temple Street, Bristol, BS1 6AG',
    required: false,
    category: 'location',
  },
  {
    token: 'REPRESENTATION_ADDRESS',
    label: 'Representation Address',
    description: 'Address to send representations to',
    example: 'Licensing Team, Bristol City Council, PO Box 3399, Bristol, BS1 9NE',
    required: false,
    category: 'consultation',
  },
  {
    token: 'REPRESENTATION_EMAIL',
    label: 'Representation Email',
    description: 'Email address for representations',
    example: 'licensing@bristol.gov.uk',
    required: false,
    category: 'consultation',
  },
];

/**
 * Licensing Premises (Variation) Placeholders
 */
export const LICENSING_PREMISES_VARIATION_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...LICENSING_PREMISES_NEW_PLACEHOLDERS,
  {
    token: 'NATURE_OF_VARIATION',
    label: 'Nature of Variation',
    description: 'Description of the proposed changes to the existing licence',
    example: 'Extension of hours for sale of alcohol on Fridays and Saturdays until 01:00',
    required: true,
    category: 'licensing',
  },
];

/**
 * Licensing Premises (Review) Placeholders
 */
export const LICENSING_PREMISES_REVIEW_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    token: 'REVIEW_APPLICANT_NAME',
    label: 'Review Applicant Name',
    description: 'Name of the person/body applying for the review',
    example: 'Avon and Somerset Police or Local Resident',
    required: true,
    category: 'applicant',
  },
  ...COMMON_PREMISES_PLACEHOLDERS,
  {
    token: 'REVIEW_GROUNDS',
    label: 'Grounds for Review',
    description: 'Reasons for requesting the review',
    example: 'Prevention of crime and disorder, Public safety',
    required: true,
    category: 'licensing',
  },
  {
    token: 'LICENSING_OBJECTIVES',
    label: 'Licensing Objectives',
    description: 'Specific licensing objectives undermined',
    example: 'Prevention of crime and disorder',
    required: false,
    category: 'licensing',
  },
  ...COMMON_DEADLINE_PLACEHOLDERS,
  ...COMMON_AUTHORITY_PLACEHOLDERS,
  {
    token: 'REPRESENTATION_ADDRESS',
    label: 'Representation Address',
    description: 'Address to send representations to',
    example: 'Licensing Team, Bristol City Council, PO Box 3399, Bristol, BS1 9NE',
    required: false,
    category: 'consultation',
  },
  {
    token: 'REPRESENTATION_EMAIL',
    label: 'Representation Email',
    description: 'Email address for representations',
    example: 'licensing@bristol.gov.uk',
    required: false,
    category: 'consultation',
  },
];

/**
 * Licensing Club (New) Placeholders
 */
export const LICENSING_CLUB_NEW_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...COMMON_APPLICANT_PLACEHOLDERS,
  {
    token: 'PREMISES_NAME',
    label: 'Club Name',
    description: 'Full registered name of the club',
    example: 'Bristol Workingmen\'s Club',
    required: true,
    category: 'premises',
  },
  {
    token: 'PREMISES_ADDRESS',
    label: 'Club Premises Address',
    description: 'Full postal address of the club premises',
    example: '45 Market Street, Bristol, BS1 1HQ',
    required: true,
    category: 'premises',
  },
  {
    token: 'CLUB_QUALIFYING_CONDITIONS',
    label: 'Club Qualifying Conditions',
    description: 'Confirmation that the club meets qualifying conditions under s.62 of the Licensing Act 2003',
    example: 'The club is established and conducted in good faith, has at least 25 members, and is not a profit-making organisation',
    required: true,
    category: 'licensing',
  },
  {
    token: 'LICENSABLE_ACTIVITIES',
    label: 'Licensable Activities',
    description: 'List of qualifying club activities',
    example: 'Supply of alcohol to members and guests, Live music, Recorded music',
    required: true,
    category: 'licensing',
  },
  {
    token: 'ACTIVITY_SCHEDULE',
    label: 'Activity Schedule',
    description: 'Detailed schedule of operating hours for each activity',
    example: 'Monday-Sunday: 11:00-23:00 (Supply of alcohol), Friday-Saturday: 19:00-23:00 (Live music)',
    required: true,
    category: 'licensing',
  },
  {
    token: 'OPENING_HOURS',
    label: 'Opening Hours',
    description: 'Overall operating hours of the club',
    example: 'Monday-Sunday: 10:00-23:30',
    required: false,
    category: 'licensing',
  },
  ...COMMON_DEADLINE_PLACEHOLDERS,
  ...COMMON_AUTHORITY_PLACEHOLDERS,
  {
    token: 'REPRESENTATION_ADDRESS',
    label: 'Representation Address',
    description: 'Address to send representations to',
    example: 'Licensing Team, Bristol City Council, PO Box 3399, Bristol, BS1 9NE',
    required: false,
    category: 'consultation',
  },
  {
    token: 'REPRESENTATION_EMAIL',
    label: 'Representation Email',
    description: 'Email address for representations',
    example: 'licensing@bristol.gov.uk',
    required: false,
    category: 'consultation',
  },
];

/**
 * Licensing Club (Variation) Placeholders
 */
export const LICENSING_CLUB_VARIATION_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...LICENSING_CLUB_NEW_PLACEHOLDERS.filter(p => p.token !== 'CLUB_QUALIFYING_CONDITIONS'),
  {
    token: 'NATURE_OF_VARIATION',
    label: 'Nature of Variation',
    description: 'Description of the proposed changes to the existing club premises certificate',
    example: 'Extension of hours for supply of alcohol on Fridays and Saturdays until 01:00',
    required: true,
    category: 'licensing',
  },
];

/**
 * Licensing Club (Review) Placeholders
 */
export const LICENSING_CLUB_REVIEW_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    token: 'REVIEW_APPLICANT_NAME',
    label: 'Review Applicant Name',
    description: 'Name of the person/body applying for the review',
    example: 'Avon and Somerset Police',
    required: true,
    category: 'applicant',
  },
  {
    token: 'PREMISES_NAME',
    label: 'Club Name',
    description: 'Full registered name of the club under review',
    example: 'Bristol Workingmen\'s Club',
    required: true,
    category: 'premises',
  },
  {
    token: 'PREMISES_ADDRESS',
    label: 'Club Premises Address',
    description: 'Full postal address of the club premises',
    example: '45 Market Street, Bristol, BS1 1HQ',
    required: true,
    category: 'premises',
  },
  {
    token: 'REVIEW_GROUNDS',
    label: 'Grounds for Review',
    description: 'Reasons for requesting the review',
    example: 'Prevention of crime and disorder, Public safety',
    required: true,
    category: 'licensing',
  },
  {
    token: 'LICENSING_OBJECTIVES',
    label: 'Licensing Objectives',
    description: 'Specific licensing objectives undermined',
    example: 'Prevention of crime and disorder',
    required: false,
    category: 'licensing',
  },
  ...COMMON_DEADLINE_PLACEHOLDERS,
  ...COMMON_AUTHORITY_PLACEHOLDERS,
  {
    token: 'REPRESENTATION_ADDRESS',
    label: 'Representation Address',
    description: 'Address to send representations to',
    example: 'Licensing Team, Bristol City Council, PO Box 3399, Bristol, BS1 9NE',
    required: false,
    category: 'consultation',
  },
  {
    token: 'REPRESENTATION_EMAIL',
    label: 'Representation Email',
    description: 'Email address for representations',
    example: 'licensing@bristol.gov.uk',
    required: false,
    category: 'consultation',
  },
];

/**
 * Common Gambling Placeholders (shared across all gambling notice types)
 */
const COMMON_GAMBLING_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...COMMON_APPLICANT_PLACEHOLDERS,
  ...COMMON_PREMISES_PLACEHOLDERS,
  {
    token: 'GAMBLING_PREMISES_TYPE',
    label: 'Premises Type',
    description: 'Type of gambling premises as defined in Gambling Act 2005',
    example: 'Betting premises, Bingo premises, Adult Gaming Centre, Family Entertainment Centre',
    required: true,
    category: 'gambling',
  },
  {
    token: 'LICENSABLE_ACTIVITIES',
    label: 'Gambling Activities',
    description: 'Description of the gambling activities permitted',
    example: 'Adult gaming machines (category B, C, and D), Bingo',
    required: true,
    category: 'gambling',
  },
  {
    token: 'OPENING_HOURS',
    label: 'Operating Hours',
    description: 'Proposed operating hours for gambling activities',
    example: 'Monday-Sunday: 10:00-22:00',
    required: true,
    category: 'gambling',
  },
  ...COMMON_DEADLINE_PLACEHOLDERS,
  ...COMMON_AUTHORITY_PLACEHOLDERS,
  {
    token: 'REPRESENTATION_ADDRESS',
    label: 'Representation Address',
    description: 'Postal address for submitting representations',
    example: 'Licensing Team, Bristol City Council, PO Box 3399, Bristol, BS1 9NE',
    required: false,
    category: 'consultation',
  },
  {
    token: 'REPRESENTATION_EMAIL',
    label: 'Representation Email',
    description: 'Email address for submitting representations',
    example: 'gambling.licensing@bristol.gov.uk',
    required: false,
    category: 'consultation',
  },
];

/**
 * Gambling (New) Placeholders - applies to all gambling types (betting, bingo, AGC, FEC)
 */
export const GAMBLING_NEW_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...COMMON_GAMBLING_PLACEHOLDERS,
];

/**
 * Gambling (Variation) Placeholders
 */
export const GAMBLING_VARIATION_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...COMMON_GAMBLING_PLACEHOLDERS,
  {
    token: 'NATURE_OF_VARIATION',
    label: 'Nature of Variation',
    description: 'Description of the variation requested',
    example: 'Addition of 2 category B gaming machines, extension of operating hours on Saturdays',
    required: true,
    category: 'gambling',
  },
];

/**
 * Gambling (Review) Placeholders
 */
export const GAMBLING_REVIEW_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    token: 'REVIEW_APPLICANT_NAME',
    label: 'Review Applicant Name',
    description: 'Name of the person/body applying for the review',
    example: 'Avon and Somerset Police',
    required: true,
    category: 'applicant',
  },
  ...COMMON_PREMISES_PLACEHOLDERS,
  {
    token: 'GAMBLING_PREMISES_TYPE',
    label: 'Premises Type',
    description: 'Type of gambling premises under review',
    example: 'Adult Gaming Centre',
    required: true,
    category: 'gambling',
  },
  {
    token: 'REVIEW_GROUNDS',
    label: 'Grounds for Review',
    description: 'Reasons for requesting the review',
    example: 'Licensing objectives not being met, concerns about protection of children',
    required: true,
    category: 'gambling',
  },
  ...COMMON_DEADLINE_PLACEHOLDERS,
  ...COMMON_AUTHORITY_PLACEHOLDERS,
  {
    token: 'REPRESENTATION_ADDRESS',
    label: 'Representation Address',
    description: 'Postal address for submitting representations',
    example: 'Licensing Team, Bristol City Council, PO Box 3399, Bristol, BS1 9NE',
    required: false,
    category: 'consultation',
  },
  {
    token: 'REPRESENTATION_EMAIL',
    label: 'Representation Email',
    description: 'Email address for submitting representations',
    example: 'gambling.licensing@bristol.gov.uk',
    required: false,
    category: 'consultation',
  },
];

/**
 * Gambling (Transfer) Placeholders
 */
export const GAMBLING_TRANSFER_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    token: 'APPLICANT_NAME',
    label: 'Applicant Name',
    description: 'Name of the person/company applying for the transfer',
    example: 'John Smith or ABC Gaming Ltd',
    required: true,
    category: 'applicant',
  },
  ...COMMON_PREMISES_PLACEHOLDERS,
  {
    token: 'GAMBLING_PREMISES_TYPE',
    label: 'Premises Type',
    description: 'Type of gambling premises being transferred',
    example: 'Betting premises',
    required: true,
    category: 'gambling',
  },
  {
    token: 'TRANSFER_FROM_NAME',
    label: 'Current Licence Holder',
    description: 'Name of the current premises licence holder',
    example: 'XYZ Gaming Ltd',
    required: true,
    category: 'gambling',
  },
  {
    token: 'TRANSFER_TO_NAME',
    label: 'Proposed Licence Holder',
    description: 'Name of the proposed new licence holder',
    example: 'ABC Gaming Ltd',
    required: true,
    category: 'gambling',
  },
  {
    token: 'APPLICATION_DATE',
    label: 'Transfer Date',
    description: 'Date the transfer takes effect',
    example: '1 December 2025',
    required: true,
    category: 'other',
  },
  {
    token: 'PUBLICATION_DATE',
    label: 'Publication Date',
    description: 'Date when the notice is published',
    example: '17 November 2025',
    required: true,
    category: 'other',
  },
  {
    token: 'DEADLINE_DATE',
    label: 'Representation Deadline',
    description: 'Last date for submitting representations',
    example: '15 December 2025',
    required: true,
    category: 'consultation',
  },
  ...COMMON_AUTHORITY_PLACEHOLDERS,
];

/**
 * GVOL (New) Placeholders
 */
export const GVOL_NEW_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...COMMON_APPLICANT_PLACEHOLDERS,
  {
    token: 'LICENCE_CATEGORY',
    label: 'Licence Category',
    description: 'Type of goods vehicle operator licence',
    example: 'Standard National, Standard International, Restricted',
    required: true,
    category: 'transport',
  },
  {
    token: 'TRAFFIC_AREA_NAME',
    label: 'Traffic Area',
    description: 'Traffic Commissioner area covering the operating centre',
    example: 'West of England',
    required: true,
    category: 'transport',
  },
  {
    token: 'OPERATING_CENTRE_ADDRESS',
    label: 'Operating Centre Address',
    description: 'Full postal address of the operating centre',
    example: 'Unit 5, Industrial Estate, Bristol, BS3 2AB',
    required: true,
    category: 'transport',
  },
  {
    token: 'NUMBER_OF_VEHICLES',
    label: 'Number of Vehicles',
    description: 'Total number of vehicles to be authorised',
    example: '10',
    required: true,
    category: 'transport',
  },
  {
    token: 'NUMBER_OF_TRAILERS',
    label: 'Number of Trailers',
    description: 'Total number of trailers to be authorised',
    example: '5',
    required: true,
    category: 'transport',
  },
  {
    token: 'PUBLICATION_DATE',
    label: 'Publication Date',
    description: 'Date when the notice is published',
    example: '17 November 2025',
    required: true,
    category: 'other',
  },
  {
    token: 'DEADLINE_DATE',
    label: 'Objection Deadline',
    description: 'Last date for submitting objections (21 days from publication)',
    example: '8 December 2025',
    required: true,
    category: 'consultation',
  },
  {
    token: 'AUTHORITY_NAME',
    label: 'Traffic Commissioner',
    description: 'Name of the Traffic Commissioner or Area Office',
    example: 'The Traffic Commissioner, West of England and Wales',
    required: true,
    category: 'consultation',
  },
  {
    token: 'AUTHORITY_ADDRESS',
    label: 'Address for Representations',
    description: 'Address to send objections to',
    example: 'Hillcrest House, 386 Harehills Lane, Leeds, LS9 6NF',
    required: true,
    category: 'consultation',
  },
];

/**
 * GVOL (Variation) Placeholders
 */
export const GVOL_VARIATION_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...GVOL_NEW_PLACEHOLDERS,
  {
    token: 'GVOL_VARIATION_DETAILS',
    label: 'Variation Details',
    description: 'Summary of the material changes to the licence',
    example: 'Increase in vehicle authorisation from 10 to 15 vehicles, addition of new operating centre',
    required: true,
    category: 'transport',
  },
];

/**
 * Planning (Common) Placeholders
 */
const COMMON_PLANNING_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    token: 'APPLICANT_NAME',
    label: 'Applicant Name',
    description: 'Name of the planning applicant',
    example: 'John Smith or ABC Development Ltd',
    required: true,
    category: 'applicant',
  },
  {
    token: 'SITE_NAME',
    label: 'Site Name',
    description: 'Name of the development site (if applicable)',
    example: 'Former Brewery Site',
    required: false,
    category: 'premises',
  },
  {
    token: 'SITE_ADDRESS',
    label: 'Site Address',
    description: 'Full postal address of the development site',
    example: 'Land at Temple Quay, Bristol, BS1 6EB',
    required: true,
    category: 'premises',
  },
  {
    token: 'APPLICATION_REFERENCE',
    label: 'Application Reference',
    description: 'Planning application reference number',
    example: '25/00123/F',
    required: true,
    category: 'planning',
  },
  {
    token: 'PROPOSAL_DESCRIPTION',
    label: 'Proposal Description',
    description: 'Concise description of the proposed development',
    example: 'Erection of 50 residential dwellings with associated parking and landscaping',
    required: true,
    category: 'planning',
  },
  {
    token: 'APPLICATION_DATE',
    label: 'Application Date',
    description: 'Date the planning application was submitted',
    example: '1 November 2025',
    required: true,
    category: 'other',
  },
  {
    token: 'PUBLICATION_DATE',
    label: 'Publication Date',
    description: 'Date when the notice is published',
    example: '17 November 2025',
    required: true,
    category: 'other',
  },
  {
    token: 'DEADLINE_DATE',
    label: 'Comment Deadline',
    description: 'Last date for submitting comments (typically 21 days from publication)',
    example: '8 December 2025',
    required: true,
    category: 'consultation',
  },
  {
    token: 'COMMENT_URL',
    label: 'Online Comment Form URL',
    description: 'Web address where comments can be submitted online',
    example: 'https://bristol.gov.uk/planning/comment/25-00123-F',
    required: false,
    category: 'consultation',
  },
  {
    token: 'COMMENT_EMAIL',
    label: 'Email for Comments',
    description: 'Email address for submitting comments',
    example: 'planning@bristol.gov.uk',
    required: false,
    category: 'consultation',
  },
  {
    token: 'COMMENT_POSTAL',
    label: 'Postal Address for Comments',
    description: 'Full postal address where written comments can be sent',
    example: 'Planning Department, Bristol City Council, PO Box 3399, Bristol, BS1 9NE',
    required: false,
    category: 'consultation',
  },
  {
    token: 'AUTHORITY_NAME',
    label: 'Planning Authority',
    description: 'Name of the local planning authority',
    example: 'Bristol City Council',
    required: true,
    category: 'consultation',
  },
  {
    token: 'AUTHORITY_ADDRESS',
    label: 'Authority Address',
    description: 'Full postal address of the planning authority',
    example: 'Planning Department, 100 Temple Street, Bristol, BS1 6AG',
    required: false,
    category: 'consultation',
  },
  {
    token: 'AUTHORITY_EMAIL',
    label: 'Authority Email',
    description: 'Email address for the planning authority',
    example: 'planning@bristol.gov.uk',
    required: false,
    category: 'consultation',
  },
  {
    token: 'ONLINE_REGISTER_URL',
    label: 'Online Planning Register URL',
    description: 'Web address to view the application online',
    example: 'https://bristol.gov.uk/planning/online-applications',
    required: false,
    category: 'consultation',
  },
];

/**
 * Planning Major/Listed/Conservation/PRoW/Departure Placeholders
 */
export const PLANNING_STANDARD_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...COMMON_PLANNING_PLACEHOLDERS,
  {
    token: 'PLANNING_REASON',
    label: 'Press Notice Reason',
    description: 'Explanation of why a press notice is required',
    example: 'Major Development, Listed Building Consent, Conservation Area Consent',
    required: false,
    category: 'planning',
  },
];

/**
 * Planning EIA Placeholders
 */
export const PLANNING_EIA_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...COMMON_PLANNING_PLACEHOLDERS.filter(p => p.token !== 'APPLICATION_DATE'),
  {
    token: 'PLANNING_REASON',
    label: 'EIA Classification Reason',
    description: 'Explanation of why this is classified as EIA development',
    example: 'Schedule 1 development under the EIA Regulations 2017',
    required: true,
    category: 'planning',
  },
  {
    token: 'EIA_PUBLICISING_DATE',
    label: 'EIA Publicising Date',
    description: 'Date the LPA directed publication under EIA Regulations 2017',
    example: '15 October 2025',
    required: true,
    category: 'other',
  },
];

/**
 * Probate (Trustee Act s.27) Placeholders
 */
export const PROBATE_TRUSTEE_S27_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    token: 'DECEASED_NAME',
    label: 'Deceased Name',
    description: 'Full name of the deceased person',
    example: 'John William Smith',
    required: true,
    category: 'probate',
  },
  {
    token: 'DECEASED_ALIAS',
    label: 'Also Known As',
    description: 'Any other names the deceased was known by',
    example: 'Jack Smith',
    required: false,
    category: 'probate',
  },
  {
    token: 'DECEASED_LAST_ADDRESS',
    label: 'Last Known Address',
    description: 'Last known address of the deceased',
    example: '123 High Street, Bristol, BS1 2AB',
    required: true,
    category: 'probate',
  },
  {
    token: 'DATE_OF_DEATH',
    label: 'Date of Death',
    description: 'Date the deceased passed away',
    example: '15 September 2025',
    required: true,
    category: 'probate',
  },
  {
    token: 'PERSONAL_REPRESENTATIVE',
    label: 'Personal Representative',
    description: 'Name of the personal representative(s) of the estate',
    example: 'Jane Smith',
    required: false,
    category: 'probate',
  },
  {
    token: 'SOLICITOR_NAME',
    label: 'Solicitor Name',
    description: 'Name of the solicitor acting for the estate',
    example: 'Smith & Jones Solicitors',
    required: false,
    category: 'probate',
  },
  {
    token: 'SOLICITOR_ADDRESS',
    label: 'Service Address',
    description: 'Address for service of claims',
    example: 'Smith & Jones Solicitors, 45 Park Street, Bristol, BS1 5JG',
    required: true,
    category: 'probate',
  },
  {
    token: 'CLAIM_REFERENCE',
    label: 'Reference',
    description: 'Reference number for the matter',
    example: 'SJ/2025/12345',
    required: false,
    category: 'other',
  },
  {
    token: 'PUBLICATION_DATE',
    label: 'Publication Date',
    description: 'Date when the notice is published',
    example: '17 November 2025',
    required: true,
    category: 'other',
  },
  {
    token: 'DEADLINE_DATE',
    label: 'Claims Deadline',
    description: 'Last date for submitting claims (2 months from publication)',
    example: '17 January 2026',
    required: true,
    category: 'consultation',
  },
];

/**
 * TRO (Permanent) Placeholders
 */
export const TRO_PERMANENT_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    token: 'AUTHORITY_NAME',
    label: 'Highway Authority',
    description: 'Name of the local highway authority',
    example: 'Bristol City Council',
    required: true,
    category: 'tro',
  },
  {
    token: 'AUTHORITY_EMAIL',
    label: 'Authority Email',
    description: 'Email address for the highway authority',
    example: 'traffic.orders@bristol.gov.uk',
    required: false,
    category: 'tro',
  },
  {
    token: 'ORDER_TITLE',
    label: 'Order Title',
    description: 'Full title of the traffic regulation order',
    example: 'The Bristol City Council (Park Street) (Prohibition of Waiting) Order 2025',
    required: true,
    category: 'tro',
  },
  {
    token: 'ORDER_DESCRIPTION',
    label: 'Effect of the Order',
    description: 'Description of what the order will do',
    example: 'Prohibit waiting at any time on both sides of Park Street',
    required: true,
    category: 'tro',
  },
  {
    token: 'NATURE_OF_ORDER',
    label: 'Nature of Order',
    description: 'Type of traffic regulation',
    example: 'Prohibition of waiting, Parking restriction, One-way system',
    required: true,
    category: 'tro',
  },
  {
    token: 'ROADS_AFFECTED',
    label: 'Roads Affected',
    description: 'List of all roads, streets, or areas affected',
    example: 'Park Street, College Green, Queens Road',
    required: true,
    category: 'tro',
  },
  {
    token: 'REASON_FOR_ORDER',
    label: 'Reason for Order',
    description: 'Explanation of why the order is necessary',
    example: 'To improve road safety and traffic flow',
    required: false,
    category: 'tro',
  },
  {
    token: 'PUBLICATION_DATE',
    label: 'Publication Date',
    description: 'Date when the notice is published',
    example: '17 November 2025',
    required: true,
    category: 'other',
  },
  {
    token: 'EFFECTIVE_DATE',
    label: 'Effective Date',
    description: 'Date when the order comes into effect',
    example: '1 December 2025',
    required: true,
    category: 'tro',
  },
  {
    token: 'OBJECTION_DEADLINE',
    label: 'Objection Deadline',
    description: 'Last date for submitting objections',
    example: '8 December 2025',
    required: true,
    category: 'consultation',
  },
  {
    token: 'INSPECTION_LOCATION',
    label: 'Inspection Location',
    description: 'Where the order and supporting documents can be inspected',
    example: 'Bristol City Council, Highway Services, 100 Temple Street, Bristol, BS1 6AG',
    required: true,
    category: 'location',
  },
  {
    token: 'INSPECTION_HOURS',
    label: 'Inspection Hours',
    description: 'Opening hours for inspection',
    example: 'Monday to Friday, 9:00 AM to 5:00 PM',
    required: false,
    category: 'location',
  },
  {
    token: 'OBJECTION_METHOD',
    label: 'How to Object',
    description: 'How objections should be submitted',
    example: 'In writing to the address below, or by email to traffic.orders@bristol.gov.uk',
    required: true,
    category: 'consultation',
  },
  {
    token: 'OBJECTION_ADDRESS',
    label: 'Objection Address',
    description: 'Postal address for submitting objections',
    example: 'Highway Services, Bristol City Council, PO Box 3399, Bristol, BS1 9NE',
    required: false,
    category: 'consultation',
  },
];

/**
 * TRO (Temporary) Placeholders
 */
export const TRO_TEMPORARY_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...TRO_PERMANENT_PLACEHOLDERS,
  {
    token: 'EXPIRY_DATE',
    label: 'Expiry Date',
    description: 'Date when the temporary order expires',
    example: '31 May 2026',
    required: true,
    category: 'tro',
  },
];

/**
 * TRO (Experimental) Placeholders
 */
export const TRO_EXPERIMENTAL_PLACEHOLDERS: PlaceholderDefinition[] = [
  ...TRO_PERMANENT_PLACEHOLDERS,
  {
    token: 'EXPERIMENTAL_PERIOD',
    label: 'Experimental Period',
    description: 'Duration of the experimental period',
    example: '18 months',
    required: true,
    category: 'tro',
  },
];

/**
 * Placeholder Registry
 * Maps notice type IDs to their available placeholders
 */
export const PLACEHOLDER_REGISTRY: Record<string, NoticePlaceholderSet> = {
  // Licensing - Premises
  'licensing-premises-new': {
    noticeType: 'licensing-premises-new',
    displayName: 'Premises Licence — New',
    placeholders: LICENSING_PREMISES_NEW_PLACEHOLDERS,
  },
  'licensing-premises-variation': {
    noticeType: 'licensing-premises-variation',
    displayName: 'Premises Licence — Variation',
    placeholders: LICENSING_PREMISES_VARIATION_PLACEHOLDERS,
  },
  'licensing-premises-review': {
    noticeType: 'licensing-premises-review',
    displayName: 'Premises Licence — Review',
    placeholders: LICENSING_PREMISES_REVIEW_PLACEHOLDERS,
  },

  // Licensing - Club
  'licensing-club-new': {
    noticeType: 'licensing-club-new',
    displayName: 'Club Premises Certificate — New',
    placeholders: LICENSING_CLUB_NEW_PLACEHOLDERS,
  },
  'licensing-club-variation': {
    noticeType: 'licensing-club-variation',
    displayName: 'Club Premises Certificate — Variation',
    placeholders: LICENSING_CLUB_VARIATION_PLACEHOLDERS,
  },
  'licensing-club-review': {
    noticeType: 'licensing-club-review',
    displayName: 'Club Premises Certificate — Review',
    placeholders: LICENSING_CLUB_REVIEW_PLACEHOLDERS,
  },

  // Gambling - Betting
  'gambling-betting-new': {
    noticeType: 'gambling-betting-new',
    displayName: 'Betting — New',
    placeholders: GAMBLING_NEW_PLACEHOLDERS,
  },
  'gambling-betting-variation': {
    noticeType: 'gambling-betting-variation',
    displayName: 'Betting — Variation',
    placeholders: GAMBLING_VARIATION_PLACEHOLDERS,
  },
  'gambling-betting-review': {
    noticeType: 'gambling-betting-review',
    displayName: 'Betting — Review',
    placeholders: GAMBLING_REVIEW_PLACEHOLDERS,
  },
  'gambling-betting-transfer': {
    noticeType: 'gambling-betting-transfer',
    displayName: 'Betting — Transfer',
    placeholders: GAMBLING_TRANSFER_PLACEHOLDERS,
  },

  // Gambling - Bingo
  'gambling-bingo-new': {
    noticeType: 'gambling-bingo-new',
    displayName: 'Bingo — New',
    placeholders: GAMBLING_NEW_PLACEHOLDERS,
  },
  'gambling-bingo-variation': {
    noticeType: 'gambling-bingo-variation',
    displayName: 'Bingo — Variation',
    placeholders: GAMBLING_VARIATION_PLACEHOLDERS,
  },
  'gambling-bingo-review': {
    noticeType: 'gambling-bingo-review',
    displayName: 'Bingo — Review',
    placeholders: GAMBLING_REVIEW_PLACEHOLDERS,
  },
  'gambling-bingo-transfer': {
    noticeType: 'gambling-bingo-transfer',
    displayName: 'Bingo — Transfer',
    placeholders: GAMBLING_TRANSFER_PLACEHOLDERS,
  },

  // Gambling - Adult Gaming Centre (AGC)
  'gambling-agc-new': {
    noticeType: 'gambling-agc-new',
    displayName: 'Adult Gaming Centre — New',
    placeholders: GAMBLING_NEW_PLACEHOLDERS,
  },
  'gambling-agc-variation': {
    noticeType: 'gambling-agc-variation',
    displayName: 'Adult Gaming Centre — Variation',
    placeholders: GAMBLING_VARIATION_PLACEHOLDERS,
  },
  'gambling-agc-review': {
    noticeType: 'gambling-agc-review',
    displayName: 'Adult Gaming Centre — Review',
    placeholders: GAMBLING_REVIEW_PLACEHOLDERS,
  },
  'gambling-agc-transfer': {
    noticeType: 'gambling-agc-transfer',
    displayName: 'Adult Gaming Centre — Transfer',
    placeholders: GAMBLING_TRANSFER_PLACEHOLDERS,
  },

  // Gambling - Family Entertainment Centre (FEC)
  'gambling-fec-new': {
    noticeType: 'gambling-fec-new',
    displayName: 'Family Entertainment Centre — New',
    placeholders: GAMBLING_NEW_PLACEHOLDERS,
  },
  'gambling-fec-variation': {
    noticeType: 'gambling-fec-variation',
    displayName: 'Family Entertainment Centre — Variation',
    placeholders: GAMBLING_VARIATION_PLACEHOLDERS,
  },
  'gambling-fec-review': {
    noticeType: 'gambling-fec-review',
    displayName: 'Family Entertainment Centre — Review',
    placeholders: GAMBLING_REVIEW_PLACEHOLDERS,
  },
  'gambling-fec-transfer': {
    noticeType: 'gambling-fec-transfer',
    displayName: 'Family Entertainment Centre — Transfer',
    placeholders: GAMBLING_TRANSFER_PLACEHOLDERS,
  },

  // GVOL
  'gvol-new': {
    noticeType: 'gvol-new',
    displayName: 'GVOL — New',
    placeholders: GVOL_NEW_PLACEHOLDERS,
  },
  'gvol-variation': {
    noticeType: 'gvol-variation',
    displayName: 'GVOL — Variation',
    placeholders: GVOL_VARIATION_PLACEHOLDERS,
  },

  // Planning
  'planning-major': {
    noticeType: 'planning-major',
    displayName: 'Major Development',
    placeholders: PLANNING_STANDARD_PLACEHOLDERS,
  },
  'planning-eia': {
    noticeType: 'planning-eia',
    displayName: 'EIA Development',
    placeholders: PLANNING_EIA_PLACEHOLDERS,
  },
  'planning-listed': {
    noticeType: 'planning-listed',
    displayName: 'Listed Building',
    placeholders: PLANNING_STANDARD_PLACEHOLDERS,
  },
  'planning-conservation': {
    noticeType: 'planning-conservation',
    displayName: 'Conservation Area',
    placeholders: PLANNING_STANDARD_PLACEHOLDERS,
  },
  'planning-prow': {
    noticeType: 'planning-prow',
    displayName: 'Public Right of Way',
    placeholders: PLANNING_STANDARD_PLACEHOLDERS,
  },
  'planning-departure': {
    noticeType: 'planning-departure',
    displayName: 'Departure',
    placeholders: PLANNING_STANDARD_PLACEHOLDERS,
  },

  // Probate
  'probate-trustee-s27': {
    noticeType: 'probate-trustee-s27',
    displayName: 'Trustee Act 1925 s.27',
    placeholders: PROBATE_TRUSTEE_S27_PLACEHOLDERS,
  },

  // TRO
  'tro-permanent': {
    noticeType: 'tro-permanent',
    displayName: 'TRO — Permanent',
    placeholders: TRO_PERMANENT_PLACEHOLDERS,
  },
  'tro-temporary': {
    noticeType: 'tro-temporary',
    displayName: 'TRO — Temporary',
    placeholders: TRO_TEMPORARY_PLACEHOLDERS,
  },
  'tro-experimental': {
    noticeType: 'tro-experimental',
    displayName: 'TRO — Experimental',
    placeholders: TRO_EXPERIMENTAL_PLACEHOLDERS,
  },
};

/**
 * Get all placeholders for a specific notice type
 */
export function getPlaceholdersForNoticeType(noticeType: string): PlaceholderDefinition[] {
  const placeholderSet = PLACEHOLDER_REGISTRY[noticeType];
  return placeholderSet?.placeholders || [];
}

/**
 * Get only required placeholders for a specific notice type
 */
export function getRequiredPlaceholders(noticeType: string): PlaceholderDefinition[] {
  const allPlaceholders = getPlaceholdersForNoticeType(noticeType);
  return allPlaceholders.filter(p => p.required);
}

/**
 * Get placeholders grouped by category for UI display
 */
export function getPlaceholdersByCategory(noticeType: string): Record<string, PlaceholderDefinition[]> {
  const placeholders = getPlaceholdersForNoticeType(noticeType);

  return placeholders.reduce((acc, placeholder) => {
    const category = placeholder.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(placeholder);
    return acc;
  }, {} as Record<string, PlaceholderDefinition[]>);
}

/**
 * Validate that a template text contains all required placeholders
 */
export function validateTemplatePlaceholders(
  templateText: string,
  noticeType: string
): { isValid: boolean; missingRequired: string[]; warnings: string[] } {
  const required = getRequiredPlaceholders(noticeType);
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // Check for missing required placeholders
  for (const placeholder of required) {
    const pattern = new RegExp(`\\{\\{${placeholder.token}\\}\\}`, 'g');
    if (!pattern.test(templateText)) {
      missingRequired.push(placeholder.token);
    }
  }

  // Check for statutory clause (licensing notices only)
  if (noticeType.startsWith('licensing-')) {
    if (!templateText.includes('Licensing Act 2003')) {
      warnings.push('Template should reference "Licensing Act 2003" for legal compliance');
    }
  }

  // Check for statutory clause (gambling notices only)
  if (noticeType.startsWith('gambling-')) {
    if (!templateText.includes('Gambling Act 2005')) {
      warnings.push('Template should reference "Gambling Act 2005" for legal compliance');
    }
  }

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    warnings,
  };
}

/**
 * Extract all placeholder tokens from template text
 */
export function extractPlaceholders(templateText: string): string[] {
  const matches = templateText.match(/\{\{([A-Z_]+)\}\}/g);
  if (!matches) return [];

  return matches.map(match => match.replace(/\{\{|\}\}/g, ''));
}

/**
 * Get placeholder definition by token
 */
export function getPlaceholderByToken(
  token: string,
  noticeType: string
): PlaceholderDefinition | undefined {
  const placeholders = getPlaceholdersForNoticeType(noticeType);
  return placeholders.find(p => p.token === token);
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: string): string {
  const categoryLabels: Record<string, string> = {
    applicant: 'Applicant Information',
    premises: 'Premises Details',
    licensing: 'Licensing Information',
    consultation: 'Consultation Details',
    location: 'Location Information',
    gambling: 'Gambling Information',
    transport: 'Transport Information',
    planning: 'Planning Information',
    probate: 'Probate Information',
    tro: 'Traffic Regulation Order',
    other: 'Other Information',
  };

  return categoryLabels[category] || category;
}
