/**
 * Notice Type Permissions & Workflow Configuration
 *
 * Defines who can publish each notice type and whether council approval is required
 */

export type NoticePermissionConfig = {
  /** Whether this notice requires council approval before publication */
  requiresCouncilApproval: boolean;

  /** User types allowed to publish this notice directly */
  allowedPublishers: ('council' | 'law_firm' | 'solicitor')[];

  /** Whether individual applicants can submit this notice type */
  allowsPublicSubmissions: boolean;

  /** Description for applicants */
  applicantDescription?: string;
};

/**
 * Notice type permission rules
 * Keys must match the actual notice type IDs from noticeTypes.ts
 */
export const NOTICE_PERMISSIONS: Record<string, NoticePermissionConfig> = {
  // ========================================
  // LICENSING NOTICES (Applicants Can Submit)
  // ========================================

  'licensing-premises-new': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
    applicantDescription: 'Apply for a new premises licence to sell alcohol, provide entertainment, or serve late-night refreshments',
  },

  'licensing-premises-variation': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
    applicantDescription: 'Vary your existing premises licence (e.g., extend hours, add activities)',
  },

  'licensing-premises-review': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false, // Only councils can initiate reviews
    applicantDescription: 'Request a review of an existing premises licence',
  },

  'licensing-club-new': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
    applicantDescription: 'Apply for a club premises certificate for members clubs',
  },

  'licensing-club-variation': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
    applicantDescription: 'Vary your club premises certificate',
  },

  'licensing-club-review': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false,
  },

  // ========================================
  // GAMBLING NOTICES (Applicants Can Submit)
  // ========================================

  'gambling-betting-new': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
    applicantDescription: 'Apply for a new betting premises licence',
  },

  'gambling-betting-variation': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
  },

  'gambling-betting-review': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false,
  },

  'gambling-betting-transfer': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
  },

  'gambling-bingo-new': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
  },

  'gambling-bingo-variation': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
  },

  'gambling-bingo-review': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false,
  },

  'gambling-bingo-transfer': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
  },

  'gambling-agc-new': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
  },

  'gambling-agc-variation': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
  },

  'gambling-agc-review': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false,
  },

  'gambling-agc-transfer': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
  },

  'gambling-fec-new': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
  },

  'gambling-fec-variation': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
  },

  'gambling-fec-review': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false,
  },

  'gambling-fec-transfer': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
  },

  // ========================================
  // GOODS VEHICLE OPERATOR LICENCE (GVOL) - Applicants Can Submit
  // ========================================

  'gvol-new': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
    applicantDescription: 'Apply for a Goods Vehicle Operator\'s Licence',
  },

  'gvol-variation': {
    requiresCouncilApproval: true,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: true,
    applicantDescription: 'Vary your Goods Vehicle Operator\'s Licence',
  },

  // ========================================
  // PLANNING NOTICES (Council Only - No Public Submissions)
  // ========================================

  'planning-major': {
    requiresCouncilApproval: false,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false, // Planning goes through council portal
  },

  'planning-eia': {
    requiresCouncilApproval: false,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false,
  },

  'planning-listed': {
    requiresCouncilApproval: false,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false,
  },

  'planning-conservation': {
    requiresCouncilApproval: false,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false,
  },

  'planning-prow': {
    requiresCouncilApproval: false,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false,
  },

  'planning-departure': {
    requiresCouncilApproval: false,
    allowedPublishers: ['council'],
    allowsPublicSubmissions: false,
  },

  // ========================================
  // PROBATE & LEGAL NOTICES (Law Firms Publish Directly)
  // ========================================

  'probate-trustee-s27': {
    requiresCouncilApproval: false,
    allowedPublishers: ['law_firm', 'solicitor'],
    allowsPublicSubmissions: false, // Only solicitors handle probate
    applicantDescription: 'Probate notices must be published by solicitors or legal representatives',
  },
};

/**
 * Get permission config for a notice type
 */
export function getNoticePermissions(noticeTypeId: string): NoticePermissionConfig | null {
  return NOTICE_PERMISSIONS[noticeTypeId] || null;
}

/**
 * Check if a user type can publish a notice type
 */
export function canPublishNoticeType(
  noticeTypeId: string,
  userType: 'council' | 'law_firm' | 'solicitor' | 'applicant'
): boolean {
  const config = getNoticePermissions(noticeTypeId);
  if (!config) return false;

  if (userType === 'applicant') return false; // Applicants never publish directly

  return config.allowedPublishers.includes(userType as any);
}

/**
 * Check if applicants can submit this notice type
 * If no explicit permission is defined, default to false (council-only)
 */
export function canSubmitNoticeType(noticeTypeId: string): boolean {
  const config = getNoticePermissions(noticeTypeId);
  if (!config) {
    // Default: if no permission defined, allow councils only (not applicants)
    console.warn(`No permission defined for notice type: ${noticeTypeId}. Defaulting to council-only.`);
    return false;
  }
  return config.allowsPublicSubmissions || false;
}

/**
 * Get workflow description for a notice type
 */
export function getWorkflowDescription(
  noticeTypeId: string,
  userType: 'council' | 'law_firm' | 'solicitor' | 'applicant'
): string {
  const config = getNoticePermissions(noticeTypeId);
  if (!config) return '';

  if (userType === 'council') {
    return config.requiresCouncilApproval
      ? 'You will publish this notice after reviewing the application'
      : 'You will publish this notice directly';
  }

  if (userType === 'law_firm' || userType === 'solicitor') {
    return config.allowedPublishers.includes(userType)
      ? 'You can publish this notice directly'
      : 'This notice type requires council approval';
  }

  if (userType === 'applicant') {
    return config.allowsPublicSubmissions
      ? 'Your application will be reviewed by the council before publication'
      : 'This notice type cannot be submitted by individuals';
  }

  return '';
}
