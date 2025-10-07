import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import AddressSearchBar, { type AddressSearchSubmitPayload } from '@/components/search/AddressSearchBar';
import SearchResults from '@/components/home/SearchResults';
import { resolveToPostcodeOrNull } from '@/lib/address';
import { getCouncilForPostcode } from '@/lib/councils';
import { useNoticeSearch } from '@/hooks/useNoticeSearch';
import { toast, useToastController } from '@/lib/ui/toast';
import * as UI from '@/styles/ui';

const TYPE_OPTIONS = ['Premises Licence', 'Traffic Order', 'Planning'];
const STATUS_OPTIONS = ['Open', 'Closed'];

function formatPostcodeForDisplay(compact?: string | null) {
  if (!compact) return null;
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, compact.length - 3)} ${compact.slice(-3)}`;
}

function sanitizePostcode(raw: string): string {
  return (raw || '').toUpperCase().replace(/\s+/g, '');
}

export default function NoticesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [addressValue, setAddressValue] = useState('');
  const [addressInlineError, setAddressInlineError] = useState<string | null>(null);
  const toastMessage = useToastController();

  const queryParam = (searchParams.get('query') ?? '').trim();
  const postcodeParam = sanitizePostcode(searchParams.get('postcode') ?? '');
  const councilParam = (searchParams.get('council') ?? '').trim();
  const typeFilter = (searchParams.get('type') ?? '').trim();
  const statusFilter = (searchParams.get('status') ?? '').trim();
  const startFilter = (searchParams.get('start') ?? '').trim();
  const endFilter = (searchParams.get('end') ?? '').trim();
  const viewParam = (searchParams.get('view') ?? '').trim();
  const radiusParam = searchParams.get('radius_km');

  const radiusValue = (() => {
    const numeric = Number(radiusParam);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return Math.min(Math.max(Math.round(numeric), 1), 50);
    }
    return 5;
  })();

  useEffect(() => {
    setAddressValue(queryParam);
  }, [queryParam]);

  useEffect(() => {
    let cancelled = false;
    if (!postcodeParam && queryParam) {
      resolveToPostcodeOrNull(queryParam).then((resolved) => {
        if (cancelled || !resolved) return;
        const next = new URLSearchParams(searchParams);
        if (next.get('postcode') === resolved) return;
        next.set('postcode', resolved);
        setSearchParams(next, { replace: true });
      });
    }
    return () => {
      cancelled = true;
    };
  }, [postcodeParam, queryParam, searchParams, setSearchParams]);

  const hasSearchTerm = Boolean(postcodeParam || councilParam || queryParam);

  const { notices, loading, error, refetch } = useNoticeSearch({
    enabled: hasSearchTerm,
    query: !postcodeParam && !councilParam ? queryParam : undefined,
    postcode: postcodeParam || undefined,
    councilId: councilParam || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    start: startFilter || undefined,
    end: endFilter || undefined,
    radiusKm: radiusValue,
  });

  const filteredResults = useMemo(() => {
    return notices.filter((item) => {
      if (typeFilter && item.noticeType !== typeFilter) return false;
      if (statusFilter && item.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (startFilter) {
        const from = new Date(startFilter);
        const published = item.publicationDate ? new Date(item.publicationDate) : null;
        if (!Number.isNaN(from.getTime()) && published && published < from) return false;
      }
      if (endFilter) {
        const to = new Date(endFilter);
        const published = item.publicationDate ? new Date(item.publicationDate) : null;
        if (!Number.isNaN(to.getTime()) && published && published > to) return false;
      }
      return true;
    });
  }, [notices, typeFilter, statusFilter, startFilter, endFilter]);

  const mapView = viewParam === 'map';
  const hasActiveFilters = Boolean(typeFilter || statusFilter || startFilter || endFilter || councilParam || radiusParam);
  const searchLabel = (formatPostcodeForDisplay(postcodeParam) ?? queryParam) || 'your filters';

  const updateParams = useCallback(
    (updater: (params: URLSearchParams) => void, replace = false) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, { replace });
    },
    [searchParams, setSearchParams]
  );

  const handleAddressSubmit = useCallback(async ({ query, suggestion }: AddressSearchSubmitPayload) => {
    const raw = (query || addressValue).trim();
    if (!raw) return;
    setAddressInlineError(null);

    try {
      const resolvedPostcode = await resolveToPostcodeOrNull(suggestion ?? raw);
      let councilId = '';
      let councilName = '';
      if (resolvedPostcode) {
        try {
          const council = await getCouncilForPostcode(resolvedPostcode);
          councilId = council?.id ?? '';
          councilName = council?.name ?? '';
        } catch (lookupError) {
          console.warn('[council lookup error]', lookupError);
        }
      }

      updateParams((params) => {
        params.set('query', raw);
        if (resolvedPostcode) params.set('postcode', resolvedPostcode);
        else params.delete('postcode');
        if (councilId) params.set('council', councilId);
        else params.delete('council');
        params.delete('radius_km');
      });

      const displayPostcode = formatPostcodeForDisplay(resolvedPostcode);
      const label = councilName || raw;
      toast(displayPostcode ? `Showing notices for ${label} (${displayPostcode})` : `Showing notices for ${label}`);
      setAddressValue(suggestion?.label ?? raw);
    } catch (err) {
      console.error(err);
      setAddressInlineError('Couldn’t load notices. Try again.');
    }
  }, [addressValue, updateParams]);

  const handleFreeText = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    void handleAddressSubmit({ query: trimmed, suggestion: undefined });
  }, [handleAddressSubmit]);

  const toggleType = useCallback((option: string) => {
    updateParams((params) => {
      if (params.get('type') === option) params.delete('type');
      else params.set('type', option);
    }, true);
  }, [updateParams]);

  const toggleStatus = useCallback((option: string) => {
    updateParams((params) => {
      if ((params.get('status') ?? '').toLowerCase() === option.toLowerCase()) params.delete('status');
      else params.set('status', option);
    }, true);
  }, [updateParams]);

  const handleDateChange = useCallback((field: 'start' | 'end', value: string) => {
    updateParams((params) => {
      if (value) params.set(field, value);
      else params.delete(field);
    }, true);
  }, [updateParams]);

  const toggleMapView = useCallback(() => {
    updateParams((params) => {
      if (params.get('view') === 'map') params.delete('view');
      else params.set('view', 'map');
    }, true);
  }, [updateParams]);

  const clearFilters = useCallback(() => {
    updateParams((params) => {
      params.delete('type');
      params.delete('status');
      params.delete('start');
      params.delete('end');
      params.delete('council');
      params.delete('radius_km');
    }, true);
  }, [updateParams]);

  const broadenRadius = useCallback(() => {
    updateParams((params) => {
      const current = Number(params.get('radius_km') ?? radiusValue);
      const nextRadius = Math.min((Number.isFinite(current) && current > 0 ? current : radiusValue) + 5, 50);
      params.set('radius_km', String(nextRadius));
    }, true);
  }, [radiusValue, updateParams]);

  const retryFetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/80 backdrop-blur">
        <div className={`${UI.container} py-4 space-y-3`}>
          <AddressSearchBar
            value={addressValue}
            onValueChange={(next) => {
              setAddressValue(next);
              setAddressInlineError(null);
            }}
            onSubmit={handleAddressSubmit}
            onFreeText={handleFreeText}
            testIdPrefix="notices"
          />
          {addressInlineError && (
            <p role="alert" className="text-sm text-rose-600">{addressInlineError}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {TYPE_OPTIONS.map((option) => {
              const active = typeFilter === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleType(option)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {option}
                </button>
              );
            })}
            {STATUS_OPTIONS.map((option) => {
              const active = statusFilter.toLowerCase() === option.toLowerCase();
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleStatus(option)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {option}
                </button>
              );
            })}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <label className="flex items-center gap-1">
                <span className="sr-only">Start date</span>
                <input
                  type="date"
                  value={startFilter}
                  onChange={(event) => handleDateChange('start', event.target.value)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <span>to</span>
              <label className="flex items-center gap-1">
                <span className="sr-only">End date</span>
                <input
                  type="date"
                  value={endFilter}
                  onChange={(event) => handleDateChange('end', event.target.value)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={toggleMapView}
              className={`ml-auto rounded-full border px-3 py-1 text-sm transition ${
                mapView ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {mapView ? 'List view' : 'Map view'}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-slate-300"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`${UI.container} py-8 space-y-6`}>
        {error && (
          <div className="space-y-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p>
              Search failed for <strong>{searchLabel}</strong>. {error}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={retryFetch}
                className="rounded-full border border-rose-300 bg-white px-3 py-1 text-sm font-medium text-rose-700 hover:border-rose-400"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={broadenRadius}
                className="rounded-full border border-rose-300 bg-white px-3 py-1 text-sm font-medium text-rose-700 hover:border-rose-400"
              >
                Broaden search
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-rose-300 bg-white px-3 py-1 text-sm font-medium text-rose-700 hover:border-rose-400"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        {mapView ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
            Map view coming soon
          </div>
        ) : (
          <SearchResults results={filteredResults} query={searchLabel} loading={loading} />
        )}
      </main>

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 rounded-md bg-slate-900 px-4 py-2 text-xs text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
