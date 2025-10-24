import { useEffect, useState } from 'react';

export interface RepresentationCounts {
  total: number;
  unread: number;
}

export interface UseRepresentationCountsResult {
  counts: RepresentationCounts | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch representation counts for a specific notice
 * @param noticeId - The notice ID to fetch counts for
 * @param userId - The user ID to check unread status for
 * @returns Representation counts, loading state, error, and refetch function
 */
export function useRepresentationCounts(
  noticeId: string | undefined | null,
  userId: string | undefined | null
): UseRepresentationCountsResult {
  const [counts, setCounts] = useState<RepresentationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  useEffect(() => {
    if (!noticeId || !userId) {
      setCounts(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchCounts() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/notices/${noticeId}/representations/counts?userId=${encodeURIComponent(userId)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch representation counts: ${response.statusText}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setCounts({
            total: data.total || 0,
            unread: data.unread || 0,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error fetching counts'));
          setCounts(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCounts();

    return () => {
      cancelled = true;
    };
  }, [noticeId, userId, refetchTrigger]);

  return { counts, loading, error, refetch };
}

/**
 * Hook to fetch representation counts for multiple notices in bulk
 * @param noticeIds - Array of notice IDs to fetch counts for
 * @param userId - The user ID to check unread status for
 * @returns Map of notice ID to counts, loading state, error, and refetch function
 */
export function useBulkRepresentationCounts(
  noticeIds: string[] | undefined | null,
  userId: string | undefined | null
): {
  countsMap: Record<string, RepresentationCounts> | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [countsMap, setCountsMap] = useState<Record<string, RepresentationCounts> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  useEffect(() => {
    if (!noticeIds || noticeIds.length === 0 || !userId) {
      setCountsMap(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchBulkCounts() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/representations/counts/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            noticeIds,
            userId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch bulk representation counts: ${response.statusText}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setCountsMap(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error fetching bulk counts'));
          setCountsMap(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBulkCounts();

    return () => {
      cancelled = true;
    };
  }, [noticeIds?.join(','), userId, refetchTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  return { countsMap, loading, error, refetch };
}
