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
    APPLICANT_NAME: 'Sample Bars Ltd',
    APPLICANT_STATUS: 'company',
    APPLICANT_TRADING_AS: 'Sample Lounge',
    APPLICANT_ADDRESS: '1 Demo Road, Sampleton SW1A 1AA',
    APPLICANT_COMPANY_NUMBER: '12345678',
    PREMISES_NAME: 'Sample Venue',
    PREMISES_ADDRESS: '10 High Street, Sampleton SW1A 1AA',
    LICENSABLE_ACTIVITIES: 'Sale of alcohol (on the premises); Live music',
    ACTIVITY_SCHEDULE: 'Mon–Sat 10:00–23:00; Sun 12:00–22:30',
    OPENING_HOURS: 'Daily 10:00–00:00',
    DPS_NAME: 'Jane Doe',
    DPS_LICENSING_AUTHORITY: 'Sample Borough Council',
    NATURE_OF_VARIATION: 'Extend alcohol sales until 01:00 daily.',
    REVIEW_APPLICANT_NAME: 'Sample Police Licensing Unit',
    REVIEW_GROUNDS: 'Failure to uphold the prevention of public nuisance objective.',
    LICENSING_OBJECTIVES: 'Prevention of public nuisance; Public safety',
    APPLICATION_DATE: applicationDate,
    PUBLICATION_DATE: publicationDate,
    DEADLINE_DATE: deadline28,
    INSPECTION_LOCATION: 'Licensing Team, Civic Centre, Sampleton',
    INSPECTION_TIMES: 'Mon–Fri, 9am–5pm',
    REPRESENTATION_METHOD: 'in writing',
    REPRESENTATION_ADDRESS: 'Licensing Team, Civic Centre, Sampleton SW1A 2BB',
    REPRESENTATION_EMAIL: 'licensing@sample.gov.uk',
    AUTHORITY_NAME: 'Sample Borough Council',
    AUTHORITY_ADDRESS: 'Civic Centre, Sampleton SW1A 2BB',
    AUTHORITY_EMAIL: 'licensing@sample.gov.uk',
    AUTHORITY_PHONE: '01234 567890',
    ONLINE_REGISTER_URL: 'https://sample.gov.uk/licensing/register',
    REFERENCE: 'LIC/2025/0001',
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
    default:
      return null;
  }
}
