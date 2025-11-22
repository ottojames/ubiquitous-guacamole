import { NOTICE_DEFINITIONS } from '@/next/publish/config/noticeTypes';
import { addDays, addMonths, toISODate } from '@/next/publish/utils/date';

const today = new Date();
const applicationDate = toISODate(today);
const publicationDate = toISODate(addDays(today, 5));
const deadline28 = toISODate(addDays(today, 28));
const deadline21FromPublication = toISODate(addDays(addDays(today, 5), 21));
const deadline30FromPublication = toISODate(addDays(addDays(today, 5), 30));
const probatePublication = toISODate(addDays(today, 2));
const probateDeadline = toISODate(addMonths(addDays(today, 2), 2));

function licensingSample(variant: string) {
  const base = {
    variant,
    NOTICE_TYPE: 'Premises Licence — New',
    ACT_TITLE: 'Licensing Act 2003',
    APPLICANT_NAME: 'Red Lion Hospitality Ltd',
    APPLICANT_STATUS: 'company',
    APPLICANT_TRADING_AS: 'The Red Lion',
    APPLICANT_ADDRESS: '123 High Street, Sampleton, SP1 1AA',
    APPLICANT_COMPANY_NUMBER: '12345678',
    PREMISES_NAME: 'The Red Lion',
    PREMISES_ADDRESS: '45 Market Street, Sampleton, SP2 3BB',
    LICENSABLE_ACTIVITIES: 'Sale of alcohol (on and off the premises), Live music, Late night refreshment',
    ACTIVITY_SCHEDULE: 'Alcohol: Mon–Sun 11:00–23:00, Live Music: Fri–Sat 20:00–23:30, Late Night Refreshment: Fri–Sat 23:00–00:30',
    OPENING_HOURS: 'Mon–Thu 10:00–23:30, Fri–Sat 10:00–00:30, Sun 11:00–22:30',
    DPS_NAME: 'Sarah Johnson',
    DPS_LICENSING_AUTHORITY: 'Sampleton Borough Council',
    NATURE_OF_VARIATION: 'Extend alcohol sales on Friday and Saturday until 01:00',
    REVIEW_APPLICANT_NAME: 'Sampleton Police Licensing Unit',
    REVIEW_GROUNDS: 'Prevention of crime and disorder, Prevention of public nuisance',
    LICENSING_OBJECTIVES: 'Prevention of crime and disorder; Prevention of public nuisance; Public safety',
    APPLICATION_DATE: applicationDate,
    PUBLICATION_DATE: publicationDate,
    DEADLINE_DATE: deadline28,
    INSPECTION_LOCATION: 'Sampleton Borough Council, Licensing Office, Civic Centre, High Street, Sampleton, SP1 1AA',
    INSPECTION_TIMES: 'Monday–Friday 9:00 AM – 5:00 PM',
    REPRESENTATION_METHOD: 'in writing or by email',
    REPRESENTATION_ADDRESS: 'Licensing Team, Sampleton Borough Council, Civic Centre, High Street, Sampleton, SP1 1AA',
    REPRESENTATION_EMAIL: 'licensing@sampleton.gov.uk',
    AUTHORITY_NAME: 'Sampleton Borough Council',
    AUTHORITY_ADDRESS: 'Civic Centre, High Street, Sampleton, SP1 1AA',
    AUTHORITY_EMAIL: 'licensing@sampleton.gov.uk',
    AUTHORITY_PHONE: '01234 567890',
    ONLINE_REGISTER_URL: 'https://sampleton.gov.uk/licensing/register',
    REFERENCE: 'SAMP/LIC/2025/0001',
  } as Record<string, string>;

  if (variant.includes('premises-variation')) {
    base.NOTICE_TYPE = 'Premises Licence — Variation';
  } else if (variant.includes('premises-review')) {
    base.NOTICE_TYPE = 'Premises Licence — Review';
  } else if (variant.includes('club-new')) {
    base.NOTICE_TYPE = 'Club Premises Certificate — New';
  } else if (variant.includes('club-variation')) {
    base.NOTICE_TYPE = 'Club Premises Certificate — Variation';
  } else if (variant.includes('club-review')) {
    base.NOTICE_TYPE = 'Club Premises Certificate — Review';
  }

  if (!variant.includes('premises')) {
    base.DPS_NAME = '';
    base.DPS_LICENSING_AUTHORITY = '';
  }

  if (!variant.includes('variation')) {
    base.NATURE_OF_VARIATION = '';
  }

  if (!variant.includes('review')) {
    base.REVIEW_APPLICANT_NAME = '';
    base.REVIEW_GROUNDS = '';
    base.LICENSING_OBJECTIVES = '';
  }

  return base;
}

function gamblingSample(variant: string) {
  const base = {
    variant,
    NOTICE_TYPE: 'Gambling Premises Licence',
    ACT_TITLE: 'Gambling Act 2005',
    GAMBLING_PREMISES_TYPE: 'BETTING',
    APPLICANT_NAME: 'Sample Gaming Ltd',
    APPLICANT_STATUS: 'company',
    APPLICANT_ADDRESS: '2 Casino Way, Sampleton LS1 1AA',
    PREMISES_NAME: 'Sample Betting Shop',
    PREMISES_ADDRESS: '12 Market Street, Sampleton LS1 1AA',
    OPENING_HOURS: 'Mon–Sun 09:00–22:00',
    NATURE_OF_VARIATION: 'Add self-service betting terminals.',
    REVIEW_APPLICANT_NAME: 'Sample Police Licensing Unit',
    REVIEW_GROUNDS: 'Concerns regarding compliance with licence conditions.',
    TRANSFER_FROM_NAME: 'ABC Betting Plc',
    TRANSFER_TO_NAME: 'Sample Gaming Ltd',
    APPLICATION_DATE: applicationDate,
    PUBLICATION_DATE: publicationDate,
    DEADLINE_DATE: deadline28,
    INSPECTION_LOCATION: 'Licensing Authority, Town Hall, Sampleton LS1 2BB',
    INSPECTION_TIMES: 'Mon–Fri, 9am–5pm',
    REPRESENTATION_METHOD: 'in writing',
    REPRESENTATION_ADDRESS: 'Licensing Authority, Town Hall, Sampleton LS1 2BB',
    REPRESENTATION_EMAIL: 'licensing@sample.gov.uk',
    AUTHORITY_NAME: 'Sample Licensing Authority',
    AUTHORITY_ADDRESS: 'Town Hall, Sampleton LS1 2BB',
    AUTHORITY_EMAIL: 'licensing@sample.gov.uk',
  } as Record<string, string>;

  if (variant.includes('variation')) base.NOTICE_TYPE = 'Gambling Premises Licence Variation';
  if (variant.includes('review')) base.NOTICE_TYPE = 'Gambling Premises Licence Review';
  if (variant.includes('transfer')) base.NOTICE_TYPE = 'Gambling Premises Licence Transfer';

  if (variant.includes('bingo')) base.GAMBLING_PREMISES_TYPE = 'BINGO';
  if (variant.includes('agc')) base.GAMBLING_PREMISES_TYPE = 'ADULT GAMING CENTRE';
  if (variant.includes('fec')) base.GAMBLING_PREMISES_TYPE = 'FAMILY ENTERTAINMENT CENTRE';

  if (!variant.includes('variation')) base.NATURE_OF_VARIATION = '';
  if (!variant.includes('review')) {
    base.REVIEW_APPLICANT_NAME = '';
    base.REVIEW_GROUNDS = '';
  }
  if (!variant.includes('transfer')) {
    base.TRANSFER_FROM_NAME = '';
    base.TRANSFER_TO_NAME = '';
  }

  return base;
}

function gvolSample(variant: string) {
  const draft = {
    variant,
    NOTICE_TYPE: variant === 'gvol-variation' ? 'GVOL — Variation' : 'GVOL — New',
    APPLICANT_NAME: 'Sample Haulage Ltd',
    APPLICANT_STATUS: 'company',
    APPLICANT_TRADING_AS: 'Sample Logistics',
    APPLICANT_ADDRESS: 'Logistics House, Manchester M1 1AA',
    LICENCE_CATEGORY: 'Standard National',
    TRAFFIC_AREA_NAME: 'North Western',
    OPERATING_CENTRE_ADDRESS: 'Unit 5 Industrial Estate, Manchester M1 1AA',
    NUMBER_OF_VEHICLES: '6',
    NUMBER_OF_TRAILERS: '4',
    GVOL_VARIATION_DETAILS: 'Increase authorisation by two vehicles at Unit 5 Industrial Estate.',
    APPLICATION_DATE: applicationDate,
    PUBLICATION_DATE: publicationDate,
    DEADLINE_DATE: deadline21FromPublication,
    REPRESENTATION_METHOD: 'in writing',
    AUTHORITY_NAME: 'Traffic Commissioner, North Western Traffic Area',
    AUTHORITY_ADDRESS: 'Springfield House, Warrington WA1 1AB',
  } as Record<string, string>;

  if (variant !== 'gvol-variation') {
    draft.GVOL_VARIATION_DETAILS = '';
  }

  return draft;
}

function planningSample(variant: string) {
  const deadline = variant === 'planning-eia' ? deadline30FromPublication : deadline21FromPublication;
  const reasonMap: Record<string, string> = {
    'planning-major': 'MAJOR DEVELOPMENT',
    'planning-eia': 'EIA DEVELOPMENT',
    'planning-listed': 'AFFECTS A LISTED BUILDING',
    'planning-conservation': 'AFFECTS A CONSERVATION AREA',
    'planning-prow': 'PUBLIC RIGHT OF WAY',
    'planning-departure': 'DEPARTURE FROM DEVELOPMENT PLAN',
  };

  return {
    variant,
    NOTICE_TYPE: 'Planning Press Notice',
    ACT_TITLE: 'Town and Country Planning Act 1990',
    APPLICANT_NAME: 'Sample Developments Ltd',
    APPLICANT_STATUS: 'company',
    APPLICANT_ADDRESS: '45 Design Park, Sample City EC1A 1BB',
    SITE_NAME: 'Land at Riverside Way',
    SITE_ADDRESS: 'Riverside Way, Sample City EC1A 1BB',
    APPLICATION_REFERENCE: 'SCC/2025/1234',
    PLANNING_REASON: reasonMap[variant] ?? 'MAJOR DEVELOPMENT',
    PROPOSAL_DESCRIPTION: 'Construction of a mixed-use development comprising 80 dwellings, retail space, and public realm improvements.',
    COMMENT_METHOD: 'via the online portal',
    COMMENT_EMAIL: 'planning@sample.gov.uk',
    COMMENT_URL: 'https://planning.sample.gov.uk/applications/123456',
    REPRESENTATION_ADDRESS: 'Planning Department, Civic Offices, Sample City EC1A 2CC',
    INSPECTION_LOCATION: 'Civic Offices, Sample City EC1A 2CC',
    ONLINE_REGISTER_URL: 'https://planning.sample.gov.uk/register',
    AUTHORITY_NAME: 'Sample City Council',
    AUTHORITY_ADDRESS: 'Civic Offices, Sample City EC1A 2CC',
    AUTHORITY_EMAIL: 'planning@sample.gov.uk',
    APPLICATION_DATE: applicationDate,
    PUBLICATION_DATE: publicationDate,
    DEADLINE_DATE: deadline,
  } as Record<string, string>;
}

function probateSample() {
  return {
    variant: 'probate-trustee-s27',
    NOTICE_TYPE: 'Trustee Act 1925 s.27',
    DECEASED_NAME: 'John Sample',
    DECEASED_ALIAS: 'Johnny Sample',
    DECEASED_LAST_ADDRESS: '50 Sample Road, Sampleton SW1A 4AA',
    DATE_OF_DEATH: toISODate(addDays(today, -45)),
    PERSONAL_REPRESENTATIVE: 'Jane Sample (Executor)',
    SOLICITOR_NAME: 'Sample Solicitors LLP',
    SOLICITOR_ADDRESS: '100 Legal Street, Sampleton SW1A 2ZZ',
    CLAIM_REFERENCE: 'JS/2025/EST',
    APPLICATION_DATE: probatePublication,
    PUBLICATION_DATE: probatePublication,
    DEADLINE_DATE: probateDeadline,
  } as Record<string, string>;
}

function troSample(variant: string) {
  const effectiveDate = toISODate(addDays(today, 14));
  const expiryDate = toISODate(addDays(today, 90));
  const objectionDeadline = deadline21FromPublication;

  const base = {
    variant,
    NOTICE_TYPE: 'Traffic Regulation Order',
    AUTHORITY_NAME: 'Sample County Council',
    AUTHORITY_EMAIL: 'traffic@sample.gov.uk',
    ORDER_TITLE: 'Sample County Council (High Street, Sample Town) (Prohibition of Waiting) Order 2025',
    ORDER_DESCRIPTION: 'prohibit waiting at any time on both sides of High Street between its junctions with Market Place and Station Road',
    ROADS_AFFECTED: 'High Street, Sample Town, between Market Place and Station Road',
    NATURE_OF_ORDER: 'Prohibition of waiting',
    REASON_FOR_ORDER: 'To improve traffic flow and road safety',
    EFFECTIVE_DATE: effectiveDate,
    EXPIRY_DATE: '',
    EXPERIMENTAL_PERIOD: '',
    INSPECTION_LOCATION: 'Highways Department, County Hall, Sample Town ST1 1AA',
    INSPECTION_HOURS: 'Monday to Friday, 9:00am to 5:00pm',
    OBJECTION_DEADLINE: objectionDeadline,
    OBJECTION_METHOD: 'in writing to the address below or by email',
    OBJECTION_ADDRESS: 'Highways Department, County Hall, Sample Town ST1 1AA',
    PUBLICATION_DATE: publicationDate,
  } as Record<string, string>;

  if (variant === 'tro-temporary') {
    base.NOTICE_TYPE = 'Temporary Traffic Regulation Order';
    base.ORDER_TITLE = 'Sample County Council (High Street, Sample Town) (Temporary Road Closure) Order 2025';
    base.ORDER_DESCRIPTION = 'temporarily close High Street to all vehicular traffic';
    base.NATURE_OF_ORDER = 'Temporary road closure';
    base.REASON_FOR_ORDER = 'To facilitate essential highway maintenance works';
    base.EXPIRY_DATE = expiryDate;
  } else if (variant === 'tro-experimental') {
    base.NOTICE_TYPE = 'Experimental Traffic Order';
    base.ORDER_TITLE = 'Sample County Council (High Street, Sample Town) (One-Way System) Experimental Order 2025';
    base.ORDER_DESCRIPTION = 'introduce a one-way traffic system on High Street, northbound only';
    base.NATURE_OF_ORDER = 'Experimental one-way system';
    base.REASON_FOR_ORDER = 'To test improvements to traffic flow and pedestrian safety';
    base.EXPERIMENTAL_PERIOD = '18 months';
  }

  return base;
}

export function buildSampleDraft(definitionId: string): Record<string, unknown> | null {
  const definition = NOTICE_DEFINITIONS.find((item) => item.id === definitionId);
  if (!definition) return null;

  switch (definition.category) {
    case 'licensing':
      return licensingSample(definition.id);
    case 'gambling':
      return gamblingSample(definition.id);
    case 'gvol':
      return gvolSample(definition.id);
    case 'planning':
      return planningSample(definition.id);
    case 'probate':
      return probateSample();
    case 'tro':
      return troSample(definition.id);
    default:
      return null;
  }
}
