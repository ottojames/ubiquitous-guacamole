export interface PremisesNoticeFields {
  licenceType: string;
  activities: string[];
  openingHours: string;
  alcoholHours?: string;
  seasonalVariations?: string;
  supervisor?: string;
  representationDeadline: string;
  representationText: string;
}

/**
 * Compose a simple premises licence notice from structured form values.
 * The result is intentionally plain so users can freely edit before publishing.
 */
export function composePremisesNotice(data: PremisesNoticeFields): string {
  const parts: string[] = [];
  parts.push('Licensing Act 2003');
  parts.push(`Application type: ${data.licenceType}`);
  if (data.activities.length) {
    parts.push(`Licensable activities: ${data.activities.join(', ')}`);
  }
  parts.push(`Opening hours: ${data.openingHours}`);
  if (data.alcoholHours) parts.push(`Alcohol hours: ${data.alcoholHours}`);
  if (data.seasonalVariations) {
    parts.push(`Seasonal variations: ${data.seasonalVariations}`);
  }
  if (data.supervisor) {
    parts.push(`Designated premises supervisor: ${data.supervisor}`);
  }
  parts.push(`Representations must be made by ${data.representationDeadline}.`);
  if (data.representationText) {
    parts.push(data.representationText);
  }
  return parts.join('\n') + '\n';
}
