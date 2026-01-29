/**
 * Department-specific configuration for council portal
 *
 * Each department type has different:
 * - Publishing capabilities
 * - Terminology (representations vs comments vs objections)
 * - Metadata fields shown in Notice Detail
 * - Empty state messages
 * - Button labels
 * - Dashboard metrics (what KPIs are displayed)
 */

/**
 * Metric types available for dashboard display
 * - total: All notices (any status)
 * - published: Currently live notices
 * - draft: Saved but not published
 * - expired: Consultation window closed
 * - representations: Total representations received
 * - closing_soon: Notices closing within 48 hours
 * - pending_decision: Awaiting determination (Planning)
 * - awaiting_response: Representations needing response (Licensing)
 */
export type DashboardMetricType =
  | 'total'
  | 'published'
  | 'draft'
  | 'expired'
  | 'representations'
  | 'closing_soon'
  | 'pending_decision'
  | 'awaiting_response';

export interface DashboardMetricConfig {
  type: DashboardMetricType;
  label: string;
  tooltip: string;
  icon: 'document' | 'check' | 'edit' | 'users' | 'clock' | 'alert' | 'hourglass' | 'inbox';
  color: 'blue' | 'green' | 'gray' | 'purple' | 'red' | 'amber' | 'rose';
  linkFilter?: string; // Query param for notices list (e.g., "?status=published")
}

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
  /** Dashboard metrics to display - ordered array of metric configs */
  dashboardMetrics: DashboardMetricConfig[];
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
    draftsCardTooltip: 'This department does not create drafts.',
    dashboardMetrics: [
      { type: 'total', label: 'Total Notices', tooltip: 'All notices for this department (any status)', icon: 'document', color: 'blue', linkFilter: '' },
      { type: 'published', label: 'Open for Reps', tooltip: 'Currently live and within 28-day representation window', icon: 'check', color: 'green', linkFilter: '?status=published' },
      { type: 'closing_soon', label: 'Closing Soon', tooltip: 'Consultation period ends within 48 hours', icon: 'clock', color: 'amber', linkFilter: '?closing_soon=true' },
      { type: 'representations', label: 'Representations', tooltip: 'Total representations received across all notices', icon: 'users', color: 'purple', linkFilter: '' },
      { type: 'awaiting_response', label: 'Awaiting Response', tooltip: 'Representations requiring officer response', icon: 'inbox', color: 'rose', linkFilter: '?has_unread_reps=true' }
    ]
  },

  planning: {
    canPublish: true,
    displayName: 'Planning & Development',
    repLabel: 'Public Comment',
    repLabelPlural: 'Public Comments',
    publishButtonLabel: 'Publish New Planning Notice',
    emptyStateMessage: 'No notices yet.',
    noticeDetailFields: ['planningRef', 'siteAddress', 'ward', 'officer'],
    showDraftsCard: true,
    dashboardMetrics: [
      { type: 'total', label: 'Total Applications', tooltip: 'All planning applications for this department', icon: 'document', color: 'blue', linkFilter: '' },
      { type: 'published', label: 'In Consultation', tooltip: 'Currently in 21-day public consultation period', icon: 'check', color: 'green', linkFilter: '?status=published' },
      { type: 'draft', label: 'Drafts', tooltip: 'Applications saved but not yet published', icon: 'edit', color: 'gray', linkFilter: '?status=draft' },
      { type: 'pending_decision', label: 'Pending Decision', tooltip: 'Consultation closed, awaiting determination', icon: 'hourglass', color: 'amber', linkFilter: '?status=pending_decision' },
      { type: 'representations', label: 'Comments', tooltip: 'Total public comments received across all applications', icon: 'users', color: 'purple', linkFilter: '' }
    ]
  },

  traffic: {
    canPublish: true,
    displayName: 'Traffic Orders & Highways',
    repLabel: 'Objection',
    repLabelPlural: 'Objections',
    publishButtonLabel: 'Publish New Traffic Order Notice',
    emptyStateMessage: 'No notices yet.',
    noticeDetailFields: ['orderRef', 'roadsAffected', 'startDate', 'endDate', 'diversionDetails'],
    showDraftsCard: true,
    dashboardMetrics: [
      { type: 'total', label: 'Total Orders', tooltip: 'All traffic regulation orders for this department', icon: 'document', color: 'blue', linkFilter: '' },
      { type: 'published', label: 'Open for Objections', tooltip: 'Currently in 21-day objection period', icon: 'check', color: 'green', linkFilter: '?status=published' },
      { type: 'draft', label: 'Drafts', tooltip: 'Orders saved but not yet published', icon: 'edit', color: 'gray', linkFilter: '?status=draft' },
      { type: 'representations', label: 'Objections', tooltip: 'Total objections received across all orders', icon: 'users', color: 'purple', linkFilter: '' },
      { type: 'expired', label: 'Expired', tooltip: 'Objection period closed', icon: 'alert', color: 'red', linkFilter: '?status=expired' }
    ]
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
    draftsCardTooltip: 'This department does not create drafts.',
    dashboardMetrics: [
      { type: 'total', label: 'Total Notices', tooltip: 'All GVOL notices for this department', icon: 'document', color: 'blue', linkFilter: '' },
      { type: 'published', label: 'Open for Reps', tooltip: 'Currently live and open for representations', icon: 'check', color: 'green', linkFilter: '?status=published' },
      { type: 'closing_soon', label: 'Closing Soon', tooltip: 'Representation period ends within 48 hours', icon: 'clock', color: 'amber', linkFilter: '?closing_soon=true' },
      { type: 'representations', label: 'Representations', tooltip: 'Total representations received', icon: 'users', color: 'purple', linkFilter: '' },
      { type: 'expired', label: 'Expired', tooltip: 'Representation period closed', icon: 'alert', color: 'red', linkFilter: '?status=expired' }
    ]
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
    draftsCardTooltip: 'This department does not create drafts.',
    dashboardMetrics: [
      { type: 'total', label: 'Total Notices', tooltip: 'All environmental notices for this department', icon: 'document', color: 'blue', linkFilter: '' },
      { type: 'published', label: 'Active', tooltip: 'Currently published notices', icon: 'check', color: 'green', linkFilter: '?status=published' },
      { type: 'representations', label: 'Responses', tooltip: 'Total consultation responses received', icon: 'users', color: 'purple', linkFilter: '' },
      { type: 'expired', label: 'Closed', tooltip: 'Consultation period closed', icon: 'alert', color: 'red', linkFilter: '?status=expired' }
    ]
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
    draftsCardTooltip: 'This department does not create drafts.',
    dashboardMetrics: [
      { type: 'total', label: 'Total Notices', tooltip: 'All probate notices for this department', icon: 'document', color: 'blue', linkFilter: '' },
      { type: 'published', label: 'Active', tooltip: 'Currently published notices', icon: 'check', color: 'green', linkFilter: '?status=published' },
      { type: 'representations', label: 'Representations', tooltip: 'Total representations received', icon: 'users', color: 'purple', linkFilter: '' },
      { type: 'expired', label: 'Expired', tooltip: 'Notice period closed', icon: 'alert', color: 'red', linkFilter: '?status=expired' }
    ]
  },

  procurement: {
    canPublish: true,
    displayName: 'Procurement & Tenders',
    repLabel: 'Supplier Question',
    repLabelPlural: 'Supplier Questions',
    publishButtonLabel: 'Publish New Procurement Notice',
    emptyStateMessage: 'No notices yet.',
    noticeDetailFields: ['tenderRef', 'buyerDept', 'submissionDeadline'],
    showDraftsCard: true,
    dashboardMetrics: [
      { type: 'total', label: 'Total Tenders', tooltip: 'All procurement notices for this department', icon: 'document', color: 'blue', linkFilter: '' },
      { type: 'published', label: 'Open', tooltip: 'Currently open for submissions', icon: 'check', color: 'green', linkFilter: '?status=published' },
      { type: 'draft', label: 'Drafts', tooltip: 'Tenders saved but not yet published', icon: 'edit', color: 'gray', linkFilter: '?status=draft' },
      { type: 'representations', label: 'Questions', tooltip: 'Total supplier questions received', icon: 'users', color: 'purple', linkFilter: '' },
      { type: 'expired', label: 'Closed', tooltip: 'Submission deadline passed', icon: 'alert', color: 'red', linkFilter: '?status=expired' }
    ]
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
