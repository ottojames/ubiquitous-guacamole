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
    ? 'space-y-4'
    : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3';

  const handleCardClick = (item: NoticeSearchItem) => {
    if (onSelectNotice) {
      onSelectNotice(item);
    } else {
      // Navigate to detail page
      navigate(`/notices/${item.id}`);
    }
  };

  const getCardClasses = (isActive: boolean) => {
    if (layout === 'list') {
      return `group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm border transition-all hover:shadow-md cursor-pointer ${
        isActive
          ? 'border-blue-600 bg-blue-50/30 shadow-blue-100'
          : 'border-slate-200 hover:border-blue-400'
      }`;
    }
    return `group relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-slate-300 cursor-pointer ${
      isActive ? 'ring-2 ring-blue-600' : ''
    }`;
  };

  return (
    <>
      <div className={containerClass}>
        {displayResults.map((item, idx) => {
          const isActive = activeNoticeId === item.id;
          return (
            <article
              key={item.id}
              className={getCardClasses(isActive)}
              onClick={() => handleCardClick(item)}
              onMouseEnter={() => {
                if (onHoverNotice) onHoverNotice(item.id);
              }}
              onMouseLeave={() => {
                if (onHoverNotice) onHoverNotice(null);
              }}
            >
              {/* Background gradient accent */}
              {layout !== 'list' && (
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-100/20 blur-2xl transition-all group-hover:scale-150" />
              )}

              <div className="relative">
                {/* Notice type badge */}
                <div className={`${layout === 'list' ? 'mb-1.5' : 'mb-4'} inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm`}>
                  {item.noticeType}
                </div>

                {/* Premises name */}
                <h3 className={`${layout === 'list' ? 'mb-0.5 text-sm' : 'mb-2 text-xl'} font-bold leading-tight text-slate-900`}>
                  {item.premisesName || 'Unnamed premises'}
                </h3>

                {/* Address */}
                <p className={`${layout === 'list' ? 'mb-1.5 text-xs line-clamp-1' : 'mb-4 text-sm'} leading-relaxed text-slate-600`}>
                  {formatAddress(item.premisesAddress) || 'Address not provided'}
                </p>

                {/* Metadata grid */}
                <div className={`${layout === 'list' ? 'space-y-0.5 pt-1.5' : 'mb-6 space-y-2 pt-4'} border-t border-slate-100`}>
                  {item.publicationDate && (
                    <div className={`flex items-center justify-between ${layout === 'list' ? 'text-xs' : 'text-xs'}`}>
                      <span className="text-slate-500 font-medium">Published</span>
                      <span className="font-semibold text-slate-800">{formatShortDate(item.publicationDate)}</span>
                    </div>
                  )}
                  {item.repsDeadline && (
                    <div className={`flex items-center justify-between ${layout === 'list' ? 'text-xs' : 'text-xs'}`}>
                      <span className="text-slate-500 font-medium">Deadline</span>
                      <span className="font-semibold text-slate-800">{formatShortDate(item.repsDeadline)}</span>
                    </div>
                  )}
                  {layout !== 'list' && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Status</span>
                      <span className="inline-flex items-center gap-1.5 capitalize font-semibold text-slate-800">
                        <span className={`h-2 w-2 rounded-full ${item.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {item.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* View link - only show in grid layout */}
                {layout !== 'list' && (
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
                )}
              </div>
            </article>
          );
        })}
      </div>

      {showMoreButton && hasMore && onShowMore && (
        <button
          type="button"
          onClick={onShowMore}
          className="mt-6 w-full rounded-xl border-2 border-blue-600 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          Show all {results.length} notices
        </button>
      )}
    </>
  );
}
