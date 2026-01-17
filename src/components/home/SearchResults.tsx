import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { NoticeSearchItem } from '@/lib/notices';
import * as UI from '@/styles/ui';

type SearchResultsProps = {
  results: NoticeSearchItem[];
  query: string;
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  activeNoticeId?: string | null;
  onSelectNotice?: (notice: NoticeSearchItem) => void;
  onHoverNotice?: (noticeId: string | null) => void;
  maxResults?: number; // undefined = show all
  layout?: 'grid' | 'list'; // grid for main view, list for sidebar
  onShowMore?: () => void; // callback when "Show More" is clicked
  showMoreButton?: boolean; // whether to show "Show More" button
};

function formatAddress(address: any): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  const parts = [address.line1, address.line2, address.town, address.postcode]
    .map((part) => (part ?? '').trim())
    .filter(Boolean);
  return parts.join(', ');
}

function formatShortDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SearchResults({
  results,
  query,
  loading,
  loadingMessage,
  emptyMessage,
  activeNoticeId,
  onSelectNotice,
  onHoverNotice,
  maxResults,
  layout = 'grid',
  onShowMore,
  showMoreButton = false,
}: SearchResultsProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-base text-slate-600">{loadingMessage ?? `Searching for "${query}"...`}</p>
        </div>
      </div>
    );
  }
  if (!results.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12 text-center shadow-sm">
        <p className="text-lg text-slate-600">{emptyMessage ?? `No notices found for "${query}".`}</p>
      </div>
    );
  }

  // Optionally limit results (e.g., for home page preview)
  const displayResults = maxResults ? results.slice(0, maxResults) : results;
  const hasMore = maxResults && results.length > maxResults;

  const containerClass = layout === 'list'
    ? 'divide-y divide-slate-200'
    : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3';

  const handleCardClick = (item: NoticeSearchItem) => {
    if (onSelectNotice) {
      onSelectNotice(item);
    } else {
      // Navigate to detail page
      navigate(`/notices/${item.id}`);
    }
  };

  // Render compact list items for map sidebar
  if (layout === 'list') {
    return (
      <>
        <div className={containerClass}>
          {displayResults.map((item) => {
            const isActive = activeNoticeId === item.id;
            const daysUntilDeadline = item.repsDeadline
              ? Math.ceil((new Date(item.repsDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const urgencyClass = daysUntilDeadline !== null && daysUntilDeadline <= 7
              ? 'text-red-600 font-semibold'
              : daysUntilDeadline !== null && daysUntilDeadline <= 14
              ? 'text-amber-600 font-medium'
              : 'text-slate-600';

            // Format distance for display
            const formatDistance = (km?: number | null): string | null => {
              if (km == null) return null;
              if (km < 1) {
                return `${Math.round(km * 1000)}m away`;
              }
              return `${km.toFixed(1)}km away`;
            };

            const distanceText = formatDistance(item.distance);

            return (
              <article
                key={item.id}
                className={`group relative cursor-pointer border-b border-slate-100 px-4 py-5 transition-all last:border-b-0 hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-white ${
                  isActive ? 'bg-gradient-to-r from-blue-50 to-white border-l-4 border-l-blue-600 shadow-sm' : ''
                }`}
                onClick={() => handleCardClick(item)}
                onMouseEnter={() => {
                  if (onHoverNotice) onHoverNotice(item.id);
                }}
                onMouseLeave={() => {
                  if (onHoverNotice) onHoverNotice(null);
                }}
              >
                <div className="space-y-2.5">
                  {/* Top row: Type badge and deadline */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900">
                      {item.noticeType}
                    </span>
                    {item.repsDeadline && (
                      <span className={`text-[11px] font-bold uppercase ${urgencyClass}`}>
                        {daysUntilDeadline !== null && daysUntilDeadline >= 0
                          ? `${daysUntilDeadline}d left`
                          : 'Expired'}
                      </span>
                    )}
                  </div>

                  {/* Premises name - more prominent */}
                  <h3 className="font-bold text-sm text-slate-900 leading-tight line-clamp-2">
                    {item.premisesName || 'Unnamed premises'}
                  </h3>

                  {/* Address - compact */}
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {formatAddress(item.premisesAddress) || 'Address not provided'}
                  </p>

                  {/* View action and distance - more subtle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-semibold text-blue-600 group-hover:text-blue-700">
                      View Details →
                    </span>
                    {distanceText && (
                      <span className="text-[11px] font-medium text-slate-500">
                        {distanceText}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {showMoreButton && hasMore && onShowMore && (
          <div className="p-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onShowMore}
              className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1"
            >
              Show all {results.length} notices
            </button>
          </div>
        )}
      </>
    );
  }

  // Format distance for display
  const formatDistance = (km?: number | null): string | null => {
    if (km == null) return null;
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  // Original grid layout for main view
  return (
    <>
      <div className={containerClass}>
        {displayResults.map((item, idx) => {
          const isActive = activeNoticeId === item.id;
          const distanceText = formatDistance(item.distance);
          return (
            <article
              key={item.id}
              className={`group relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-slate-300 cursor-pointer ${isActive ? 'ring-2 ring-blue-600' : ''}`}
              onClick={() => handleCardClick(item)}
              onMouseEnter={() => {
                if (onHoverNotice) onHoverNotice(item.id);
              }}
              onMouseLeave={() => {
                if (onHoverNotice) onHoverNotice(null);
              }}
            >
              {/* Background gradient accent */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-100/20 blur-2xl transition-all group-hover:scale-150" />

              <div className="relative">
                {/* Notice type badge and distance */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">
                    {item.noticeType}
                  </div>
                  {distanceText && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      <svg className="h-3 w-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {distanceText}
                    </div>
                  )}
                </div>

                {/* Premises name */}
                <h3 className="mb-2 text-xl font-bold leading-snug text-slate-900">
                  {item.premisesName || 'Unnamed premises'}
                </h3>

                {/* Address */}
                <p className="mb-4 text-sm leading-relaxed text-slate-600">
                  {formatAddress(item.premisesAddress) || 'Address not provided'}
                </p>

                {/* Metadata grid */}
                <div className="mb-6 space-y-2 border-t border-slate-100 pt-4">
                  {item.publicationDate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Published</span>
                      <span className="font-medium text-slate-700">{formatShortDate(item.publicationDate)}</span>
                    </div>
                  )}
                  {item.repsDeadline && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Deadline</span>
                      <span className="font-medium text-slate-700">{formatShortDate(item.repsDeadline)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Status</span>
                    <span className="inline-flex items-center gap-1.5 capitalize font-medium text-slate-700">
                      <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* View link */}
                <button
                  type="button"
                  className="group/link inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:gap-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/notices/${item.id}`);
                  }}
                >
                  View full notice
                  <ArrowRight className="h-4 w-4 transition-transform" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {showMoreButton && hasMore && onShowMore && (
        <button
          type="button"
          onClick={onShowMore}
          className="mt-4 w-full rounded-lg border-2 border-blue-600 bg-white px-4 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          Show all {results.length} notices
        </button>
      )}
    </>
  );
}
