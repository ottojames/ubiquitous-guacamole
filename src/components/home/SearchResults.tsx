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

export default function SearchResults({ results, query, loading, loadingMessage, emptyMessage }: SearchResultsProps) {
  if (loading) {
    return <p className="text-sm text-neutral-600">{loadingMessage ?? `Searching for “${query}”...`}</p>;
  }
  if (!results.length) {
    return <p className="text-sm text-neutral-600">{emptyMessage ?? `No notices found for “${query}”.`}</p>;
  }
  return (
    <div className="space-y-4">
      {results.map((item) => {
        const href = item.viewUrl ?? `/notices/${item.id}`;
        return (
          <article key={item.id} className={`${UI.card} p-5`}>
            <h3 className="text-base font-semibold text-neutral-900">{item.noticeType}</h3>
            <p className="mt-1 text-sm text-neutral-600">{item.premisesName || 'Unnamed premises'}</p>
            <p className="text-sm text-neutral-500">{formatAddress(item.premisesAddress)}</p>
            <dl className="mt-3 grid gap-2 text-xs text-neutral-500 md:grid-cols-3">
              {item.repsDeadline && (
              <div>
                <dt className="font-medium text-neutral-700">Reps deadline</dt>
                <dd>{formatShortDate(item.repsDeadline)}</dd>
              </div>
            )}
            {item.publicationDate && (
              <div>
                <dt className="font-medium text-neutral-700">Publication date</dt>
                <dd>{formatShortDate(item.publicationDate)}</dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-neutral-700">Status</dt>
              <dd className="capitalize">{item.status}</dd>
            </div>
            </dl>
            <div className="mt-4">
              <a
                href={href}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white rounded"
              >
                View notice
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
