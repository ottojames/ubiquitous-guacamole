/**
 * Department-specific configuration for council portal
 *
 * Each department type has different:
 * - Publishing capabilities
 * - Terminology (representations vs comments vs objections)
 * - Metadata fields shown in Notice Detail
 * - Empty state messages
 * - Button labels
 */

export interface DepartmentConfig {
  canPublish: boolean;
  displayName: string;
  repLabel: string; // "Representations" | "Public Comments" | "Objections" | "Consultation Responses" | "Supplier Questions"
  repLabelPlural: string;
  publishButtonLabel: string;
  emptyStateMessage: string;
  noticeDetailFields: string[];
  showDraftsCard: boolean;
  draftsCardTooltip?: string;
}

export const DEPARTMENT_CONFIG: Record<string, DepartmentConfig> = {
  licensing: {
    canPublish: false,
    displayName: 'Licensing',
    repLabel: 'Representation',
    repLabelPlural: 'Representations',
    publishButtonLabel: '', // Not used - can't publish
    emptyStateMessage: "Notices appear here automatically as they're published. You'll see deadlines and new submissions.",
    noticeDetailFields: ['applicantName', 'premisesAddress', 'applicationType', 'representationDeadline'],
    showDraftsCard: false,
    draftsCardTooltip: 'This department does not create drafts.'
  },

  planning: {
    canPublish: true,
    displayName: 'Planning & Development',
    repLabel: 'Public Comment',
    repLabelPlural: 'Public Comments',
    publishButtonLabel: 'Publish New Planning Notice',
    emptyStateMessage: 'No notices yet.',
    noticeDetailFields: ['planningRef', 'siteAddress', 'ward', 'officer'],
    showDraftsCard: true
  },

  traffic: {
    canPublish: true,
    displayName: 'Traffic Orders & Highways',
    repLabel: 'Objection',
    repLabelPlural: 'Objections',
    publishButtonLabel: 'Publish New Traffic Order Notice',
    emptyStateMessage: 'No notices yet.',
    noticeDetailFields: ['orderRef', 'roadsAffected', 'startDate', 'endDate', 'diversionDetails'],
    showDraftsCard: true
  },

  gvol: {
    canPublish: false,
    displayName: 'Goods Vehicle Operator Licensing',
    repLabel: 'Representation',
    repLabelPlural: 'Representations',
    publishButtonLabel: '', // Not used - can't publish
    emptyStateMessage: "Notices appear here automatically as they're published. You'll see deadlines and new submissions.",
    noticeDetailFields: ['operatorName', 'operatingCentreAddress', 'vehicleCount'],
    showDraftsCard: false,
    draftsCardTooltip: 'This department does not create drafts.'
  },

  environmental: {
    canPublish: false, // Default OFF - set to true if council initiates consultations
    displayName: 'Environmental Services',
    repLabel: 'Consultation Response',
    repLabelPlural: 'Consultation Responses',
    publishButtonLabel: 'Publish New Consultation Notice',
    emptyStateMessage: "Notices appear here automatically as they're published. You'll see deadlines and new submissions.",
    noticeDetailFields: ['subject', 'responsibleOfficer', 'area'],
    showDraftsCard: false,
    draftsCardTooltip: 'This department does not create drafts.'
  },

  probate: {
    canPublish: false,
    displayName: 'Probate & Estates',
    repLabel: 'Representation',
    repLabelPlural: 'Representations',
    publishButtonLabel: '', // Not used - can't publish
    emptyStateMessage: "Notices appear here automatically as they're published. You'll see deadlines and new submissions.",
    noticeDetailFields: ['estateName', 'caseRef'],
    showDraftsCard: false,
    draftsCardTooltip: 'This department does not create drafts.'
  },

  procurement: {
    canPublish: true,
    displayName: 'Procurement & Tenders',
    repLabel: 'Supplier Question',
    repLabelPlural: 'Supplier Questions',
    publishButtonLabel: 'Publish New Procurement Notice',
    emptyStateMessage: 'No notices yet.',
    noticeDetailFields: ['tenderRef', 'buyerDept', 'submissionDeadline'],
    showDraftsCard: true
  }
};

/**
 * Get configuration for a department type
 * Falls back to licensing config if type not found
 */
export function getDepartmentConfig(departmentType: string): DepartmentConfig {
  return DEPARTMENT_CONFIG[departmentType] || DEPARTMENT_CONFIG.licensing;
}

/**
 * Check if a department can publish notices
 */
export function canDepartmentPublish(departmentType: string): boolean {
  return getDepartmentConfig(departmentType).canPublish;
}
