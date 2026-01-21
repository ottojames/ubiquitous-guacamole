/**
 * IDOX Export Service
 *
 * Generates CSV exports in IDOX-compatible format for UK council licensing systems.
 * See docs/idox-export-format.md for full specification.
 */

export interface RepresentationForExport {
  id: string;
  notice_id: string;
  representor_name?: string | null;
  representor_email?: string | null;
  type: 'support' | 'objection' | 'comment';
  representation_text: string;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by_name?: string | null;
  assigned_to_name?: string | null;
  notice?: {
    notice_type?: string;
    application_type?: string;
    applicant?: string;
    trading_name?: string;
    premises?: {
      line1?: string;
      line2?: string;
      town?: string;
      postcode?: string;
      name?: string;
      address?: string;
    };
  } | null;
}

/**
 * Maps representation type to IDOX stance label
 */
function getStanceLabel(type: string): string {
  switch (type) {
    case 'support':
      return 'Support';
    case 'objection':
      return 'Objection';
    case 'comment':
      return 'Comment';
    default:
      return type;
  }
}

/**
 * Escapes a value for CSV output (handles quotes and special characters)
 */
function escapeForCsv(value: string | null | undefined): string {
  if (value == null) return '';
  // Replace double quotes with escaped double quotes
  return value.replace(/"/g, '""');
}

/**
 * Generates IDOX-compatible CSV content from representations
 */
export function generateIdoxCsv(representations: RepresentationForExport[]): string {
  // Header row per IDOX specification (14 columns)
  const headers = [
    'Representation ID',
    'Notice Reference',
    'Submitter Name',
    'Submitter Email',
    'Stance',
    'Representation Text',
    'Date Submitted',
    'Reviewed Status',
    'Reviewed By',
    'Reviewed Date',
    'Assigned To',
    'Application Type',
    'Premises Name',
    'Premises Address',
  ];

  // Map each representation to a CSV row
  const rows = representations.map((rep) => {
    const premisesAddress = rep.notice?.premises
      ? JSON.stringify({
          line1: rep.notice.premises.line1 || rep.notice.premises.address || '',
          line2: rep.notice.premises.line2 || '',
          town: rep.notice.premises.town || '',
          postcode: rep.notice.premises.postcode || '',
        })
      : '';

    return [
      rep.id,
      rep.notice_id,
      rep.representor_name || 'Anonymous',
      rep.representor_email || '',
      getStanceLabel(rep.type),
      escapeForCsv(rep.representation_text),
      new Date(rep.submitted_at).toISOString(),
      rep.reviewed_at ? 'Reviewed' : 'Not Reviewed',
      rep.reviewed_by_name || '',
      rep.reviewed_at ? new Date(rep.reviewed_at).toISOString() : '',
      rep.assigned_to_name || '',
      rep.notice?.application_type || rep.notice?.notice_type || '',
      rep.notice?.applicant || rep.notice?.trading_name || rep.notice?.premises?.name || '',
      escapeForCsv(premisesAddress),
    ];
  });

  // Format as CSV with all fields double-quoted
  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Generates the IDOX export filename with current date
 */
export function getIdoxFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `idox-representations-${date}.csv`;
}
