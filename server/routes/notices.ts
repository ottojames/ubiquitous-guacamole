import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const POSTCODE_RE = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i;

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
  const match = raw.trim().toUpperCase().match(POSTCODE_RE);
  if (!match) return null;
  const outward = match[1];
  const inward = match[2];
  return { full: `${outward} ${inward}`, outward };
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

const router = Router();

router.get('/notices/search', async (req, res) => {
  try {
    const q = String(req.query.q ?? '').trim();
    const postcodeParam = String(req.query.postcode ?? '').trim();
    const councilParam = String((req.query.councilId ?? req.query.council) ?? '').trim();
    const typeParam = String(req.query.type ?? '').trim();
    const statusParam = String(req.query.status ?? '').trim();
    const startParam = String(req.query.start ?? '').trim();
    const endParam = String(req.query.end ?? '').trim();
    const sortParam = String(req.query.sort ?? '').trim() || undefined;
    const limitParam = parseLimit(req.query.limit);

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const client = createClient(url, key);
    const selectColumns = 'id, notice_type, status, premises, consultation, publication, extras, created_at, updated_at';

    const postcodeFromParam = postcodeParam ? normalisePostcode(postcodeParam) : null;
    const postcodeFromQuery = q ? normalisePostcode(q) : null;
    const effectivePostcode = postcodeFromParam ?? postcodeFromQuery;

    const buildBaseQuery = () => {
      let qb = client
        .from('notices')
        .select(selectColumns)
        .limit(limitParam);

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
        qb = qb.or(
          [
            `notice_type.ilike.%${q}%`,
            `premises->>name.ilike.%${q}%`,
            `premises->>address.ilike.%${q}%`,
            `extras->>applicantDisplayName.ilike.%${q}%`,
          ].join(',')
        );
      }

      return qb;
    };

    const { column: sortColumn, direction } = parseSort(sortParam);
    const response = await buildBaseQuery().order(sortColumn, {
      ascending: direction === 'asc',
      nullsFirst: direction === 'asc',
    });

    if (response?.error) {
      return res.status(500).json({ error: response.error.message });
    }

    const items = (response.data || []).map((row: any) => {
      const premises = row.premises || {};
      const consultation = row.consultation || {};
      const publication = row.publication || {};
      return {
        id: row.id,
        noticeType: row.notice_type,
        status: row.status,
        premisesName: premises.name || null,
        premisesAddress: premises.address || null,
        repsDeadline: consultation.repsDeadline || null,
        applicationDate: consultation.applicationDate || null,
        publicationDate: publication.targetDate || null,
        newspaper: publication.newspaper || null,
        viewUrl: (row.extras && row.extras.viewUrl) || null,
      };
    });

    return res.json({
      items,
      query: q,
      postcode: effectivePostcode?.full || null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'search failed' });
  }
});

export default router;
