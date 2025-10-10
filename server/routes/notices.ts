import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { getSupa, resolveCouncilId } from '../services/councils';
import { z } from 'zod';
import { ensurePostcodeCoordinates, normalisePostcode as geocodeNormalisePostcode } from '../lib/geocode';
import PgBoss from 'pg-boss';

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
    if (column === 'created_at' || column === 'updated_at') {
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

function extractPremisesAddress(row: any): string | null {
  if (typeof row?.premises?.address === 'string') {
    const trimmed = row.premises.address.trim();
    if (trimmed) return trimmed;
  }

  const premisesAddress = row?.premises_address;
  if (typeof premisesAddress === 'string') {
    const trimmed = premisesAddress.trim();
    if (trimmed) return trimmed;
  }

  if (premisesAddress && typeof premisesAddress === 'object' && !Array.isArray(premisesAddress)) {
    const segments = ['line1', 'line2', 'town', 'postcode']
      .map((key) => (typeof premisesAddress?.[key] === 'string' ? premisesAddress[key].trim() : ''))
      .filter(Boolean);
    if (segments.length) {
      return segments.join(', ');
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

const router = Router();

// Minimal pg-boss publisher (best-effort)
let _boss: PgBoss | null = null;
async function getBoss(): Promise<PgBoss | null> {
  if (_boss) return _boss;
  const url =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    '';
  if (!url) return null;
  try {
    const boss = new PgBoss({ connectionString: url });
    await boss.start();
    _boss = boss;
    return boss;
  } catch (e) {
    console.warn('[queue] boss start failed', e);
    return null;
  }
}

// Lightweight pg pool for direct SQL when needed
let _pool: Pool | null = null;
async function getPgPool(): Promise<Pool | null> {
  if (_pool) return _pool;
  const url =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    '';
  if (!url) return null;
  try {
    _pool = new Pool({ connectionString: url, max: 4 });
    // Test connection
    await _pool.query('select 1');
    return _pool;
  } catch (e) {
    console.warn('[pg] pool init failed', e);
    return null;
  }
}

type DraftNoticeAddress = {
  line1?: string;
  line2?: string;
  town?: string;
  postcode?: string;
  uprn?: string;
};

// Config healthcheck for notices submission
router.get('/notices/config', (req, res) => {
  const missing: string[] = [];
  if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return res.status(500).json({ ok: false, code: 'CONFIG', missing });
  return res.json({ ok: true });
});

router.get('/councils/health', async (_req, res) => {
  const supa = getSupa();
  if (!supa) return res.status(500).json({ ok: false, code: 'CONFIG', missing: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] });
  const { data, error } = await supa.from('councils').select('id').limit(1);
  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true, count: Array.isArray(data) ? data.length : 0 });
});

// Councils autocomplete (simple name search)
router.get('/councils', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ items: [] });

    const supa = getSupa();
    if (!supa) return res.status(500).json({ ok: false, code: 'CONFIG', missing: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] });

    const { data, error } = await supa
      .from('councils')
      .select('id,name,slug,region')
      .ilike('name', `%${q}%`)
      .limit(10);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ items: data });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: 'Unexpected error' });
  }
});

// Submit a notice (finalise after payment)
router.post('/notices', async (req, res) => {
  try {
    const body = req.body || {};
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return res.status(500).json({ code: 'CONFIG', message: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' });
    }

    const client = createClient(url, key);

    // Validate minimal required payload
    const noticeType = String(body.notice_type || '').trim();
    const previewText = String(body.preview_text || '').trim();
    const applicantName = String(body.applicant_name || '').trim();
    const applicantEmail = String(body.applicant_email || '').trim();
    if (!noticeType || !previewText) {
      return res.status(400).json({ code: 'INVALID', message: 'Missing notice_type or preview_text' });
    }

    const tradingName = String(body.trading_name || '').trim() || null;
    const applicationDate = String(body.application_date || '').slice(0, 10) || null;
    const repsDeadline = String(body.reps_deadline || '').slice(0, 10) || null;
    const region = (body.region || 'england_wales') as any;
    // Resolve council id from provided id or name
    const rawCouncilId = body.council_id ?? null;
    const councilNameFromClient = body?.extras?.council_name ?? null;
    const { id: resolvedCouncilId, name: resolvedCouncilName } = await resolveCouncilId({
      id: typeof rawCouncilId === 'string' ? rawCouncilId : null,
      name: typeof councilNameFromClient === 'string' ? councilNameFromClient : null,
    });
    const premisesAddress = body.premises_address || {};
    const applicationType = (body.application_type || 'grant') as any;

    const upload = body.upload || {};
    const sourceMode = (body.source_mode === 'ocr' ? 'ocr' : 'structured') as 'ocr' | 'structured';
    const ocrText = body.ocr_text ? String(body.ocr_text).slice(0, 20000) : '';
    const fieldsJson = body.structured_fields || {};

    const audit = {
      notice_type: noticeType,
      source_mode: sourceMode,
      upload_ref: upload,
      ocr_text: ocrText,
      fields_json: fieldsJson,
      extras: {
        ...(body.extras || {}),
        trading_name: tradingName,
        application_date: applicationDate,
      },
      council_name_input: typeof councilNameFromClient === 'string' ? councilNameFromClient : null,
      council_name_resolved: resolvedCouncilName || null,
    };

    // Safe enum mapping to avoid DB enum mismatches
    const safeAppType = ['grant', 'variation', 'review'].includes(applicationType) ? applicationType : 'grant';
    const safeRegion = ['england_wales', 'scotland', 'northern_ireland', 'wales', 'england'].includes(region)
      ? region
      : 'england_wales';

    const payload: any = {
      council_id: resolvedCouncilId,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      // Map to existing column in current DB
      premises_address: premisesAddress,
      application_type: safeAppType,
      region: safeRegion,
      reps_deadline: repsDeadline,
      preview_text: previewText,
      audit,
    };

    const { data, error } = await client.from('notices').insert(payload).select('id').single();
    if (error) {
      const message = String((error as any)?.message || 'Insert failed');
      const details = (error as any)?.details || null;
      const pgCode = (error as any)?.code || null;
      const hint = (error as any)?.hint || null;
      const code = /permission denied/i.test(message) ? 'RLS_DENIED' : 'INSERT_FAILED';
      console.error('[notices:submit] Supabase insert failed', { code: pgCode, message, details, hint });
      return res.status(500).json({ code, message, details, hint });
    }

    // Best-effort enqueue jobs (do not block response)
    (async () => {
      try {
        const boss = await getBoss();
        if (!boss) return;
        const pcFromPremises = (payload?.premises_address?.postcode || payload?.premises?.postcode || '').trim();
        await boss.publish('geo:ensure-location', { notice_id: data.id, postcode: pcFromPremises || undefined }, {
          retryLimit: 3,
          retryBackoff: true,
          singletonKey: `geo:${data.id}`,
        } as any);
        if (typeof payload?.audit?.ocr_text === 'string' && payload.audit.ocr_text.trim().length > 0) {
          await boss.publish('text:normalize', { notice_id: data.id }, {
            retryLimit: 2,
            retryBackoff: true,
            singletonKey: `text:${data.id}`,
          } as any);
        }
      } catch (e) {
        console.warn('[queue] publish failed (submit)', e);
      }
    })();
    // SHOW_DRAFTS TEMP: Optionally auto-publish while payments disabled
    // If PUBLISH_IMMEDIATELY=1, publish the newly created notice right away
    let finalStatus: 'draft' | 'published' = 'draft';
    if (process.env.PUBLISH_IMMEDIATELY === '1') {
      try {
        // Attempt to set coordinates if missing and we have a postcode
        let latitude: number | null = null;
        let longitude: number | null = null;
        const postcodeInput =
          (payload as any)?.premises_address?.postcode || (payload as any)?.premises?.postcode || '';
        const formatted = geocodeNormalisePostcode(postcodeInput || '');
        if (formatted) {
          try {
            const coords = await ensurePostcodeCoordinates(formatted);
            if (coords) {
              latitude = coords.latitude;
              longitude = coords.longitude;
            }
          } catch {}
        }

        const patch: any = { status: 'published' };
        if (latitude !== null && longitude !== null) {
          patch.latitude = latitude;
          patch.longitude = longitude;
        }

        const { data: updatedRow, error: upErr } = await client
          .from('notices')
          .update(patch)
          .eq('id', data.id)
          .select('id,status')
          .single();
        if (!upErr) {
          finalStatus = (updatedRow?.status as any) === 'published' ? 'published' : 'draft';
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[notices] auto-published id=${data.id}`);
          }
        }
      } catch {}
    }

    // Return minimal final row including status (non-breaking shape)
    return res.status(201).json({ ok: true, id: data.id, status: finalStatus });
  } catch (error: any) {
    console.error('❌ [notices:submit] Unexpected error', error);
    return res.status(500).json({ code: 'UNEXPECTED', message: error?.message || 'Internal server error' });
  }
});

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

router.post('/notices/draft', async (req, res) => {
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

    const client = createClient(url, key);

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

    // Best-effort enqueue jobs for drafts too
    (async () => {
      try {
        const boss = await getBoss();
        if (!boss) return;
        const pcFromPremises = (payload?.premises?.postcode || '').trim();
        await boss.publish('geo:ensure-location', { notice_id: data.id, postcode: pcFromPremises || undefined }, {
          retryLimit: 3,
          retryBackoff: true,
          singletonKey: `geo:${data.id}`,
        } as any);
      } catch (e) {
        console.warn('[queue] publish failed (draft)', e);
      }
    })();

    return res.status(201).json({ id: data.id });
  } catch (error: any) {
    console.error('❌ [notice-draft] Unexpected server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/notices/search', async (req, res) => {
  try {
    const tStart = Date.now();

    const QuerySchema = z.object({
      q: z.string().optional().transform((v) => (typeof v === 'string' ? v.trim().slice(0, 100) : '')),
      status: z.enum(['published', 'draft', 'submitted', 'all']).optional(),
      // SHOW_DRAFTS TEMP: convenience include_drafts flag
      include_drafts: z
        .preprocess((v) => (typeof v === 'string' ? v.toLowerCase() : v), z.enum(['1', 'true']).optional())
        .optional(),
      council: z.string().optional().transform((v) => (v ? String(v).trim() : '')),
      councilId: z.string().optional().transform((v) => (v ? String(v).trim() : '')),
      type: z.string().optional().transform((v) => (v ? String(v).trim() : '')),
      start: z.string().optional().refine((v) => !v || !Number.isNaN(new Date(v).getTime()), 'Invalid start date'),
      end: z.string().optional().refine((v) => !v || !Number.isNaN(new Date(v).getTime()), 'Invalid end date'),
      postcode: z.string().optional().transform((v) => (v ? String(v).trim() : '')),
      radius_km: z.preprocess((v) => (v === undefined ? undefined : Number(v)), z.number().min(1).max(50)).optional(),
      lat: z.preprocess((v) => (v === undefined ? undefined : Number(v)), z.number()).optional(),
      lng: z.preprocess((v) => (v === undefined ? undefined : Number(v)), z.number()).optional(),
      bbox: z.string().optional().refine((v) => !v || parseBoundingBox(v) !== null, 'Invalid bbox'),
      page: z.preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().min(1).max(200)).optional().default(1),
      limit: z.preprocess((v) => (v === undefined ? 25 : Number(v)), z.number().int().min(1).max(100)).optional().default(25),
      sort: z.enum(['created_at.desc', 'created_at.asc', 'updated_at.desc', 'relevance.desc']).optional(),
      cluster: z.preprocess((v) => (v === undefined ? undefined : String(v)), z.string().optional()),
      zoom: z.preprocess((v) => (v === undefined ? undefined : Number(v)), z.number().optional()),
    });

    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'INVALID_PARAMS', details: (parsed as any).error?.issues || [] });

    const {
      q: qRaw = '',
      status: statusRaw,
      council: councilRaw,
      councilId: councilIdRaw,
      type: typeParam,
      start: startParam = '',
      end: endParam = '',
      postcode: postcodeParamRaw = '',
      radius_km: radiusKmParam,
      lat: latRaw,
      lng: lngRaw,
      bbox: bboxRaw,
      page: pageParam = 1,
      limit: limitParam = 25,
      sort: sortParamRaw,
      cluster: clusterRaw,
      zoom: zoomRaw,
      include_drafts: includeDraftsRaw,
    } = parsed.data;

    const q = qRaw || '';
    const councilParam = councilIdRaw || councilRaw || '';
    const bbox = bboxRaw ? parseBoundingBox(bboxRaw) : null;
    const zoomParam = Number.isFinite(zoomRaw as any) ? (zoomRaw as number) : NaN;
    const clusterParam = parseBoolean(clusterRaw);

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const client = createClient(url, key);
    const selectColumns = '*';

    const postcodeFromParam = postcodeParamRaw ? normalisePostcode(postcodeParamRaw) : null;
    const postcodeFromQuery = q ? normalisePostcode(q) : null;
    const effectivePostcode = postcodeFromParam ?? postcodeFromQuery;
    const radiusMeters = Number.isFinite(radiusKmParam as any) && (radiusKmParam as any) > 0 ? Math.max(1, Math.floor((radiusKmParam as number) * 1000)) : null;

    const latFromQuery = parseLatitude(latRaw);
    const lngFromQuery = parseLongitude(lngRaw);
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

    const page = Math.max(1, Number(pageParam));
    const limit = Math.max(1, Math.min(100, Number(limitParam)));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let rows: any[] = [];
    let total = 0;
    // SHOW_DRAFTS TEMP: status defaulting logic
    const includeDraftsFlag = includeDraftsRaw === '1' || includeDraftsRaw === 'true' || process.env.SHOW_DRAFTS_IN_SEARCH === '1';
    // SHOW_DRAFTS TEMP: If include_drafts flag or env is set → default to 'all' (allow override via status), else force 'published'
    const effectiveStatus: 'published' | 'draft' | 'submitted' | 'all' = includeDraftsFlag
      ? ((statusRaw as any) || 'all')
      : 'published';

    let plan: 'rpc-published' | 'sql-bbox' | 'sql-radius' | 'fts' | 'fallback' | 'list' = 'list';

    if (bbox) {
      const [south, west, north, east] = bbox;
      if (effectiveStatus === 'published') {
        // Published-only path uses existing RPC
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
        total = rows.length;
        plan = 'rpc-published';
      } else {
        // Drafts or all: direct SQL to bypass published-only RPC
        const pool = await getPgPool();
        if (!pool) return res.status(500).json({ error: 'Database unavailable' });
        const statuses = effectiveStatus === 'all' ? ['draft', 'published'] : [effectiveStatus];
        const sql = `
          select * from public.notices n
          where n.location is not null
            and ST_Contains(ST_MakeEnvelope($1, $2, $3, $4, 4326), n.location::geometry)
            and n.status = ANY($5)
        `;
        const { rows: sqlRows } = await pool.query(sql, [west, south, east, north, statuses]);
        rows = Array.isArray(sqlRows) ? sqlRows : [];
        total = rows.length;
        plan = 'sql-bbox';
      }
    } else if (radiusSearchReady && radiusCoordinates) {
      if (effectiveStatus === 'published') {
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
        total = rows.length;
        plan = 'rpc-published';
      } else {
        const pool = await getPgPool();
        if (!pool) return res.status(500).json({ error: 'Database unavailable' });
        const statuses = effectiveStatus === 'all' ? ['draft', 'published'] : [effectiveStatus];
        const sql = `
          select * from public.notices n
          where n.location is not null
            and ST_DWithin(
              n.location,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
              $3
            )
            and n.status = ANY($4)
        `;
        const { rows: sqlRows } = await pool.query(sql, [radiusCoordinates.longitude, radiusCoordinates.latitude, radiusMeters, statuses]);
        rows = Array.isArray(sqlRows) ? sqlRows : [];
        total = rows.length;
        plan = 'sql-radius';
      }
    } else {
      const sortParam = sortParamRaw || (q ? 'relevance.desc' : 'created_at.desc');
      const { column: sortColumn, direction } = sortParam.startsWith('relevance') ? { column: 'rank', direction: 'desc' as const } : parseSort(sortParam);
      // SHOW_DRAFTS TEMP: Apply effective status to plain text and listing
      const statusParam = effectiveStatus;

      const escapedQ = q.replace(/'/g, "''");
      const computedSelect = q ? `${selectColumns}, rank:ts_rank_cd(search_vector, plainto_tsquery('english','${escapedQ}'))` : selectColumns;

      let qb: any = client.from('notices').select(computedSelect, { count: 'exact' as any });
      if (statusParam !== 'all') qb = qb.eq('status', statusParam);
      if (effectivePostcode) qb = qb.filter(POSTCODE_JSON_EXPRESSION, 'ilike', `${effectivePostcode.outward}%`);
      if (typeParam) qb = qb.eq('notice_type', typeParam);
      if (councilParam) qb = qb.eq('extras->>councilId', councilParam);
      if (startParam) qb = qb.gte('created_at', startParam);
      if (endParam) qb = qb.lte('created_at', endParam);
      if (q) { try { qb = qb.textSearch('search_vector', q, { type: 'plain', config: 'english' }); } catch {} }
      const response = await qb.order(sortColumn, { ascending: direction === 'asc', nullsFirst: direction === 'asc' }).range(from, to);
      if (response?.error) {
        console.error('[notice-search] Supabase error:', response.error);
        return res.status(500).json({ error: response.error.message });
      }
      rows = Array.isArray(response.data) ? response.data : [];
      total = typeof response.count === 'number' ? response.count : rows.length;
      plan = q ? 'fts' : 'list';

      if (q && rows.length < 5) {
        const like = q.replace(/[%_]/g, (m) => '\\' + m);
        let fb: any = client
          .from('notices')
          .select(selectColumns, { count: 'exact' as any })
          .eq('status', statusParam)
          .or([
            `notice_type.ilike.%${like}%`,
            `premises->>name.ilike.%${like}%`,
            `premises->>address.ilike.%${like}%`,
            `extras->>applicantDisplayName.ilike.%${like}%`,
            `extras->>trading_name.ilike.%${like}%`,
            `preview_text.ilike.%${like}%`,
            `premises_address->>line1.ilike.%${like}%`,
            `premises_address->>line2.ilike.%${like}%`,
            `premises_address->>town.ilike.%${like}%`,
            `premises_address->>postcode.ilike.%${like}%`,
          ].join(','))
          .range(from, to)
          .order('created_at', { ascending: false });
        if (effectivePostcode) fb = fb.filter(POSTCODE_JSON_EXPRESSION, 'ilike', `${effectivePostcode.outward}%`);
        if (typeParam) fb = fb.eq('notice_type', typeParam);
        if (councilParam) fb = fb.eq('extras->>councilId', councilParam);
        if (startParam) fb = fb.gte('created_at', startParam);
        if (endParam) fb = fb.lte('created_at', endParam);
        const fbRes = await fb;
        if (!fbRes.error) {
          rows = Array.isArray(fbRes.data) ? fbRes.data : rows;
          total = typeof fbRes.count === 'number' ? fbRes.count : rows.length;
          plan = 'fallback';
        }
      }
    }
    const limitedRows = rows; // pagination already handled in SQL for non-geo; RPC returns are small

    const items = limitedRows.map((row: any) => {
      const premises = row?.premises && typeof row.premises === 'object' ? row.premises : {};
      const consultation = row?.consultation && typeof row.consultation === 'object' ? row.consultation : {};
      const publication = row?.publication && typeof row.publication === 'object' ? row.publication : {};
      const extras = row?.extras && typeof row.extras === 'object' ? row.extras : {};

      const latitude = extractLatitude(row);
      const longitude = extractLongitude(row);

      return {
        id: row.id,
        noticeType: row.notice_type,
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
      };
    });

    const timing_ms = Date.now() - tStart;
    const payload: any = { items, total, page, limit, timing_ms };
    if (process.env.NODE_ENV !== 'production') {
      payload.debug = {
        plan,
        query: q,
        postcode: effectivePostcode?.full || null,
        bbox,
        zoom: Number.isFinite(zoomParam) ? zoomParam : null,
        radiusKm: radiusMeters ? radiusMeters / 1000 : null,
        cluster: clusterParam,
      };
    }
    return res.json(payload);
  } catch (error: any) {
    console.error('❌ [notice-search] Unexpected server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
