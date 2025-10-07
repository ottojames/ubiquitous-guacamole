import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { API_BASE } from '@/lib/api';
import type { NoticeSearchItem, NoticeSearchParams } from '@/lib/notices';
import { buildNoticeSearchQuery } from '@/lib/notices';

type UseNoticeSearchOptions = NoticeSearchParams & {
  enabled?: boolean;
};

type UseNoticeSearchResult = {
  notices: NoticeSearchItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useNoticeSearch(options: UseNoticeSearchOptions = {}): UseNoticeSearchResult {
  const {
    enabled = true,
    query,
    postcode,
    councilId,
    type,
    status,
    start,
    end,
    radiusKm,
    limit,
    sort,
  } = options;

  const queryString = useMemo(
    () =>
      buildNoticeSearchQuery({
        query,
        postcode,
        councilId,
        type,
        status,
        start,
        end,
        radiusKm,
        limit,
        sort,
      }),
    [query, postcode, councilId, type, status, start, end, radiusKm, limit, sort]
  );

  const controllerRef = useRef<AbortController | null>(null);
  const [notices, setNotices] = useState<NoticeSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!enabled) {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      setLoading(false);
      setError(null);
      setNotices([]);
      return;
    }

    const controller = new AbortController();
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = controller;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const target = `${API_BASE}/api/notices/search${queryString ? `?${queryString}` : ''}`;

    fetch(target, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const items = Array.isArray(payload?.items) ? (payload.items as NoticeSearchItem[]) : [];
        setNotices(items);
        setError(null);
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError' || cancelled) return;
        setNotices([]);
        setError(err?.message || 'Search failed');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, queryString, refreshToken]);

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, []);

  const refetch = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  return { notices, loading, error, refetch };
}

export default useNoticeSearch;
