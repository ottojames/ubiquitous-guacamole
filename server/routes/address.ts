import { Router } from 'express';
import { z } from 'zod';

const router = Router();

export type AddressItem = { id: string; label: string; postcode?: string };
type CachedResult = { expiresAt: number; items: AddressItem[] };
const cache = new Map<string, CachedResult>();
const TTL_MS = 2 * 60 * 1000;

const suggestSchema = z.object({
  suggestions: z.array(z.object({ id: z.string().optional(), address: z.string() })),
});

const GET_SUGGEST_URL = (q: string, key: string) =>
  `https://api.getaddress.io/autocomplete/${encodeURIComponent(q)}?api-key=${key}&all=true&top=100`;

const GET_RESOLVE_URL = (id: string, key: string) =>
  `https://api.getaddress.io/get/${encodeURIComponent(id)}?api-key=${key}`;

function resolveKey(): string {
  const candidates = [
    process.env.VITE_GETADDRESS_KEY,
    process.env.VITE_GETADDRESS_API_KEY,
    process.env.ADDRESS_API_KEY,
    process.env.GETADDRESS_API_KEY,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^\$\{(.+)}$/);
    if (match) {
      const ref = process.env[match[1]];
      if (ref && ref.trim()) return ref.trim();
      continue;
    }
    return trimmed;
  }

  return '';
}

function getQ(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim();
  if (Array.isArray(raw)) return String(raw[0] ?? '').trim();
  return '';
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await response.text();
  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(text);
      msg = parsed?.Message || parsed?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : {};
}

const POSTCODE_RE = /([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i;
function normPC(s: string): string {
  if (!s) return '';
  const match = s.toUpperCase().match(POSTCODE_RE);
  if (!match) return '';
  const raw = match[1].replace(/\s+/g, '');
  return `${raw.slice(0, -3)} ${raw.slice(-3)}`;
}

router.get('/addresses', async (req, res) => {
  const q = getQ(req.query.q);
  if (q.length < 2) return res.json({ items: [], source: 'none' });

  const key = resolveKey();

  // If no key, provide mock data for development
  if (!key) {
    // Mock addresses for common UK postcodes - now with postcode field
    const mockData: Record<string, AddressItem[]> = {
      'sw1a 1aa': [
        { id: 'mock-1', label: 'Buckingham Palace, Westminster, London, SW1A 1AA', postcode: 'SW1A 1AA' },
        { id: 'mock-2', label: 'The Queens Gallery, Buckingham Palace Road, Westminster, London, SW1A 1AA', postcode: 'SW1A 1AA' },
        { id: 'mock-3', label: 'Royal Mews, Buckingham Palace Road, Westminster, London, SW1A 1AA', postcode: 'SW1A 1AA' },
      ],
      'sw1a': [
        { id: 'mock-4', label: 'Buckingham Palace, Westminster, London, SW1A 1AA', postcode: 'SW1A 1AA' },
        { id: 'mock-5', label: '10 Downing Street, Westminster, London, SW1A 2AA', postcode: 'SW1A 2AA' },
        { id: 'mock-6', label: 'HM Treasury, 1 Horse Guards Road, Westminster, London, SW1A 2HQ', postcode: 'SW1A 2HQ' },
      ],
      'w1a 1aa': [
        { id: 'mock-7', label: 'BBC Broadcasting House, Portland Place, Marylebone, London, W1A 1AA', postcode: 'W1A 1AA' },
        { id: 'mock-8', label: 'All Souls Church, Langham Place, Marylebone, London, W1A 1AA', postcode: 'W1A 1AA' },
      ],
      'w1a': [
        { id: 'mock-9', label: 'BBC Broadcasting House, Portland Place, Marylebone, London, W1A 1AA', postcode: 'W1A 1AA' },
        { id: 'mock-10', label: 'Langham Hotel, 1C Portland Place, Marylebone, London, W1A 1JA', postcode: 'W1A 1JA' },
      ],
      'ec1a': [
        { id: 'mock-11', label: '1 St Bartholomews Hospital, West Smithfield, City of London, EC1A 7BE', postcode: 'EC1A 7BE' },
        { id: 'mock-12', label: 'Smithfield Market, Charterhouse Street, City of London, EC1A 9PQ', postcode: 'EC1A 9PQ' },
      ],
      's325uy': [
        { id: 'mock-13', label: 'The Pilot Inn, Station Road, Sheffield, S32 5UY', postcode: 'S32 5UY' },
        { id: 'mock-14', label: '1 Station Road, Sheffield, S32 5UY', postcode: 'S32 5UY' },
        { id: 'mock-15', label: 'Railway Cottages, Station Road, Sheffield, S32 5UY', postcode: 'S32 5UY' },
      ],
      'default': [
        { id: 'mock-16', label: '123 High Street, London, W1A 1AA', postcode: 'W1A 1AA' },
        { id: 'mock-17', label: '456 Main Road, Westminster, SW1A 2AA', postcode: 'SW1A 2AA' },
        { id: 'mock-18', label: '789 Park Lane, Kensington, W8 1AA', postcode: 'W8 1AA' },
      ]
    };

    // Try to match the query to mock data
    const queryLower = q.toLowerCase().replace(/\s+/g, '');
    let items: AddressItem[] = [];

    // Check for exact postcode match
    for (const [key, addresses] of Object.entries(mockData)) {
      if (key !== 'default' && queryLower.includes(key.replace(/\s+/g, ''))) {
        items = addresses;
        break;
      }
    }

    // If no match, return default addresses with the query incorporated
    if (items.length === 0) {
      // Check if it looks like a postcode
      const postcodeMatch = q.match(/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i);
      if (postcodeMatch) {
        const postcode = normPC(postcodeMatch[0]) || q;
        items = [
          { id: 'mock-gen-1', label: `1 High Street, London, ${postcode}`, postcode: postcode },
          { id: 'mock-gen-2', label: `2 Main Road, Westminster, ${postcode}`, postcode: postcode },
          { id: 'mock-gen-3', label: `3 Church Lane, Kensington, ${postcode}`, postcode: postcode },
        ];
      } else if (q.length >= 3) {
        // Generic address search
        items = mockData.default;
      }
    }

    return res.json({ items, source: 'mock' });
  }

  // Normalize postcode to uppercase if it looks like a postcode
  const normalizedQuery = normPC(q) || q;

  const cacheKey = normalizedQuery.toLowerCase();
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return res.json({ items: cached.items, source: 'cache' });
  }

  try {
    const payload = await fetchJson(GET_SUGGEST_URL(normalizedQuery, key));
    const parsed = suggestSchema.safeParse(payload);
    if (!parsed.success) throw new Error('Invalid provider response');
    const items: AddressItem[] = parsed.data.suggestions.map((suggestion, index) => ({
      id: suggestion.id || `ga-${index}`,
      label: suggestion.address,
    }));
    cache.set(cacheKey, { expiresAt: now + TTL_MS, items });
    return res.json({ items, source: 'getaddress' });
  } catch (error: any) {
    return res.status(502).json({ error: error?.message || 'address lookup failed' });
  }
});

router.get('/address/resolve', async (req, res) => {
  const id = getQ(req.query.id);
  const key = resolveKey();

  if (!id) return res.status(400).json({ ok: false, error: 'missing id' });
  if (!key) return res.status(500).json({ ok: false, error: 'missing GETADDRESS_API_KEY' });

  try {
    const payload = await fetchJson(GET_RESOLVE_URL(id, key));

    let entry: any = null;
    if (Array.isArray(payload?.addresses) && payload.addresses.length) {
      entry = payload.addresses[0];
    } else if (payload?.address) {
      entry = payload.address;
    }

    const fromEntry = typeof entry === 'object' && entry ? entry : null;
    const fromString = typeof entry === 'string' ? entry : '';

    const rawLabelCandidates: string[] = [];
    if (typeof payload?.summaryline === 'string') rawLabelCandidates.push(payload.summaryline);
    if (typeof payload?.formatted_address === 'string') rawLabelCandidates.push(payload.formatted_address);
    if (typeof payload?.label === 'string') rawLabelCandidates.push(payload.label);
    if (typeof payload?.line_1 === 'string') {
      rawLabelCandidates.push([
        payload.line_1,
        payload.line_2,
        payload.line_3,
        payload.town_or_city || payload.post_town,
        payload.county,
        payload.postcode || payload.post_code,
      ]
        .map((part) => (part ?? '').trim())
        .filter(Boolean)
        .join(', '));
    }

    const fromLines = fromEntry
      ? [
          fromEntry.line_1 ?? fromEntry.line1 ?? fromEntry.thoroughfare ?? fromEntry.building_name ?? '',
          fromEntry.line_2 ?? fromEntry.line2 ?? fromEntry.dependent_thoroughfare ?? '',
          fromEntry.line_3 ?? fromEntry.line3 ?? fromEntry.building_number ?? '',
          fromEntry.town_or_city ?? fromEntry.post_town ?? fromEntry.town ?? fromEntry.city ?? '',
          fromEntry.county ?? fromEntry.district ?? fromEntry.administrative_area ?? '',
          fromEntry.postcode ?? fromEntry.post_code ?? fromEntry.postal_code ?? '',
        ]
          .map((part: string) => (typeof part === 'string' ? part.trim() : ''))
          .filter(Boolean)
          .join(', ')
      : '';

    if (fromLines) rawLabelCandidates.push(fromLines);
    if (fromString) rawLabelCandidates.push(fromString);

    const label = rawLabelCandidates.find((candidate) => candidate && candidate.trim())?.trim();

    const partsFromLabel = label
      ? label
          .split(',')
          .map((segment) => segment.trim())
          .filter(Boolean)
      : [];

    let postcode = normPC(
      (fromEntry && (fromEntry.postcode ?? fromEntry.post_code ?? fromEntry.postal_code)) ||
        (payload?.postcode ?? payload?.post_code ?? '') ||
        (partsFromLabel.length ? partsFromLabel[partsFromLabel.length - 1] : '') ||
        fromString,
    );

    const labelParts = [...partsFromLabel];
    if (postcode) {
      for (let i = labelParts.length - 1; i >= 0; i -= 1) {
        if (normPC(labelParts[i]) === postcode) {
          labelParts.splice(i, 1);
          break;
        }
      }
    }

    const [line1 = '', line2 = '', line3 = '', ...rest] = labelParts;
    let city = '';
    if (fromEntry) {
      city =
        (fromEntry.town_or_city ?? fromEntry.post_town ?? fromEntry.town ?? fromEntry.city ?? fromEntry.county ?? '')
          .toString()
          .trim();
    }
    if (!city && rest.length) {
      city = rest.join(', ');
    }

    const result = {
      id,
      label: label || [line1, line2, line3, city, postcode].filter(Boolean).join(', '),
      line1: fromEntry
        ? (fromEntry.line_1 ?? fromEntry.line1 ?? fromEntry.thoroughfare ?? fromEntry.building_name ?? line1 ?? '').toString().trim()
        : line1,
      line2: fromEntry
        ? (fromEntry.line_2 ?? fromEntry.line2 ?? fromEntry.dependent_thoroughfare ?? line2 ?? '').toString().trim()
        : line2,
      line3: fromEntry
        ? (fromEntry.line_3 ?? fromEntry.line3 ?? fromEntry.building_number ?? line3 ?? '').toString().trim()
        : line3,
      city,
      postcode,
    };

    const hasContent = [result.line1, result.line2, result.line3, result.city, result.postcode, result.label]
      .some((value) => !!value && value.trim());

    if (!hasContent) {
      return res.status(404).json({ ok: false, error: 'address not found' });
    }

    return res.status(200).json({ ok: true, result });
  } catch (error: any) {
    return res.status(502).json({ ok: false, error: error?.message || 'resolve failed' });
  }
});

export default router;
