import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AnimatePresence, motion } from 'framer-motion';
import AddressSearchBar, { type AddressSearchSubmitPayload } from '@/components/search/AddressSearchBar';
import SearchResults from '@/components/home/SearchResults';
import NoticesMapView from '@/components/search/NoticesMapView';
import Pagination from '@/components/ui/Pagination';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import { resolveToPostcodeOrNull } from '@/lib/address';
import { getCouncilForPostcode } from '@/lib/councils';
import { useNoticeSearch } from '@/hooks/useNoticeSearch';
import type { NoticeBoundingBox, NoticeSearchItem } from '@/lib/notices';
import { toast, useToastController } from '@/lib/ui/toast';
import { TRAFFIC_AREAS } from '@/next/publish/config/trafficAreas';
import { supabase } from '@/lib/supabase';
import { EmailAlertSubscriptionForm } from '@/components/alerts/EmailAlertSubscriptionForm';
import { Bell } from 'lucide-react';

const TYPE_OPTIONS = [
  'Licensing Act 2003',
  'Gambling Act 2005',
  'Goods Vehicle Operator\'s Licence',
  'Planning',
  'Probate',
  'Club Premises Certificate',
  'Traffic Order'
];
// Database status values are: 'draft', 'submitted', 'published'
// For now, just show published notices (no status filter UI)
const STATUS_OPTIONS: string[] = [];

function formatPostcodeForDisplay(compact?: string | null) {
  if (!compact) return null;
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, compact.length - 3)} ${compact.slice(-3)}`;
}

function sanitizePostcode(raw: string): string {
  return (raw || '').toUpperCase().replace(/\s+/g, '');
}

function parseBoundingBoxParam(raw: string | null | undefined): NoticeBoundingBox | null {
  if (!raw) return null;
  const parts = raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
  if (parts.length !== 4) return null;
  const [south, west, north, east] = parts as NoticeBoundingBox;
  if (south < -90 || south > 90 || north < -90 || north > 90) return null;
  if (west < -180 || west > 180 || east < -180 || east > 180) return null;
  if (north <= south || east <= west) return null;
  return [south, west, north, east];
}

function formatBoundingBoxParam(bbox: NoticeBoundingBox): string {
  return bbox.map((value) => value.toFixed(5)).join(',');
}

export default function NoticesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [addressValue, setAddressValue] = useState('');
  const [addressInlineError, setAddressInlineError] = useState<string | null>(null);
  const [councils, setCouncils] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [searchedLocation, setSearchedLocation] = useState<{ latitude: number; longitude: number; postcode: string } | null>(null);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const toastMessage = useToastController();

  const queryParam = (searchParams.get('query') ?? '').trim();
  const postcodeParam = sanitizePostcode(searchParams.get('postcode') ?? '');
  const councilParam = (searchParams.get('council') ?? '').trim();
  const typeFilter = (searchParams.get('type') ?? '').trim();
  const statusFilter = (searchParams.get('status') ?? '').trim();
  const startFilter = (searchParams.get('start') ?? '').trim();
  const endFilter = (searchParams.get('end') ?? '').trim();
  const trafficAreaFilter = (searchParams.get('traffic_area') ?? '').trim();
  const viewParam = (searchParams.get('view') ?? '').trim();
  const sortParam = (searchParams.get('sort') ?? '').trim() || 'created_at.desc';
  const radiusParam = searchParams.get('radius_km');
  const bboxParamRaw = (searchParams.get('bbox') ?? '').trim();
  const zoomParamRaw = (searchParams.get('zoom') ?? '').trim();
  const pageParam = searchParams.get('page');
  const itemsPerPageParam = searchParams.get('per_page');

  const radiusValue = (() => {
    const numeric = Number(radiusParam);
    if (!Number.isNaN(numeric) && numeric > 0) {
      // Allow decimal values like 0.5 for 500m
      return Math.min(Math.max(numeric, 0.5), 50);
    }
    return 1; // Default to 1km instead of 5km
  })();

  // Pagination values
  const currentPage = (() => {
    const parsed = Number(pageParam);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  })();

  const itemsPerPage = (() => {
    const parsed = Number(itemsPerPageParam);
    if (Number.isFinite(parsed) && [10, 25, 50, 100].includes(parsed)) {
      return parsed;
    }
    return 25; // Default to 25 items per page
  })();

  const mapBoundingBox = useMemo(() => parseBoundingBoxParam(bboxParamRaw), [bboxParamRaw]);
  const mapZoom = useMemo(() => {
    const parsed = Number(zoomParamRaw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [zoomParamRaw]);

  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);
  const [hoveredNoticeId, setHoveredNoticeId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAllMapResults, setShowAllMapResults] = useState(false);

  const mapView = viewParam === 'map';

  useEffect(() => {
    setAddressValue(queryParam);
  }, [queryParam]);

  // Fetch councils for the dropdown
  useEffect(() => {
    const fetchCouncils = async () => {
      const { data, error } = await supabase
        .from('councils')
        .select('id, name, slug')
        .order('name');

      if (!error && data) {
        setCouncils(data);
      }
    };

    fetchCouncils();
  }, []);

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

  // Fetch coordinates for the searched postcode
  useEffect(() => {
    let cancelled = false;

    if (!postcodeParam) {
      setSearchedLocation(null);
      return;
    }

    const fetchCoordinates = async () => {
      try {
        const normalizedPostcode = postcodeParam.replace(/(.{1,4})(.{3})$/, '$1 $2');
        const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(normalizedPostcode)}`);

        if (!response.ok) {
          console.warn('[Notices] Failed to fetch postcode coordinates:', response.status);
          return;
        }

        const data = await response.json();
        const result = data?.result;

        if (!cancelled && result?.latitude && result?.longitude) {
          setSearchedLocation({
            latitude: result.latitude,
            longitude: result.longitude,
            postcode: normalizedPostcode,
          });
        }
      } catch (error) {
        console.warn('[Notices] Error fetching postcode coordinates:', error);
      }
    };

    fetchCoordinates();

    return () => {
      cancelled = true;
    };
  }, [postcodeParam]);

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
    trafficArea: trafficAreaFilter || undefined,
    sort: sortParam,
    radiusKm: radiusValue,
    bbox: mapBoundingBox ?? undefined,
    zoom: mapZoom,
    cluster: mapView,
  });

  // API already filters by type, status, and dates - no need for client-side filtering
  const filteredResults = useMemo(() => {
    return notices;
  }, [notices]);

  // Calculate paginated results for list view
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage, itemsPerPage]);

  useEffect(() => {
    if (activeNoticeId && !filteredResults.some((item) => item.id === activeNoticeId)) {
      setActiveNoticeId(null);
    }
  }, [activeNoticeId, filteredResults]);

  useEffect(() => {
    if (hoveredNoticeId && !filteredResults.some((item) => item.id === hoveredNoticeId)) {
      setHoveredNoticeId(null);
    }
  }, [hoveredNoticeId, filteredResults]);

  const hasActiveFilters = Boolean(typeFilter || statusFilter || startFilter || endFilter || councilParam || trafficAreaFilter || radiusParam);
  const searchLabel = (formatPostcodeForDisplay(postcodeParam) ?? queryParam) || 'your filters';

  const updateParams = useCallback(
    (updater: (params: URLSearchParams) => void, replace = false) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, { replace });
    },
    [searchParams, setSearchParams]
  );

  // Reset to page 1 when filters change and current page exceeds total pages
  useEffect(() => {
    if (currentPage > 1) {
      const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
      if (currentPage > totalPages) {
        updateParams((params) => params.delete('page'), true);
      }
    }
  }, [filteredResults.length, itemsPerPage, currentPage, updateParams]);

  const handleMapBoundsChange = useCallback(
    (bbox: NoticeBoundingBox, zoom: number) => {
      if (!mapView) return;
      const formattedBbox = formatBoundingBoxParam(bbox);
      const formattedZoom = zoom.toFixed(2);
      const currentZoomFormatted = typeof mapZoom === 'number' ? mapZoom.toFixed(2) : null;
      if (bboxParamRaw === formattedBbox && formattedZoom === (currentZoomFormatted ?? zoomParamRaw)) {
        return;
      }
      updateParams((params) => {
        params.set('bbox', formattedBbox);
        params.set('zoom', formattedZoom);
        params.set('view', 'map');
      }, true);
    },
    [bboxParamRaw, mapView, mapZoom, updateParams, zoomParamRaw]
  );

  const handleListSelectNotice = useCallback((notice: NoticeSearchItem) => {
    setActiveNoticeId(notice.id);
    setHoveredNoticeId(null);
  }, []);

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
        // Don't auto-filter by council since notices may not have council_id set
        // if (councilId) params.set('council', councilId);
        // else params.delete('council');
        params.delete('council'); // Remove any existing council filter
        // Keep the existing radius or use the current radiusValue
        if (!params.get('radius_km')) {
          params.set('radius_km', radiusValue.toString());
        }
        // Default to map view after address selection
        params.set('view', 'map');
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

  const toggleTrafficArea = useCallback((areaId: string) => {
    updateParams((params) => {
      if (params.get('traffic_area') === areaId) params.delete('traffic_area');
      else params.set('traffic_area', areaId);
    }, true);
  }, [updateParams]);

  const handleDateChange = useCallback((field: 'start' | 'end', value: string) => {
    updateParams((params) => {
      if (value) params.set(field, value);
      else params.delete(field);
    }, true);
  }, [updateParams]);

  const setViewMode = useCallback(
    (mode: 'map' | 'list') => {
      updateParams((params) => {
        if (mode === 'map') params.set('view', 'map');
        else params.delete('view');
      }, true);
    },
    [updateParams]
  );

  const setSort = useCallback(
    (sort: string) => {
      updateParams((params) => {
        if (sort === 'created_at.desc') {
          params.delete('sort'); // Default, no need to set
        } else {
          params.set('sort', sort);
        }
      }, true);
    },
    [updateParams]
  );

  const clearFilters = useCallback(() => {
    updateParams((params) => {
      params.delete('type');
      params.delete('status');
      params.delete('start');
      params.delete('end');
      params.delete('council');
      params.delete('traffic_area');
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

  const handlePageChange = useCallback(
    (page: number) => {
      updateParams((params) => {
        if (page === 1) {
          params.delete('page');
        } else {
          params.set('page', String(page));
        }
      }, true);
      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [updateParams]
  );

  const handleItemsPerPageChange = useCallback(
    (newItemsPerPage: number) => {
      updateParams((params) => {
        params.set('per_page', String(newItemsPerPage));
        params.delete('page'); // Reset to first page when changing items per page
      }, true);
    },
    [updateParams]
  );

  const FilterControls = ({
    layout = 'row',
    showClear = true,
    className = '',
  }: {
    layout?: 'row' | 'column';
    showClear?: boolean;
    className?: string;
  }) => {
    const stack = layout === 'column';
    const containerClass = `${stack ? 'flex flex-col gap-4' : 'flex flex-col gap-3'} ${className}`;
    const chipBase =
      'rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 backdrop-blur-sm shadow-[0_0_0_1px_rgba(14,23,42,0.04)]';
    const chipActive =
      'border-transparent bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] text-white shadow-[0_10px_24px_rgba(37,99,235,0.26)]';
    const chipInactive =
      'border-transparent bg-white/80 text-slate-600 hover:border-slate-200 hover:text-slate-900';

    return (
      <div className={containerClass}>
        <div className={`flex flex-wrap items-center gap-2 ${stack ? '' : ''}`}>
          {TYPE_OPTIONS.map((option) => {
            const active = typeFilter === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleType(option)}
                className={`${chipBase} ${active ? chipActive : chipInactive}`}
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
                className={`${chipBase} ${active ? chipActive : chipInactive}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">From</span>
            <input
              type="date"
              value={startFilter}
              onChange={(event) => handleDateChange('start', event.target.value)}
              className="h-10 rounded-lg border border-slate-200/60 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">To</span>
            <input
              type="date"
              value={endFilter}
              onChange={(event) => handleDateChange('end', event.target.value)}
              className="h-10 rounded-lg border border-slate-200/60 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Traffic Area</span>
            <select
              value={trafficAreaFilter}
              onChange={(event) => {
                const value = event.target.value;
                updateParams((params) => {
                  if (value) {
                    params.set('traffic_area', value);
                  } else {
                    params.delete('traffic_area');
                  }
                }, true);
              }}
              className="h-10 rounded-lg border border-slate-200/60 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              <option value="">All Areas</option>
              {TRAFFIC_AREAS.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Council</span>
            <select
              value={councilParam}
              onChange={(event) => {
                const value = event.target.value;
                updateParams((params) => {
                  if (value) {
                    params.set('council', value);
                  } else {
                    params.delete('council');
                  }
                }, true);
              }}
              className="h-10 rounded-lg border border-slate-200/60 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              <option value="">All Councils</option>
              {councils.map((council) => (
                <option key={council.id} value={council.id}>
                  {council.name}
                </option>
              ))}
            </select>
          </label>
          {postcodeParam && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Radius</span>
              <select
                value={radiusValue}
                onChange={(event) => {
                  updateParams((params) => {
                    const value = event.target.value;
                    if (value === '1') {
                      params.delete('radius_km'); // 1km is default
                    } else {
                      params.set('radius_km', value);
                    }
                  }, true);
                }}
                className="h-10 rounded-lg border border-slate-200/60 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              >
                <option value="0.5">500 m</option>
                <option value="1">1 km</option>
                <option value="2">2 km</option>
                <option value="5">5 km</option>
              </select>
            </label>
          )}
          {showClear && hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto rounded-full border border-transparent px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-slate-200 hover:text-slate-900"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#eef3ff] to-[#f8faff]">
      <Header />
      <div id="header-sentinel" className="h-px w-full" aria-hidden="true" />

      <main className="relative">
        <div className="mx-auto max-w-7xl space-y-10 px-6 py-12 lg:px-12">
          <section className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-slate-800 md:text-4xl">Find notices near…</h1>
              <p className="mx-auto max-w-2xl text-base text-slate-600">
                Search licensing, planning, and traffic notices across the UK. Use filters or explore the live map to
                see everything nearby.
              </p>
            </div>
            <div className="w-full max-w-3xl">
              {/* Pre-search radius selector */}
              <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm font-medium text-slate-700">Search radius:</span>
                <div className="inline-flex items-center rounded-lg bg-white/80 p-1 shadow-sm backdrop-blur-sm">
                  {[
                    { value: '0.5', label: '500m' },
                    { value: '1', label: '1km' },
                    { value: '2', label: '2km' },
                    { value: '5', label: '5km' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        updateParams((params) => {
                          if (option.value === '1') {
                            params.delete('radius_km'); // 1km is default
                          } else {
                            params.set('radius_km', option.value);
                          }
                        }, false); // Don't trigger search yet
                      }}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                        radiusValue === Number(option.value)
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      aria-pressed={radiusValue === Number(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <AddressSearchBar
                value={addressValue}
                onValueChange={(next) => {
                  setAddressValue(next);
                  setAddressInlineError(null);
                }}
                onSubmit={handleAddressSubmit}
                onFreeText={handleFreeText}
                testIdPrefix="notices"
                oneClickSelect={true}
              />
              {addressInlineError && (
                <p role="alert" className="mt-2 text-sm font-medium text-rose-600">
                  {addressInlineError}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="text-sm font-semibold text-slate-700">
                  {loading
                    ? 'Updating notices…'
                    : `${filteredResults.length} notice${filteredResults.length === 1 ? '' : 's'}`}
                </span>
                <span className="text-slate-500">
                  for <span className="font-semibold text-slate-700">{searchLabel}</span>
                </span>
                {hasActiveFilters && (
                  <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                    Filters on
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/80 px-4 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-200 hover:text-slate-900 lg:hidden"
                >
                  Filters
                </button>

                {/* Sort dropdown */}
                <select
                  value={sortParam}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-full border border-slate-200/60 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                >
                  <option value="created_at.desc">Most Recent</option>
                  {postcodeParam && <option value="distance.asc">Nearest</option>}
                  <option value="created_at.asc">Oldest</option>
                </select>

                <div className="flex rounded-full bg-slate-100/90 p-1 shadow-inner transition">
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                      mapView
                        ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.08)]'
                        : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'
                    }`}
                  >
                    Map view
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                      mapView
                        ? 'text-slate-500 hover:bg-white/70 hover:text-slate-700'
                        : 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.08)]'
                    }`}
                  >
                    List view
                  </button>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="hidden items-center rounded-full border border-transparent px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-slate-200 hover:text-slate-900 lg:inline-flex"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                <FilterControls showClear={false} className="w-full" />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-rose-200/70 bg-white px-6 py-5 text-sm text-rose-700 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <p className="font-medium">
                Search failed for <span className="font-semibold text-rose-800">{searchLabel}</span>. {error}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={retryFetch}
                  className="inline-flex items-center rounded-full border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={broadenRadius}
                  className="inline-flex items-center rounded-full border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
                >
                  Broaden search
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center rounded-full border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {mapView ? (
              <motion.div
                key="map-view"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <div className="grid gap-4 lg:grid-cols-[70%_30%]">
                  <section className="relative order-2 lg:order-1">
                    <div className="relative h-[400px] overflow-hidden rounded-xl shadow-lg sm:h-[480px] md:h-[580px] lg:h-[80vh]">
                      <NoticesMapView
                        notices={filteredResults}
                        loading={loading}
                        activeNoticeId={activeNoticeId}
                        hoveredNoticeId={hoveredNoticeId}
                        onActiveNoticeChange={setActiveNoticeId}
                        onHoverNoticeChange={setHoveredNoticeId}
                        onBoundsChange={handleMapBoundsChange}
                        initialBounds={mapBoundingBox}
                        initialViewState={mapZoom ? { zoom: mapZoom } : undefined}
                        autoFitToNotices={!mapBoundingBox}
                        searchedLocation={searchedLocation}
                        className="h-full"
                      />
                      <div className="pointer-events-none absolute left-4 top-4 z-10">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-800 shadow-md backdrop-blur">
                          {loading
                            ? 'Loading notices…'
                            : `${filteredResults.length} notice${filteredResults.length === 1 ? '' : 's'}`}
                        </span>
                      </div>
                    </div>
                  </section>

                  <aside className="order-1 flex h-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-lg sm:h-[480px] md:h-[580px] lg:order-2 lg:h-[80vh]">
                    <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-5 py-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-base font-bold text-slate-900">
                            {loading
                              ? 'Updating results…'
                              : `${filteredResults.length} Notice${filteredResults.length === 1 ? '' : 's'} Found`}
                          </p>
                          <p className="text-sm text-slate-600 mt-0.5">{searchLabel}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFiltersOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          Filters
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <SearchResults
                        results={filteredResults}
                        query={searchLabel}
                        loading={loading}
                        loadingMessage="Loading notices…"
                        emptyMessage="No notices found in this area."
                        activeNoticeId={activeNoticeId}
                        onSelectNotice={handleListSelectNotice}
                        onHoverNotice={setHoveredNoticeId}
                        layout="list"
                        maxResults={showAllMapResults ? undefined : 10}
                        showMoreButton={!showAllMapResults}
                        onShowMore={() => setShowAllMapResults(true)}
                        sortBy={sortParam}
                        onSortChange={(newSort) => {
                          updateParams((params) => {
                            params.set('sort', newSort);
                          });
                        }}
                        showInlineFilters={true}
                        hasLocation={Boolean(postcodeParam)}
                      />
                    </div>
                  </aside>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <div className="rounded-2xl border border-white/50 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 px-6 py-5">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {loading
                          ? 'Updating results…'
                          : `${filteredResults.length} notice${filteredResults.length === 1 ? '' : 's'}`}
                      </p>
                      <p className="text-xs text-slate-500">For {searchLabel}</p>
                    </div>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center rounded-full border border-transparent px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-slate-200 hover:text-slate-900"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                  <div className="px-6 py-6">
                    <SearchResults
                      results={paginatedResults}
                      query={searchLabel}
                      loading={loading}
                      loadingMessage="Loading notices…"
                      activeNoticeId={activeNoticeId}
                      onSelectNotice={handleListSelectNotice}
                      onHoverNotice={setHoveredNoticeId}
                    />
                    {!loading && filteredResults.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalItems={filteredResults.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notice-filters-title"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 id="notice-filters-title" className="text-base font-semibold text-slate-800">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-900"
                aria-label="Close filters"
              >
                ×
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <FilterControls layout="column" className="w-full" />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    clearFilters();
                    setFiltersOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-200 hover:text-slate-900"
                >
                  Clear filters
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}

      {/* Email Alert Subscription Section */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            {!showSubscriptionForm ? (
              <>
                <Bell className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h2 className="text-2xl font-semibold text-slate-800 mb-3">
                  Stay informed about new notices
                </h2>
                <p className="text-base text-slate-600 mb-6">
                  Get email alerts when new notices are published near you. Choose your preferred radius and we'll keep you updated.
                </p>
                <button
                  onClick={() => setShowSubscriptionForm(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  Set up email alerts
                </button>
              </>
            ) : (
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">
                  Set up email alerts
                </h2>
                <EmailAlertSubscriptionForm
                  postcode={postcodeParam ? formatPostcodeForDisplay(postcodeParam) : undefined}
                  onSuccess={() => {
                    setShowSubscriptionForm(false);
                    toast('Email alert created! Check your inbox to verify.');
                  }}
                />
                <button
                  onClick={() => setShowSubscriptionForm(false)}
                  className="mt-4 text-sm text-slate-600 hover:text-slate-900 underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
