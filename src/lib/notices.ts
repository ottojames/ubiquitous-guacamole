import { API_BASE } from './api';
import type { Address } from './address';

export type NoticeSearchItem = {
  id: string;
  noticeType: string;
  status: string;
  premisesName?: string | null;
  premisesAddress?: any;
  repsDeadline?: string | null;
  applicationDate?: string | null;
  publicationDate?: string | null;
  newspaper?: string | null;
  viewUrl?: string | null;
};

export type NoticeSearchParams = {
  query?: string;
  postcode?: string;
  councilId?: string;
  type?: string;
  status?: string;
  start?: string;
  end?: string;
  radiusKm?: number;
  limit?: number;
  sort?: string;
};

export function buildNoticeSearchQuery(params: NoticeSearchParams = {}): string {
  const sp = new URLSearchParams();

  if (params.query) sp.set('q', params.query);
  if (params.postcode) sp.set('postcode', params.postcode);
  if (params.councilId) sp.set('council', params.councilId);
  if (params.type) sp.set('type', params.type);
  if (params.status) sp.set('status', params.status);
  if (params.start) sp.set('start', params.start);
  if (params.end) sp.set('end', params.end);
  if (typeof params.radiusKm === 'number' && Number.isFinite(params.radiusKm)) {
    sp.set('radius_km', String(params.radiusKm));
  }
  if (typeof params.limit === 'number' && Number.isFinite(params.limit)) {
    sp.set('limit', String(params.limit));
  }
  if (params.sort) sp.set('sort', params.sort);

  return sp.toString();
}

export async function fetchNotices(params: NoticeSearchParams = {}): Promise<NoticeSearchItem[]> {
  const query = buildNoticeSearchQuery(params);
  const target = `${API_BASE}/api/notices/search${query ? `?${query}` : ''}`;
  const response = await fetch(target, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }
  const payload = await response.json();
  return Array.isArray(payload?.items) ? (payload.items as NoticeSearchItem[]) : [];
}

export async function searchNotices(query: string): Promise<NoticeSearchItem[]> {
  return fetchNotices({ query });
}

export type DraftNoticeInput = {
  address: Address;
  postcode: string;
  councilId: string;
};

export async function createDraftNotice(payload: DraftNoticeInput) {
  const target = `${API_BASE}/api/notices/draft`;
  const res = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Create draft failed ${res.status}`);
  }

  return res.json() as Promise<{ id: string }>;
}
