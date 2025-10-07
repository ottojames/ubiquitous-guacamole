import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

import { ensurePostcodeCoordinates, normalisePostcode as geocodeNormalisePostcode } from '../lib/geocode';

const POSTCODE_RE = /([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})/i;

type SortDirection = 'asc' | 'desc';

const DEFAULT_SORT: { column: string; direction: SortDirection } = {
  column: 'created_at',
  direction: 'desc',
};

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

    return res.status(201).json({ id: data.id });
  } catch (error: any) {
    console.error('❌ [notice-draft] Unexpected server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/notices/search', async (req, res) => {
  try {
    console.log('[notice-search] Incoming query params:', req.query);

    const q = String(req.query.q ?? '').trim();
    const postcodeParam = String(req.query.postcode ?? '').trim();
    const councilParam = String((req.query.councilId ?? req.query.council) ?? '').trim();
    const typeParam = String(req.query.type ?? '').trim();
    const statusParam = String(req.query.status ?? '').trim();
    const startParam = String(req.query.start ?? '').trim();
    const endParam = String(req.query.end ?? '').trim();
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

    const client = createClient(url, key);
    const selectColumns = 'id, notice_type, status, premises, consultation, publication, extras, latitude, longitude, created_at, updated_at';

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

      if (effectivePostcode) {
        qb = qb.ilike('premises->>postcode', `${effectivePostcode.outward}%`);
      }

      if (typeParam) {
        qb = qb.eq('notice_type', typeParam);
      }

      if (statusParam) {
        qb = qb.eq('status', statusParam);
      }

      if (councilParam) {
        qb = qb.eq('extras->>councilId', councilParam);
      }

      if (startParam) {
        qb = qb.gte('created_at', startParam);
      }

      if (endParam) {
        qb = qb.lte('created_at', endParam);
      }

      if (q && !postcodeFromQuery) {
        const filters = [
          buildIlikeFilter('notice_type', q),
          buildIlikeFilter('premises->>name', q),
          buildIlikeFilter('premises->>address', q),
          buildIlikeFilter('extras->>applicantDisplayName', q),
        ].filter(Boolean) as string[];

        if (filters.length) {
          qb = qb.or(filters.join(','));
        }
      }

      return qb;
    };

    const { column: sortColumn, direction } = parseSort(sortParam);

    let rows: any[] = [];
    if (bbox) {
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
      if (effectivePostcode) {
        const rowPostcode = typeof row?.premises?.postcode === 'string' ? row.premises.postcode.toUpperCase() : '';
        if (!rowPostcode.startsWith(effectivePostcode.outward)) {
          return false;
        }
      }

      if (typeParam && row.notice_type !== typeParam) {
        return false;
      }

      if (statusParam && row.status !== statusParam) {
        return false;
      }

      if (councilParam) {
        const rowCouncil = typeof row?.extras?.councilId === 'string' ? row.extras.councilId : null;
        if (rowCouncil !== councilParam) {
          return false;
        }
      }

      if (startParam) {
        const createdAt = row?.created_at ? new Date(row.created_at).getTime() : NaN;
        const startTime = new Date(startParam).getTime();
        if (Number.isFinite(startTime) && (!Number.isFinite(createdAt) || createdAt < startTime)) {
          return false;
        }
      }

      if (endParam) {
        const createdAt = row?.created_at ? new Date(row.created_at).getTime() : NaN;
        const endTime = new Date(endParam).getTime();
        if (Number.isFinite(endTime) && (!Number.isFinite(createdAt) || createdAt > endTime)) {
          return false;
        }
      }

      if (q && !postcodeFromQuery) {
        const lowerQ = q.toLowerCase();
        const matches = [
          typeof row.notice_type === 'string' ? row.notice_type.toLowerCase() : '',
          typeof row?.premises?.name === 'string' ? row.premises.name.toLowerCase() : '',
          typeof row?.premises?.address === 'string' ? row.premises.address.toLowerCase() : '',
          typeof row?.extras?.applicantDisplayName === 'string'
            ? row.extras.applicantDisplayName.toLowerCase()
            : '',
        ].some((value) => value.includes(lowerQ));

        if (!matches) {
          return false;
        }
      }

      return true;
    });

    const sortedRows = sortRowsBy(filteredRows, sortColumn, direction);
    const limitedRows = sortedRows.slice(0, limitParam);

    const items = limitedRows.map((row: any) => {
      const premises = row.premises || {};
      const consultation = row.consultation || {};
      const publication = row.publication || {};
      return {
        id: row.id,
        noticeType: row.notice_type,
        status: row.status,
        premisesName: premises.name || null,
        premisesAddress: premises.address || null,
        premisesPostcode: premises.postcode || null,
        repsDeadline: consultation.repsDeadline || null,
        applicationDate: consultation.applicationDate || null,
        publicationDate: publication.targetDate || null,
        newspaper: publication.newspaper || null,
        viewUrl: (row.extras && row.extras.viewUrl) || null,
        latitude: typeof row.latitude === 'number' ? row.latitude : null,
        longitude: typeof row.longitude === 'number' ? row.longitude : null,
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

export default router;
