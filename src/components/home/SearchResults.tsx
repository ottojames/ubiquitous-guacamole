import React from 'react';
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
}: SearchResultsProps) {
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

  // Limit to 3 notices for visual cleanliness on home page
  const displayResults = results.slice(0, 3);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {displayResults.map((item, idx) => {
        const href = item.viewUrl ?? `/notices/${item.id}`;
        const isActive = activeNoticeId === item.id;
        return (
          <article
            key={item.id}
            className={`group relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-slate-300 ${isActive ? 'ring-2 ring-blue-600' : ''} ${onSelectNotice ? 'cursor-pointer' : ''}`}
            onClick={() => {
              if (onSelectNotice) onSelectNotice(item);
            }}
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
              {/* Notice type badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">
                {item.noticeType}
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
              <a
                href={href}
                className="group/link inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:gap-3"
              >
                View full notice
                <ArrowRight className="h-4 w-4 transition-transform" aria-hidden="true" />
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
