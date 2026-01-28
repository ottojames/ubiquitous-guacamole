import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';

import { ensurePostcodeCoordinates, normalisePostcode as geocodeNormalisePostcode } from '../lib/geocode';
import { requireAuth, loadUserPermissions, requirePermission, optionalAuth } from '../middleware/auth';
import { sendWebhookEvent } from '../services/webhooks';

const POSTCODE_RE = /([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})/i;

type SortDirection = 'asc' | 'desc';

const DEFAULT_SORT: { column: string; direction: SortDirection } = {
  column: 'created_at',
  direction: 'desc',
};

const POSTCODE_JSON_EXPRESSION = "coalesce(premises->>'postcode', premises_address->>'postcode')";

function normaliseSortColumn(raw: string): string {
  if (!raw) return DEFAULT_SORT.column;
  if (raw === 'createdAt') return 'created_at';
  if (raw === 'updatedAt') return 'updated_at';
  if (raw === 'distance') return 'distance'; // For distance-based sorting
  return raw;
}

function normalisePostcode(raw: string): { full: string; outward: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.toUpperCase().match(POSTCODE_RE);
  if (!match) return null;
  const outward = match[1];
  const inward = match[2];
  return { full: `${outward} ${inward}`, outward };
}

function buildIlikeFilter(column: string, raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const safeValue = trimmed.replace(/"/g, '""');
  return `${column}.ilike."%${safeValue}%"`;
}

function parseLimit(value: any): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 25;
  return Math.max(1, Math.min(100, Math.floor(numeric)));
}

function parseSort(sortParam: string | undefined): { column: string; direction: SortDirection } {
  if (sortParam) {
    const [rawColumn, rawDir] = sortParam.split('.');
    const column = normaliseSortColumn(rawColumn);
    if (column === 'created_at' || column === 'updated_at' || column === 'distance') {
      const direction: SortDirection = rawDir === 'asc' || rawDir === 'desc' ? rawDir : 'desc';
      return { column, direction };
    }
  }

  return DEFAULT_SORT;
}

function parseBoundingBox(raw: any): [number, number, number, number] | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return null;
  const parts = value
    .split(',')
    .map((segment) => Number(segment.trim()))
    .filter((segment) => Number.isFinite(segment));
  if (parts.length !== 4) return null;
  const [south, west, north, east] = parts as [number, number, number, number];
  if (
    south < -90 ||
    south > 90 ||
    north < -90 ||
    north > 90 ||
    west < -180 ||
    west > 180 ||
    east < -180 ||
    east > 180 ||
    north <= south ||
    east <= west
  ) {
    return null;
  }
  return [south, west, north, east];
}

function parseBoolean(raw: any): boolean {
  if (typeof raw === 'string') {
    return raw.toLowerCase() === 'true' || raw === '1';
  }
  if (typeof raw === 'number') {
    return raw === 1;
  }
  return false;
}

function parseCoordinate(value: any, kind: 'latitude' | 'longitude'): number | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const numeric = Number(candidate);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (kind === 'latitude' && (numeric < -90 || numeric > 90)) {
    return null;
  }
  if (kind === 'longitude' && (numeric < -180 || numeric > 180)) {
    return null;
  }
  return numeric;
}

function parseLatitude(raw: any): number | null {
  return parseCoordinate(raw, 'latitude');
}

function parseLongitude(raw: any): number | null {
  return parseCoordinate(raw, 'longitude');
}

function toTimestamp(value: any): number {
  if (!value) return NaN;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : NaN;
}

function sortRowsBy(rows: any[], column: string, direction: SortDirection) {
  const sorted = [...rows];
  const ascending = direction === 'asc';

  sorted.sort((a, b) => {
    const aTime = toTimestamp(a?.[column]);
    const bTime = toTimestamp(b?.[column]);

    const aValid = Number.isFinite(aTime);
    const bValid = Number.isFinite(bTime);

    if (!aValid && !bValid) return 0;
    if (!aValid) return ascending ? -1 : 1;
    if (!bValid) return ascending ? 1 : -1;

    if (aTime === bTime) return 0;
    if (aTime < bTime) return ascending ? -1 : 1;
    return ascending ? 1 : -1;
  });

  return sorted;
}

// Comprehensive mapping of notice type slugs to human-readable labels
// Mirrors the definitions in src/next/publish/config/noticeTypes.ts
const NOTICE_TYPE_LABELS: Record<string, string> = {
  // Licensing Act 2003 - Premises Licence
  'licensing-premises-new': 'Premises Licence — New',
  'licensing-premises-variation': 'Premises Licence — Variation',
  'licensing-premises-review': 'Premises Licence — Review',
  // Licensing Act 2003 - Club Premises Certificate
  'licensing-club-new': 'Club Premises Certificate — New',
  'licensing-club-variation': 'Club Premises Certificate — Variation',
  'licensing-club-review': 'Club Premises Certificate — Review',
  // Gambling Act 2005 - Betting
  'gambling-betting-new': 'Betting — New',
  'gambling-betting-variation': 'Betting — Variation',
  'gambling-betting-review': 'Betting — Review',
  'gambling-betting-transfer': 'Betting — Transfer',
  // Gambling Act 2005 - Bingo
  'gambling-bingo-new': 'Bingo — New',
  'gambling-bingo-variation': 'Bingo — Variation',
  'gambling-bingo-review': 'Bingo — Review',
  'gambling-bingo-transfer': 'Bingo — Transfer',
  // Gambling Act 2005 - Adult Gaming Centre
  'gambling-agc-new': 'Adult Gaming Centre — New',
  'gambling-agc-variation': 'Adult Gaming Centre — Variation',
  'gambling-agc-review': 'Adult Gaming Centre — Review',
  'gambling-agc-transfer': 'Adult Gaming Centre — Transfer',
  // Gambling Act 2005 - Family Entertainment Centre
  'gambling-fec-new': 'Family Entertainment Centre — New',
  'gambling-fec-variation': 'Family Entertainment Centre — Variation',
  'gambling-fec-review': 'Family Entertainment Centre — Review',
  'gambling-fec-transfer': 'Family Entertainment Centre — Transfer',
  // GVOL
  'gvol-new': 'GVOL — New',
  'gvol-variation': 'GVOL — Variation',
  // Planning
  'planning-major': 'Major Development',
  'planning-eia': 'EIA Development',
  'planning-listed': 'Listed Building',
  'planning-conservation': 'Conservation Area',
  'planning-prow': 'Public Right of Way',
  'planning-departure': 'Departure',
  // Probate
  'probate-trustee-s27': 'Trustee Act 1925 s.27',
  // TRO
  'tro-permanent': 'TRO — Permanent',
  'tro-temporary': 'TRO — Temporary',
  'tro-experimental': 'TRO — Experimental',
};

function getNoticeTypeLabel(noticeTypeSlug: string): string {
  if (!noticeTypeSlug) return 'Notice';
  return NOTICE_TYPE_LABELS[noticeTypeSlug] || noticeTypeSlug;
}

function firstNonEmptyString(...values: any[]): string | null {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function firstFiniteTimestamp(...values: any[]): number {
  for (const value of values) {
    const timestamp = toTimestamp(value);
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }
  return NaN;
}

function extractPostcode(row: any): string | null {
  const postcode = firstNonEmptyString(
    row?.premises?.postcode,
    row?.postcode,
    row?.premises_address?.postcode
  );
  return postcode ? postcode.toUpperCase() : null;
}

// Remove duplicate consecutive words/segments from address string
function dedupeAddressString(address: string): string {
  // Split by comma, trim each part, remove duplicates while preserving order
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const normalized = part.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(part);
    }
  }
  return unique.join(', ');
}

function extractPremisesAddress(row: any): string | null {
  // Check premises.address as string
  if (typeof row?.premises?.address === 'string') {
    const trimmed = row.premises.address.trim();
    if (trimmed) return dedupeAddressString(trimmed);
  }

  // Check premises.address as object (line1, line2, town, postcode)
  const premisesAddressObj = row?.premises?.address;
  if (premisesAddressObj && typeof premisesAddressObj === 'object' && !Array.isArray(premisesAddressObj)) {
    const segments: string[] = [];
    for (const key of ['line1', 'line2', 'town', 'postcode']) {
      const value = typeof premisesAddressObj?.[key] === 'string' ? premisesAddressObj[key].trim() : '';
      if (value) {
        // Skip if this value is already contained in a previous segment (e.g., postcode in line1)
        const alreadyIncluded = segments.some(seg => seg.includes(value) || value.includes(seg));
        if (!alreadyIncluded) {
          segments.push(value);
        }
      }
    }
    if (segments.length) {
      return dedupeAddressString(segments.join(', '));
    }
  }

  // Check premises_address column as string
  const premisesAddress = row?.premises_address;
  if (typeof premisesAddress === 'string') {
    const trimmed = premisesAddress.trim();
    if (trimmed) return dedupeAddressString(trimmed);
  }

  // Check premises_address column as object
  if (premisesAddress && typeof premisesAddress === 'object' && !Array.isArray(premisesAddress)) {
    const segments: string[] = [];
    for (const key of ['line1', 'line2', 'town', 'postcode']) {
      const value = typeof premisesAddress?.[key] === 'string' ? premisesAddress[key].trim() : '';
      if (value) {
        // Skip if this value is already contained in a previous segment
        const alreadyIncluded = segments.some(seg => seg.includes(value) || value.includes(seg));
        if (!alreadyIncluded) {
          segments.push(value);
        }
      }
    }
    if (segments.length) {
      return dedupeAddressString(segments.join(', '));
    }
  }

  return null;
}

function extractPremisesName(row: any): string | null {
  const fromPremises = firstNonEmptyString(row?.premises?.name);
  if (fromPremises) return fromPremises;

  const tradingName = firstNonEmptyString(row?.trading_name);
  if (tradingName) return tradingName;

  return null;
}

function extractRepsDeadline(row: any): string | null {
  const deadline = firstNonEmptyString(
    row?.consultation?.repsDeadline,
    row?.representation_deadline,
    row?.reps_deadline
  );
  return deadline;
}

function extractPublicationDate(row: any): string | null {
  const directValue = firstNonEmptyString(
    row?.publication?.targetDate,
    row?.published_date,
    row?.notice_publication_date
  );
  if (directValue) return directValue;

  const timestamp = firstFiniteTimestamp(row?.published_at, row?.created_at);
  if (Number.isFinite(timestamp)) {
    return new Date(timestamp).toISOString();
  }

  return null;
}

function extractApplicantDisplayName(row: any): string | null {
  const displayName = firstNonEmptyString(
    row?.extras?.applicantDisplayName,
    row?.applicant?.displayName,
    row?.applicant_name
  );
  return displayName;
}

function extractDateLike(...values: any[]): string | null {
  for (const value of values) {
    if (!value) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
    const timestamp = toTimestamp(value);
    if (Number.isFinite(timestamp)) {
      return new Date(timestamp).toISOString();
    }
  }
  return null;
}

function extractLatitude(row: any): number | null {
  const value = typeof row?.latitude === 'number' ? row.latitude : Number(row?.latitude);
  return Number.isFinite(value) ? value : null;
}

function extractLongitude(row: any): number | null {
  const value = typeof row?.longitude === 'number' ? row.longitude : Number(row?.longitude);
  return Number.isFinite(value) ? value : null;
}

function getPublishedTimestamp(row: any): number {
  return firstFiniteTimestamp(
    row?.publication?.targetDate,
    row?.published_at,
    row?.published_date,
    row?.created_at
  );
}

function getCreatedTimestamp(row: any): number {
  return firstFiniteTimestamp(row?.created_at, row?.published_at, row?.published_date);
}

// Generate formatted notice text from raw data
function generateNoticeText(row: any): string {
  const extras = row?.extras && typeof row.extras === 'object' ? row.extras : {};
  const tokens = extras.tokens || {};

  // Try to use detailed tokens if available, otherwise fall back to extracted values
  const noticeType = tokens.NOTICE_TYPE || row?.notice_type || 'Notice';
  const premisesName = tokens.PREMISES_NAME || extractPremisesName(row);
  const premisesAddress = tokens.PREMISES_ADDRESS || extractPremisesAddress(row);
  const applicantName = tokens.APPLICANT_NAME || firstNonEmptyString(
    row?.applicant?.name,
    row?.consultation?.applicantName,
    row?.licensing?.applicantName
  );
  const applicantAddress = tokens.APPLICANT_ADDRESS || row?.applicant?.address || row?.consultation?.applicantAddress;
  const licensableActivities = tokens.LICENSABLE_ACTIVITIES;
  const openingHours = tokens.OPENING_HOURS || row?.licensing?.hours;
  const repsDeadline = extractRepsDeadline(row);
  const authorityName = tokens.AUTHORITY_NAME;
  const authorityAddress = tokens.AUTHORITY_ADDRESS || tokens.REPRESENTATION_ADDRESS;
  const newspaper = tokens.PUBLICATION_NEWSPAPER || row?.publication?.newspaper;

  // Build the formatted notice text similar to official gazette notices
  let text = `NOTICE OF APPLICATION\n\n`;
  text += `${noticeType}\n\n`;

  if (premisesName || premisesAddress) {
    text += `PREMISES\n`;
    if (premisesName) text += `${premisesName}\n`;
    if (premisesAddress) text += `${premisesAddress}\n`;
    text += `\n`;
  }

  if (applicantName) {
    text += `APPLICANT\n`;
    text += `${applicantName}\n`;
    if (applicantAddress) text += `${applicantAddress}\n`;
    text += `\n`;
  }

  if (licensableActivities) {
    text += `LICENSABLE ACTIVITIES\n`;
    const activityList = licensableActivities.split(/[;,]/).map((a: string) => a.trim()).filter(Boolean);
    activityList.forEach((activity: string) => {
      text += `• ${activity}\n`;
    });
    text += `\n`;
  }

  if (openingHours) {
    text += `OPENING HOURS\n`;
    text += `${openingHours}\n\n`;
  }

  if (repsDeadline) {
    text += `REPRESENTATIONS\n`;
    text += `Representations concerning this application must be made in writing to the licensing authority by ${formatDateForNotice(repsDeadline)}.\n`;
    if (authorityAddress) {
      text += `\nRepresentations should be sent to:\n${authorityAddress}\n`;
    }
    text += `\n`;
  }

  text += `The register and application records may be inspected at the licensing authority during normal office hours.`;

  if (authorityName) {
    text += `\n\nLicensing Authority: ${authorityName}`;
  }

  if (newspaper) {
    text += `\n\nPublished in ${newspaper}`;
  }

  return text.trim();
}

function formatDateForNotice(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

const router = Router();

type DraftNoticeAddress = {
  line1?: string;
  line2?: string;
  town?: string;
  postcode?: string;
  uprn?: string;
};

type DraftNoticePayload = {
  address?: DraftNoticeAddress;
  postcode?: string;
  councilId?: string;
};

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildPremises(address: DraftNoticeAddress | undefined, postcode: string) {
  const line1 = safeString(address?.line1);
  const line2 = safeString(address?.line2);
  const town = safeString(address?.town);
  const uprn = safeString(address?.uprn);

  const components = [line1, line2, town, postcode].filter(Boolean);

  return {
    name: line1 || null,
    line1: line1 || null,
    line2: line2 || null,
    town: town || null,
    uprn: uprn || null,
    postcode,
    address: components.join(', ') || null,
  };
}

router.post('/notices/draft', requireAuth, loadUserPermissions, requirePermission('notices.create'), async (req, res) => {
  try {
    const body = (req.body ?? {}) as DraftNoticePayload;
    const postcodeInput = body.postcode || body.address?.postcode;
    const formattedPostcode = geocodeNormalisePostcode(postcodeInput ?? '');

    if (!formattedPostcode) {
      return res.status(400).json({ error: 'Invalid postcode' });
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const client = getServiceSupabaseClient();

    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      const coords = await ensurePostcodeCoordinates(formattedPostcode);
      if (coords) {
        latitude = coords.latitude;
        longitude = coords.longitude;
      }
    } catch (error) {
      console.warn('[notice-draft] geocode failed', error);
    }

    const premises = buildPremises(body.address, formattedPostcode);
    if (latitude !== null && longitude !== null) {
      (premises as any).coordinates = { latitude, longitude };
    }

    const payload = {
      notice_type: 'draft',
      status: 'draft',
      applicant: {},
      premises,
      extras: {
        ...(body.councilId ? { councilId: body.councilId } : {}),
      },
      latitude,
      longitude,
    };

    const { data, error } = await client.from('notices').insert(payload).select('id').single();
    if (error) {
      console.error('[notice-draft] Supabase insert failed', error);
      return res.status(500).json({ error: 'Failed to create draft' });
    }

    return res.status(201).json({ id: data.id });
  } catch (error: any) {
    console.error('❌ [notice-draft] Unexpected server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/notices/submit', optionalAuth, async (req, res) => {
  console.log('========== [notice-submit] NEW SUBMISSION REQUEST ==========');
  console.log('[notice-submit] Body:', JSON.stringify(req.body, null, 2));
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error('❌ [notice-submit] ERROR: Supabase configuration missing');
      console.error('   - SUPABASE_URL:', url ? 'configured' : 'MISSING');
      console.error('   - SUPABASE_SERVICE_ROLE_KEY:', key ? 'configured' : 'MISSING');
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const client = getServiceSupabaseClient();
    const payload = req.body;

    if (!payload || typeof payload !== 'object') {
      console.error('❌ [notice-submit] ERROR: Invalid payload');
      console.error('   - Payload type:', typeof payload);
      console.error('   - Payload:', payload);
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Validate required fields
    const requiredFields = ['notice_type', 'applicant', 'premises'];
    const missingFields = requiredFields.filter(field => !payload[field]);

    if (missingFields.length > 0) {
      console.error('❌ [notice-submit] ERROR: Missing required fields');
      console.error('   - Missing:', missingFields.join(', '));
      return res.status(400).json({
        error: 'validation',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Extract postcode from premises address for geocoding
    let postcode: string | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (payload.premises?.address) {
      const addressStr = typeof payload.premises.address === 'string'
        ? payload.premises.address
        : payload.premises.address.line1 || '';

      // Extract UK postcode (basic regex)
      const postcodeMatch = addressStr.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
      if (postcodeMatch) {
        postcode = postcodeMatch[1].replace(/\s/g, '');

        // Geocode the postcode
        try {
          const geoResponse = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            if (geoData.result) {
              latitude = geoData.result.latitude;
              longitude = geoData.result.longitude;
              console.log(`[notice-submit] Geocoded ${postcode}: ${latitude}, ${longitude}`);
            }
          }
        } catch (geoError) {
          console.warn('[notice-submit] Geocoding failed:', geoError);
        }
      }
    }

    // Resolve organization_id from department_id if not provided
    let resolvedOrganizationId = payload.organization_id || null;
    let resolvedDepartmentId = payload.department_id || null;

    if (resolvedDepartmentId && !resolvedOrganizationId) {
      console.log('[notice-submit] Looking up organization_id from department_id:', resolvedDepartmentId);
      const { data: deptData, error: deptError } = await client
        .from('departments')
        .select('organization_id')
        .eq('id', resolvedDepartmentId)
        .single();

      if (deptData?.organization_id) {
        resolvedOrganizationId = deptData.organization_id;
        console.log('[notice-submit] Resolved organization_id:', resolvedOrganizationId);
      } else if (deptError) {
        console.warn('[notice-submit] Failed to lookup department:', deptError.message);
      }
    }

    // If still no organization_id and we have a postcode, try to find the local council
    if (!resolvedOrganizationId && postcode) {
      try {
        console.log('[notice-submit] Looking up council from postcode area:', postcode);
        // Get admin district from postcodes.io
        const postcodeResponse = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
        if (postcodeResponse.ok) {
          const postcodeData = await postcodeResponse.json();
          const adminDistrict = postcodeData.result?.admin_district;
          if (adminDistrict) {
            console.log('[notice-submit] Admin district:', adminDistrict);
            // Look up the council/organization by name (fuzzy match)
            const { data: orgData } = await client
              .from('organizations')
              .select('id, name')
              .or(`name.ilike.%${adminDistrict}%,name.ilike.%${adminDistrict.replace(/ /g, '-')}%`)
              .limit(1)
              .maybeSingle();

            if (orgData?.id) {
              resolvedOrganizationId = orgData.id;
              console.log('[notice-submit] Resolved organization from postcode:', orgData.name);
            } else {
              // Try councils table as fallback
              const { data: councilData } = await client
                .from('councils')
                .select('id, name')
                .or(`name.ilike.%${adminDistrict}%,name.ilike.%${adminDistrict.replace(/ /g, '-')}%`)
                .limit(1)
                .maybeSingle();

              if (councilData?.id) {
                // Use council ID as organization_id (they may be the same in some setups)
                console.log('[notice-submit] Found council but not org:', councilData.name);
                // Note: council_id and organization_id are separate - this is informational only
              }
            }
          }
        }
      } catch (lookupErr) {
        console.warn('[notice-submit] Council lookup from postcode failed:', lookupErr);
      }
    }

    // FIX C2: If we have organization_id but no department_id, resolve to the default licensing department
    if (resolvedOrganizationId && !resolvedDepartmentId) {
      try {
        console.log('[notice-submit] Looking up default department for org:', resolvedOrganizationId);
        const { data: defaultDept } = await client
          .from('departments')
          .select('id')
          .eq('organization_id', resolvedOrganizationId)
          .eq('type', 'licensing')
          .limit(1)
          .single();

        if (defaultDept?.id) {
          resolvedDepartmentId = defaultDept.id;
          console.log('[notice-submit] Resolved default department:', resolvedDepartmentId);
        }
      } catch (deptErr) {
        console.warn('[notice-submit] Default department lookup failed:', deptErr);
      }
    }

    // Generate notice text using custom template if available
    let generatedDescription = payload.description || null;
    if (resolvedDepartmentId && payload.notice_type && !generatedDescription) {
      try {
        console.log('[notice-submit] Looking for custom template:', { departmentId: resolvedDepartmentId, noticeType: payload.notice_type });
        const { data: templateData } = await client
          .from('templates')
          .select('template_text, name')
          .eq('department_id', resolvedDepartmentId)
          .eq('notice_type', payload.notice_type)
          .not('template_text', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (templateData?.template_text) {
          console.log('[notice-submit] Using custom template:', templateData.name);

          // Debug: Log incoming tokens from client
          console.log('[notice-submit] NATURE_OF_VARIATION debug - incoming tokens:', {
            fromExtrasTokens: payload.extras?.tokens?.NATURE_OF_VARIATION,
            licensableActivities: payload.extras?.tokens?.LICENSABLE_ACTIVITIES,
            activitySchedule: payload.extras?.tokens?.ACTIVITY_SCHEDULE,
          });

          // Helper to check if a value looks like a placeholder that shouldn't be saved
          const isPlaceholderValue = (val: unknown): boolean => {
            if (typeof val !== 'string') return true;
            const trimmed = val.trim();
            if (!trimmed) return true;
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) return true;
            if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) return true;
            if (trimmed.toLowerCase().includes('placeholder')) return true;
            if (trimmed.toLowerCase().includes('missing:')) return true;
            if (trimmed.toLowerCase().includes('select activities')) return true;
            if (trimmed.toLowerCase().includes('auto-generate')) return true;
            return false;
          };

          // Generate tokens from payload
          const tokens: Record<string, string> = {
            APPLICANT_NAME: payload.applicant?.name || '',
            PREMISES_NAME: payload.premises?.name || '',
            PREMISES_ADDRESS: typeof payload.premises?.address === 'string'
              ? payload.premises.address
              : [payload.premises?.address?.line1, payload.premises?.address?.line2, payload.premises?.address?.town, payload.premises?.address?.postcode].filter(Boolean).join(', '),
            APPLICATION_DATE: payload.extras?.applicationDate || new Date().toISOString().split('T')[0],
            DEADLINE_DATE: payload.consultation?.repsDeadline || '',
            PUBLICATION_DATE: new Date().toISOString().split('T')[0],
            AUTHORITY_NAME: payload.extras?.authorityName || '',
            REPRESENTATION_ADDRESS: payload.extras?.representationAddress || '',
            LICENSABLE_ACTIVITIES: payload.extras?.activities?.join(', ') || '',
            ...(payload.extras?.tokens || {}), // Include any additional tokens from form
          };

          // Server-side fix: Ensure NATURE_OF_VARIATION has a valid value for variations
          if (payload.notice_type?.includes('variation')) {
            const currentNov = tokens.NATURE_OF_VARIATION;
            if (isPlaceholderValue(currentNov)) {
              const activities = typeof tokens.LICENSABLE_ACTIVITIES === 'string'
                ? tokens.LICENSABLE_ACTIVITIES.trim()
                : '';
              const schedule = typeof tokens.ACTIVITY_SCHEDULE === 'string'
                ? tokens.ACTIVITY_SCHEDULE.trim()
                : '';

              if (activities && !isPlaceholderValue(activities)) {
                tokens.NATURE_OF_VARIATION = `To vary the licence to authorise: ${activities}`;
                console.log('[notice-submit] Server-side fix: Generated NATURE_OF_VARIATION from activities');
              } else if (schedule && !isPlaceholderValue(schedule)) {
                tokens.NATURE_OF_VARIATION = `To vary the conditions of the premises licence to permit the following: ${schedule.split('\n')[0]}`;
                console.log('[notice-submit] Server-side fix: Generated NATURE_OF_VARIATION from schedule');
              } else {
                tokens.NATURE_OF_VARIATION = 'Vary the conditions of the premises licence as described in the application';
                console.log('[notice-submit] Server-side fix: Using default NATURE_OF_VARIATION');
              }
            }
          }

          // Debug: Log final token value after merge
          console.log('[notice-submit] Final NATURE_OF_VARIATION token:', tokens.NATURE_OF_VARIATION || '(empty)');

          // Alias NATURE_OF_VARIATION -> VARIATION_DESCRIPTION for templates that use the alternative token
          // This mirrors the frontend tokenizer behavior (see src/next/publish/templates/tokenizer.ts:165)
          if (tokens.NATURE_OF_VARIATION && !tokens.VARIATION_DESCRIPTION) {
            tokens.VARIATION_DESCRIPTION = tokens.NATURE_OF_VARIATION;
            console.log('[notice-submit] Added VARIATION_DESCRIPTION alias:', tokens.VARIATION_DESCRIPTION);
          }

          // Replace {{TOKEN}} placeholders with values
          // Note: Empty strings are valid values and should replace the placeholder
          // Only keep the raw {{TOKEN}} if the token is completely undefined
          generatedDescription = templateData.template_text.replace(
            /\{\{([A-Z_]+)\}\}/g,
            (match: string, token: string) => {
              const value = tokens[token];
              // Use value if it exists (including empty string), otherwise keep placeholder
              return value !== undefined ? value : match;
            }
          );
          console.log('[notice-submit] Generated description from template');
        }
      } catch (templateErr) {
        console.warn('[notice-submit] Template lookup failed (using default):', templateErr);
      }
    }

    // Prepare data with geocoding and organization context
    const noticeData = {
      ...payload,
      status: 'published', // Auto-publish instead of 'submitted'
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      latitude,
      longitude,
      location: latitude && longitude
        ? `POINT(${longitude} ${latitude})`
        : null,
      // Set resolved organization/department IDs
      organization_id: resolvedOrganizationId,
      department_id: resolvedDepartmentId,
      // Use generated description if available
      description: generatedDescription || payload.description || null,
    };

    // Add postcode to premises if extracted
    if (postcode && noticeData.premises) {
      noticeData.premises = {
        ...noticeData.premises,
        postcode: postcode.replace(/^(.+?)(\d[A-Z]{2})$/, '$1 $2'), // Format with space
      };
    }

    // If we have a draft ID, try to update the existing draft
    if (payload.id) {
      // First check if the draft exists
      const { data: existing } = await client
        .from('notices')
        .select('id')
        .eq('id', payload.id)
        .maybeSingle();

      if (existing) {
        // Update existing draft
        const { data, error } = await client
          .from('notices')
          .update(noticeData)
          .eq('id', payload.id)
          .select('id')
          .single();

        if (error) {
          console.error('❌ [notice-submit] ERROR: Supabase update failed');
          console.error('   - Error code:', error.code);
          console.error('   - Error message:', error.message);
          console.error('   - Error details:', error.details);
          console.error('   - Notice ID:', payload.id);
          return res.status(500).json({ error: 'Failed to submit notice', details: error.message });
        }

        // Fire webhook for notice.published (async, don't block response)
        if (resolvedOrganizationId) {
          sendWebhookEvent(resolvedOrganizationId, 'notice.published', data.id, {
            notice_id: data.id,
            notice_type: noticeData.notice_type,
            applicant: noticeData.applicant,
            premises: noticeData.premises,
          }).catch(err => console.error('[notice-submit] Webhook error:', err));
        }

        return res.status(200).json({ id: data.id, success: true });
      }
      // If draft doesn't exist, fall through to create new
    }

    // Create new notice (either no ID provided or ID doesn't exist)
    const { id, ...dataWithoutId } = noticeData;
    const { data, error } = await client
      .from('notices')
      .insert(dataWithoutId)
      .select('id')
      .single();

    if (error) {
      console.error('❌ [notice-submit] ERROR: Supabase insert failed');
      console.error('   - Error code:', error.code);
      console.error('   - Error message:', error.message);
      console.error('   - Error details:', error.details);
      console.error('   - Notice type:', noticeData.notice_type);
      console.error('   - Applicant:', noticeData.applicant?.name);
      return res.status(500).json({ error: 'Failed to submit notice', details: error.message });
    }

    // Fire webhook for notice.published (async, don't block response)
    if (resolvedOrganizationId) {
      sendWebhookEvent(resolvedOrganizationId, 'notice.published', data.id, {
        notice_id: data.id,
        notice_type: noticeData.notice_type,
        applicant: noticeData.applicant,
        premises: noticeData.premises,
      }).catch(err => console.error('[notice-submit] Webhook error:', err));
    }

    // Send confirmation email if contact_email is provided
    console.log('[notice-submit] Checking for contact_email:', noticeData.contact_email);
    if (noticeData.contact_email) {
      console.log('[notice-submit] Sending confirmation email to:', noticeData.contact_email);
      try {
        const { sendNoticeConfirmation } = await import('../services/email');

        // Get notice type label using global mapping
        const noticeTypeLabel = getNoticeTypeLabel(noticeData.notice_type);

        // Generate view URL
        const baseUrl = process.env.VITE_SUPABASE_URL?.replace('.getServiceSupabaseClient().co', '') || 'http://localhost:5173';
        const viewUrl = `${baseUrl}/notices/${data.id}`;

        // Format premises address as string
        const formatAddress = (addr: any): string => {
          if (!addr) return '';
          if (typeof addr === 'string') return addr;
          if (typeof addr === 'object') {
            return [addr.line1, addr.line2, addr.town, addr.postcode]
              .filter(Boolean)
              .join(', ');
          }
          return String(addr);
        };

        await sendNoticeConfirmation(noticeData.contact_email, {
          noticeId: data.id,
          noticeType: noticeTypeLabel,
          premisesName: noticeData.premises?.name,
          premisesAddress: formatAddress(noticeData.premises?.address),
          applicantName: noticeData.applicant?.name || noticeData.applicant?.fullName,
          noticeText: '', // We'll generate PDF later
          viewUrl,
          trackingUrl: data.tracking_token ? `${baseUrl}/track?token=${data.tracking_token}` : undefined,
        });

        console.log('[notice-submit] Confirmation email sent to:', noticeData.contact_email);
      } catch (emailError) {
        // Log error but don't fail the request if email fails
        console.error('[notice-submit] Failed to send confirmation email:', emailError);
      }
    }

    return res.status(201).json({ id: data.id, success: true });
  } catch (error: any) {
    console.error('❌ [notice-submit] UNEXPECTED SERVER ERROR');
    console.error('   - Error type:', error.constructor.name);
    console.error('   - Error message:', error.message);
    console.error('   - Error stack:', error.stack);
    console.error('   - Request body:', JSON.stringify(req.body, null, 2));
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Map filter category names to database notice types
function mapCategoryToNoticeTypes(category: string): string[] | null {
  const categoryMap: Record<string, string[]> = {
    'Licensing Act 2003': [
      'licensing-premises-new',
      'licensing-premises-variation',
      'licensing-premises-review'
    ],
    'Gambling Act 2005': [
      'gambling-premises'
    ],
    'Goods Vehicle Operator\'s Licence': [
      'gvol-new',
      'gvol-variation'
    ],
    'Planning': [
      'planning-application',
      'planning-major-application',
      'planning-listed-building',
      'planning-conservation-area'
    ],
    'Probate': [
      'probate'
    ],
    'Club Premises Certificate': [
      'club-premises-certificate'
    ],
    'Traffic Order': [
      'tro-permanent',
      'tro-temporary',
      'tro-experimental'
    ]
  };

  return categoryMap[category] || null;
}

router.get('/notices/search', optionalAuth, async (req, res) => {
  try {
    console.log('[notice-search] Incoming query params:', req.query);

    const q = String(req.query.q ?? '').trim();
    const postcodeParam = String(req.query.postcode ?? '').trim();
    const councilParam = String((req.query.councilId ?? req.query.council) ?? '').trim();
    const typeParam = String(req.query.type ?? '').trim();
    const statusParam = String(req.query.status ?? '').trim();
    const startParam = String(req.query.start ?? '').trim();
    const endParam = String(req.query.end ?? '').trim();
    const trafficAreaParam = String(req.query.traffic_area ?? '').trim();
    const sortParam = String(req.query.sort ?? '').trim() || undefined;
    const limitParam = parseLimit(req.query.limit);
    const radiusKmParam = Number(req.query.radius_km);
    const latFromQuery = parseLatitude(req.query.lat);
    const lngFromQuery = parseLongitude(req.query.lng);
    const bboxParamRaw = Array.isArray(req.query.bbox) ? req.query.bbox[0] : req.query.bbox;
    const bbox = typeof bboxParamRaw === 'string' ? parseBoundingBox(bboxParamRaw) : null;
    const zoomParam = Number(req.query.zoom);
    const clusterParam = parseBoolean(req.query.cluster);

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const client = getServiceSupabaseClient();
    const selectColumns = '*';

    const postcodeFromParam = postcodeParam ? normalisePostcode(postcodeParam) : null;
    const postcodeFromQuery = q ? normalisePostcode(q) : null;
    const effectivePostcode = postcodeFromParam ?? postcodeFromQuery;
    const radiusMeters = Number.isFinite(radiusKmParam) && radiusKmParam > 0 ? Math.max(1, Math.floor(radiusKmParam * 1000)) : null;

    let radiusCoordinates: { latitude: number; longitude: number } | null = null;
    if (radiusMeters && latFromQuery !== null && lngFromQuery !== null) {
      radiusCoordinates = { latitude: latFromQuery, longitude: lngFromQuery };
    } else if (radiusMeters && effectivePostcode?.full) {
      try {
        const coords = await ensurePostcodeCoordinates(effectivePostcode.full);
        if (coords) {
          radiusCoordinates = { latitude: coords.latitude, longitude: coords.longitude };
        }
      } catch (error) {
        console.warn('[notice-search] postcode radius geocode failed', error);
      }
    }

    const radiusSearchReady = Boolean(radiusMeters && radiusCoordinates);

    const applyQueryFilters = (queryBuilder: any) => {
      let qb = queryBuilder;
      console.log('[notice-search] applyQueryFilters called with q:', q, 'effectivePostcode:', effectivePostcode);

      if (effectivePostcode) {
        const outwardPattern = `${effectivePostcode.outward}%`;
        // Search in both possible postcode locations
        console.log('[notice-search] Applying postcode filter:', outwardPattern);
        qb = qb.or(`premises->>postcode.ilike.${outwardPattern},premises_address->>postcode.ilike.${outwardPattern}`);
      }

      if (typeParam) {
        // Try to map category name to notice types
        const noticeTypes = mapCategoryToNoticeTypes(typeParam);
        console.log('[notice-search] typeParam:', typeParam, '-> noticeTypes:', noticeTypes);
        if (noticeTypes && noticeTypes.length > 0) {
          // Use .in() for multiple notice types
          console.log('[notice-search] Applying notice_type IN filter with:', noticeTypes);
          qb = qb.in('notice_type', noticeTypes);
        } else {
          // Fallback to exact match if no mapping exists
          console.log('[notice-search] Applying notice_type EQ filter with:', typeParam);
          qb = qb.eq('notice_type', typeParam);
        }
      }

      if (statusParam) {
        qb = qb.eq('status', statusParam);
      }

      if (councilParam) {
        qb = qb.eq('extras->>councilId', councilParam);
      }

      if (trafficAreaParam) {
        qb = qb.eq('extras->>trafficArea', trafficAreaParam);
      }

      if (startParam) {
        qb = qb.gte('created_at', startParam);
      }

      if (endParam) {
        qb = qb.lte('created_at', endParam);
      }

      // Text search: search across multiple fields if query provided
      // This runs regardless of whether a postcode was also detected
      if (q) {
        // Search for the full query text across all fields
        const filters = [
          buildIlikeFilter('notice_type', q),
          buildIlikeFilter('premises->>name', q),
          buildIlikeFilter('premises->>address', q), // Simple string address field
          buildIlikeFilter('premises->address->>line1', q),
          buildIlikeFilter('premises->address->>line2', q),
          buildIlikeFilter('premises->address->>town', q),
          buildIlikeFilter('premises->address->>postcode', q),
          buildIlikeFilter('premises_address->>line1', q),
          buildIlikeFilter('premises_address->>line2', q),
          buildIlikeFilter('premises_address->>town', q),
          buildIlikeFilter('premises_address->>postcode', q),
          buildIlikeFilter('extras->>applicantDisplayName', q),
          buildIlikeFilter('extras->tokens->>PREMISES_NAME', q),
          buildIlikeFilter('extras->tokens->>PREMISES_ADDRESS', q),
          buildIlikeFilter('extras->tokens->>APPLICANT_NAME', q),
          buildIlikeFilter('applicant->>name', q),
          buildIlikeFilter('applicant->>fullName', q),
        ].filter(Boolean) as string[];

        if (filters.length) {
          console.log(`[notice-search] Applying text search with ${filters.length} fields for query: "${q}"`);
          qb = qb.or(filters.join(','));
        }
      }

      return qb;
    };

    const { column: sortColumn, direction } = parseSort(sortParam);

    let rows: any[] = [];
    if (bbox && radiusSearchReady && radiusCoordinates) {
      // When both bbox and radius are present, use radius search and filter by bbox client-side
      // This allows the radius dropdown to work even when the map is showing
      console.log('[notice-search] Using radius search (with bbox):', {
        lng: radiusCoordinates.longitude,
        lat: radiusCoordinates.latitude,
        radius_meters: radiusMeters,
        bbox
      });
      const { data, error } = await client.rpc('get_nearby_notices', {
        lng: radiusCoordinates.longitude,
        lat: radiusCoordinates.latitude,
        radius_meters: radiusMeters,
      });

      if (error) {
        console.error('[notice-search] Supabase radius RPC error:', error);
        return res.status(500).json({ error: error.message });
      }

      rows = Array.isArray(data) ? data : [];
      console.log('[notice-search] Radius RPC (with bbox) returned', rows.length, 'rows');
    } else if (bbox) {
      const [south, west, north, east] = bbox;
      const { data, error } = await client.rpc('get_bbox_notices', {
        min_lat: south,
        min_lng: west,
        max_lat: north,
        max_lng: east,
      });

      if (error) {
        console.error('[notice-search] Supabase bbox RPC error:', error);
        return res.status(500).json({ error: error.message });
      }

      rows = Array.isArray(data) ? data : [];
    } else if (radiusSearchReady && radiusCoordinates) {
      console.log('[notice-search] Using radius search:', {
        lng: radiusCoordinates.longitude,
        lat: radiusCoordinates.latitude,
        radius_meters: radiusMeters
      });
      const { data, error } = await client.rpc('get_nearby_notices', {
        lng: radiusCoordinates.longitude,
        lat: radiusCoordinates.latitude,
        radius_meters: radiusMeters,
      });

      if (error) {
        console.error('[notice-search] Supabase radius RPC error:', error);
        return res.status(500).json({ error: error.message });
      }

      rows = Array.isArray(data) ? data : [];
      console.log('[notice-search] Radius RPC returned', rows.length, 'rows');
    } else {
      const queryBuilder = applyQueryFilters(
        client.from('notices').select(selectColumns).limit(limitParam)
      );

      const response = await queryBuilder.order(sortColumn, {
        ascending: direction === 'asc',
        nullsFirst: direction === 'asc',
      });

      if (response?.error) {
        console.error('[notice-search] Supabase error:', response.error);
        return res.status(500).json({ error: response.error.message });
      }

      rows = Array.isArray(response.data) ? response.data : [];
    }

    const filteredRows = rows.filter((row: any) => {
      // Don't apply bbox filter if we're using radius search - the radius is more important
      // and the bbox is just for map display, not for limiting results
      if (bbox && !radiusSearchReady) {
        const [south, west, north, east] = bbox;
        const lat = extractLatitude(row);
        const lng = extractLongitude(row);

        if (lat === null || lng === null) {
          return false;
        }

        if (lat < south || lat > north || lng < west || lng > east) {
          return false;
        }
      }

      if (statusParam && row.status !== statusParam) {
        return false;
      }

      if (typeParam) {
        // Use the same mapping logic for client-side filtering
        const noticeTypes = mapCategoryToNoticeTypes(typeParam);
        if (noticeTypes && noticeTypes.length > 0) {
          // Check if row's notice_type is in the mapped array
          if (!noticeTypes.includes(row.notice_type)) {
            return false;
          }
        } else {
          // Fallback to exact match
          if (row.notice_type !== typeParam) {
            return false;
          }
        }
      }

      if (councilParam) {
        const rowCouncil = firstNonEmptyString(row?.organization_id, row?.extras?.councilId, row?.council_id, row?.councilId);
        if (rowCouncil !== councilParam) {
          return false;
        }
      }

      // Only filter by postcode if we're NOT doing a radius search
      // When using radius, the geographic area is already defined by the radius
      if (!radiusSearchReady) {
        const rowPostcode = extractPostcode(row);
        if (effectivePostcode && (!rowPostcode || !rowPostcode.startsWith(effectivePostcode.outward))) {
          return false;
        }
      }

      if (startParam) {
        const createdTimestamp = getCreatedTimestamp(row);
        const startTime = toTimestamp(startParam);
        if (Number.isFinite(startTime) && (!Number.isFinite(createdTimestamp) || createdTimestamp < startTime)) {
          return false;
        }
      }

      if (endParam) {
        const createdTimestamp = getCreatedTimestamp(row);
        const endTime = toTimestamp(endParam);
        if (Number.isFinite(endTime) && (!Number.isFinite(createdTimestamp) || createdTimestamp > endTime)) {
          return false;
        }
      }

      if (q && !postcodeFromQuery) {
        const lowerQ = q.toLowerCase();
        const premisesAddress = extractPremisesAddress(row);
        const premisesName = extractPremisesName(row);
        const applicantDisplayName = extractApplicantDisplayName(row);
        const haystack = [
          typeof row.notice_type === 'string' ? row.notice_type.toLowerCase() : '',
          premisesName ? premisesName.toLowerCase() : '',
          premisesAddress ? premisesAddress.toLowerCase() : '',
          applicantDisplayName ? applicantDisplayName.toLowerCase() : '',
          typeof row.trading_name === 'string' ? row.trading_name.toLowerCase() : '',
          typeof row.notice_text === 'string' ? row.notice_text.toLowerCase() : '',
        ];

        if (!haystack.some((value) => value.includes(lowerQ))) {
          return false;
        }
      }

      return true;
    });

    let sortedRows: any[];

    // Distance-based sorting when user requests it and coordinates are available
    if (sortColumn === 'distance' && radiusCoordinates) {
      sortedRows = [...filteredRows].sort((a, b) => {
        const aLat = extractLatitude(a);
        const aLon = extractLongitude(a);
        const bLat = extractLatitude(b);
        const bLon = extractLongitude(b);

        // Calculate distance using Haversine formula
        const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
          const R = 6371; // Earth's radius in km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                   Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };

        const aHasCoords = typeof aLat === 'number' && typeof aLon === 'number';
        const bHasCoords = typeof bLat === 'number' && typeof bLon === 'number';

        if (!aHasCoords && !bHasCoords) return 0;
        if (!aHasCoords) return 1; // Push items without coords to end
        if (!bHasCoords) return -1;

        const aDist = calculateDistance(radiusCoordinates.latitude, radiusCoordinates.longitude, aLat, aLon);
        const bDist = calculateDistance(radiusCoordinates.latitude, radiusCoordinates.longitude, bLat, bLon);

        return direction === 'asc' ? aDist - bDist : bDist - aDist;
      });
    } else if (bbox) {
      sortedRows = [...filteredRows].sort((a, b) => {
        const aPublished = getPublishedTimestamp(a);
        const bPublished = getPublishedTimestamp(b);
        const aHasPublished = Number.isFinite(aPublished);
        const bHasPublished = Number.isFinite(bPublished);

        if (aHasPublished && bHasPublished && aPublished !== bPublished) {
          return bPublished - aPublished;
        }
        if (aHasPublished && !bHasPublished) return -1;
        if (!aHasPublished && bHasPublished) return 1;

        const aCreated = getCreatedTimestamp(a);
        const bCreated = getCreatedTimestamp(b);
        const aHasCreated = Number.isFinite(aCreated);
        const bHasCreated = Number.isFinite(bCreated);

        if (aHasCreated && bHasCreated && aCreated !== bCreated) {
          return bCreated - aCreated;
        }
        if (aHasCreated && !bHasCreated) return -1;
        if (!aHasCreated && bHasCreated) return 1;

        return 0;
      });
    } else {
      sortedRows = sortRowsBy(filteredRows, sortColumn, direction);
    }

    // Don't apply limit for radius search or bbox - show all results
    const limitedRows = (bbox || radiusSearchReady) ? sortedRows : sortedRows.slice(0, limitParam);

    // Deduplicate by notice ID to prevent duplicate entries
    const seenIds = new Set<string>();
    const duplicateIds: string[] = [];
    const deduplicatedRows = limitedRows.filter((row: any) => {
      if (!row.id) {
        return true; // Keep rows without IDs for now
      }
      if (seenIds.has(row.id)) {
        duplicateIds.push(row.id);
        return false;
      }
      seenIds.add(row.id);
      return true;
    });

    if (duplicateIds.length > 0) {
      console.log(`[notice-search] Removed ${duplicateIds.length} duplicate notices:`, [...new Set(duplicateIds)].slice(0, 5));
    }

    const items = deduplicatedRows.map((row: any) => {
      const premises = row?.premises && typeof row.premises === 'object' ? row.premises : {};
      const consultation = row?.consultation && typeof row.consultation === 'object' ? row.consultation : {};
      const publication = row?.publication && typeof row.publication === 'object' ? row.publication : {};
      const extras = row?.extras && typeof row.extras === 'object' ? row.extras : {};

      const latitude = extractLatitude(row);
      const longitude = extractLongitude(row);

      // Calculate distance if we have search coordinates
      let distance: number | null = null;
      if (radiusCoordinates && typeof latitude === 'number' && typeof longitude === 'number') {
        const R = 6371; // Earth's radius in km
        const dLat = (latitude - radiusCoordinates.latitude) * Math.PI / 180;
        const dLon = (longitude - radiusCoordinates.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(radiusCoordinates.latitude * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }

      return {
        id: row.id,
        noticeType: getNoticeTypeLabel(row.notice_type),
        status: row.status,
        contact_email: row.contact_email,
        premisesName: extractPremisesName(row),
        premisesAddress: extractPremisesAddress(row),
        premisesPostcode: extractPostcode(row),
        repsDeadline: extractRepsDeadline(row),
        applicationDate: extractDateLike(consultation.applicationDate, row?.application_date),
        publicationDate: extractPublicationDate(row),
        newspaper: firstNonEmptyString(publication.newspaper, row?.newspaper),
        viewUrl: firstNonEmptyString(extras.viewUrl, row?.view_url),
        latitude,
        longitude,
        distance,
      };
    });

    console.log('[notice-search] Result count:', items.length, {
      postcode: effectivePostcode?.full || null,
      radiusKm: radiusMeters ? radiusMeters / 1000 : null,
      coordinates: radiusCoordinates,
      bbox,
      zoom: Number.isFinite(zoomParam) ? zoomParam : null,
      cluster: clusterParam,
    });

    return res.json({
      items,
      query: q,
      postcode: effectivePostcode?.full || null,
      bbox,
      zoom: Number.isFinite(zoomParam) ? zoomParam : null,
      radiusKm: radiusMeters ? radiusMeters / 1000 : null,
    });
  } catch (error: any) {
    console.error('❌ [notice-search] Unexpected server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /notices/:id - Get a single notice by ID
router.get('/notices/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid notice ID' });
  }

  const supabase = getServiceSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*, councils(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[notice-get] Supabase error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Notice not found' });
      }
      return res.status(500).json({ error: 'Failed to fetch notice' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    const row = data;
    const premises = row?.premises && typeof row.premises === 'object' ? row.premises : {};
    const consultation = row?.consultation && typeof row.consultation === 'object' ? row.consultation : {};
    const publication = row?.publication && typeof row.publication === 'object' ? row.publication : {};
    const extras = row?.extras && typeof row.extras === 'object' ? row.extras : {};
    const applicant = row?.applicant && typeof row.applicant === 'object' ? row.applicant : {};
    const licensing = row?.licensing && typeof row.licensing === 'object' ? row.licensing : {};

    const latitude = extractLatitude(row);
    const longitude = extractLongitude(row);

    const notice = {
      id: row.id,
      noticeType: getNoticeTypeLabel(row.notice_type),
      status: row.status,
      premisesName: extractPremisesName(row),
      premisesAddress: extractPremisesAddress(row),
      premisesPostcode: extractPostcode(row),
      repsDeadline: extractRepsDeadline(row),
      applicationDate: extractDateLike(consultation.applicationDate, row?.application_date),
      publicationDate: extractPublicationDate(row),
      newspaper: firstNonEmptyString(publication.newspaper, row?.newspaper),
      viewUrl: firstNonEmptyString(extras.viewUrl, row?.view_url),
      latitude,
      longitude,
      // Council/organization information (for representations)
      council_id: row.organization_id,
      councils: row.councils || null,
      // Additional detailed fields
      applicantName: firstNonEmptyString(applicant.name, consultation.applicantName, licensing.applicantName),
      applicantAddress: applicant.address || consultation.applicantAddress || null,
      applicantEmail: firstNonEmptyString(applicant.contactEmail, extras.contactEmail),
      dpsName: extras.dpsName || licensing.dpsName || null,
      dpsLicenceNumber: extras.dpsLicenceNumber || licensing.dpsLicenceNumber || null,
      applicationReference: extras.applicationReference || null,
      licensingActivities: extras.activities || licensing.activities || [],
      openingHours: extras.hours || licensing.hours || null,
      description: row.preview_text || row.description || generateNoticeText(row),
      contactEmail: row.contact_email || null,
      rawData: {
        premises,
        consultation,
        publication,
        extras,
        applicant,
        licensing,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return res.json(notice);
  } catch (error: any) {
    console.error('[notice-get] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /notices/:id/representations - Get representations for a notice
router.get('/notices/:id/representations', optionalAuth, async (req, res) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid notice ID' });
  }

  const supabase = getServiceSupabaseClient();

  try {
    // Fetch representations using service role to bypass RLS
    const { data: representations, error } = await supabase
      .from('representations')
      .select('*')
      .eq('notice_id', id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('[representations-get] Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch representations' });
    }

    // Transform to match expected format
    const formattedReps = (representations || []).map((rep: any) => ({
      id: rep.id,
      submitted_at: rep.submitted_at,
      respondent_name: rep.representor_name,
      respondent_email: rep.representor_email,
      representation_text: rep.representation_text,
      stance: rep.type, // 'objection', 'support', 'comment'
      is_read: false, // Could be enhanced with read tracking
      grounds: rep.grounds || [],
      address: rep.representor_address || null,
      reference_number: rep.reference_number || null,
    }));

    return res.json({ representations: formattedReps });
  } catch (error: any) {
    console.error('[representations-get] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /notices/:id/representations - Submit a representation for a notice
router.post('/notices/:id/representations', async (req, res) => {
  const { id } = req.params;
  const {
    type,
    representor_name,
    representor_email,
    representor_phone,
    representor_address,
    grounds,
    representation_text,
    is_anonymous,
    reference_number
  } = req.body;

  // Validate required fields
  if (!id || !representation_text || !type) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: 'Notice ID, representation text, and type are required'
    });
  }

  // Validate email if provided (required for non-anonymous)
  if (!is_anonymous && !representor_email) {
    return res.status(400).json({
      error: 'Email is required for non-anonymous submissions'
    });
  }

  try {
    const supabase = getServiceSupabaseClient();

    // Check if notice exists and get details for email
    const { data: notice, error: noticeError } = await supabase
      .from('notices')
      .select('id, reps_deadline, notice_type, premises, applicant')
      .eq('id', id)
      .single();

    if (noticeError || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Check if deadline has passed
    if (notice.reps_deadline && new Date(notice.reps_deadline) < new Date()) {
      return res.status(400).json({
        error: 'Deadline passed',
        details: 'The deadline for submitting representations has passed'
      });
    }

    // Generate reference number if not provided
    const refNumber = reference_number || `REP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create representation
    const { data: representation, error: repError } = await supabase
      .from('representations')
      .insert({
        notice_id: id,
        type: type,
        representor_name: is_anonymous ? 'Anonymous' : representor_name,
        representor_email: representor_email,
        representor_phone: representor_phone,
        representor_address: is_anonymous ? null : representor_address,
        grounds: grounds,
        representation_text: representation_text,
        submitted_at: new Date().toISOString(),
        is_anonymous: is_anonymous || false,
        reference_number: refNumber
      })
      .select()
      .single();

    if (repError) {
      console.error('[rep-submit] Database error:', repError);
      return res.status(500).json({ error: 'Failed to submit representation' });
    }

    console.log(`[rep-submit] Successfully submitted representation ${refNumber} for notice ${id}`);

    // Send confirmation email if email provided
    if (representor_email && !is_anonymous) {
      console.log(`[rep-submit] Sending confirmation email to ${representor_email}`);
      try {
        const { sendRepresentationConfirmation } = await import('../services/email');

        // Map representation type to stance
        const stanceMap: Record<string, 'support' | 'object' | 'comment'> = {
          'support': 'support',
          'object': 'object',
          'objection': 'object',
          'comment': 'comment',
          'neutral': 'comment'
        };

        const noticeUrl = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/notices/${id}`;

        // Format deadline if available
        let formattedDeadline: string | undefined;
        if (notice.reps_deadline) {
          const deadline = new Date(notice.reps_deadline);
          formattedDeadline = deadline.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        }

        // Build premises address string
        let premisesAddress: string | undefined;
        if (notice.premises?.address) {
          const addr = notice.premises.address;
          const parts = [
            addr.street_address || addr.line_1,
            addr.line_2,
            addr.line_3,
            addr.town || addr.city,
            addr.county,
            addr.postcode
          ].filter(Boolean);
          premisesAddress = parts.join(', ');
        } else if (notice.premises?.postcode) {
          premisesAddress = notice.premises.postcode;
        }

        await sendRepresentationConfirmation({
          representationId: refNumber,
          noticeType: getNoticeTypeLabel(notice.notice_type),
          premisesName: notice.premises?.name,
          premisesAddress,
          stance: stanceMap[type.toLowerCase()] || 'comment',
          submitterName: representor_name || 'Anonymous',
          submitterEmail: representor_email,
          deadline: formattedDeadline,
          noticeUrl
        });

        console.log(`[rep-submit] Confirmation email sent to ${representor_email}`);
      } catch (emailError) {
        // Log error but don't fail the request
        console.error('[rep-submit] Failed to send confirmation email:', emailError);
      }
    }

    return res.status(201).json({
      success: true,
      representation_id: representation.id,
      reference_number: refNumber,
      message: 'Your representation has been submitted successfully'
    });
  } catch (error: any) {
    console.error('[rep-submit] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /notices/:id/representations/:repId/mark-read - Mark a representation as read
router.post('/notices/:id/representations/:repId/mark-read', optionalAuth, async (req, res) => {
  const { id, repId } = req.params;
  const { userId } = req.body;

  if (!id || !repId) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  

  try {
    // For now, just return success
    // In a full implementation, you'd store read status in a separate table
    console.log(`[rep-mark-read] User ${userId} marked representation ${repId} as read for notice ${id}`);

    return res.json({ success: true, is_read: true });
  } catch (error: any) {
    console.error('[rep-mark-read] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /notices/:id/view - Track view for a notice
router.post('/notices/:id/view', async (req, res) => {
  const { id } = req.params;
  const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';
  const referrer = req.headers['referer'] || req.headers['referrer'] || '';

  if (!id) {
    return res.status(400).json({ error: 'Notice ID is required' });
  }

  const supabase = getServiceSupabaseClient();

  try {
    // Check if notice exists and get current view count
    const { data: notice, error: noticeError } = await supabase
      .from('notices')
      .select('id, view_count')
      .eq('id', id)
      .single();

    if (noticeError || !notice) {
      console.error('[view-track] Notice not found:', noticeError);
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Try to record the view (will fail silently if duplicate IP)
    const { error: viewError } = await supabase
      .from('notice_views')
      .insert({
        notice_id: id,
        viewer_ip: clientIp,
        user_agent: userAgent,
        referrer: referrer
      });

    // If view was recorded (not duplicate), the trigger will increment view_count
    // Get updated view count
    const { data: updatedNotice, error: updateError } = await supabase
      .from('notices')
      .select('view_count')
      .eq('id', id)
      .single();

    if (updateError) {
      console.error('[view-track] Failed to get updated view count:', updateError);
      return res.json({
        success: true,
        view_count: notice.view_count || 0,
        is_new_view: !viewError
      });
    }

    return res.json({
      success: true,
      view_count: updatedNotice?.view_count || notice.view_count || 0,
      is_new_view: !viewError // true if view was recorded, false if duplicate
    });

  } catch (error: any) {
    console.error('[view-track] Unexpected error:', error);
    return res.status(500).json({ error: 'Failed to track view' });
  }
});

export default router;
