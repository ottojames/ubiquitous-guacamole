import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NoticeSearchItem } from '@/lib/notices';

type NoticeCarouselProps = {
  notices: NoticeSearchItem[];
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  autoplayInterval?: number; // ms, default 5000
};

function formatAddress(address: unknown): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  if (typeof address === 'object' && address !== null) {
    const addr = address as { line1?: string; line2?: string; town?: string; postcode?: string };
    const parts = [addr.line1, addr.line2, addr.town, addr.postcode]
      .map((part) => (part ?? '').trim())
      .filter(Boolean);
    return parts.join(', ');
  }
  return '';
}

function formatShortDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

// Skeleton loader for carousel
function CarouselSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200/60">
          <div className="space-y-4">
            <div className="h-6 bg-slate-200 rounded-full w-24" />
            <div className="space-y-2">
              <div className="h-5 bg-slate-200 rounded w-full" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
            </div>
            <div className="space-y-1">
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="h-4 bg-slate-100 rounded w-24" />
              <div className="h-4 bg-slate-100 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Single notice card component
function NoticeCard({ notice, onClick }: { notice: NoticeSearchItem; onClick: () => void }) {
  return (
    <article
      className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-slate-300 cursor-pointer h-full flex flex-col"
      onClick={onClick}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-100/20 blur-2xl transition-all group-hover:scale-150" />
      <div className="relative flex-1 flex flex-col">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm w-fit">
          {notice.noticeType}
        </div>
        <h3 className="mb-2 text-xl font-bold leading-tight text-slate-900 line-clamp-2">
          {notice.premisesName || 'Unnamed premises'}
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-slate-600 line-clamp-2 flex-1">
          {formatAddress(notice.premisesAddress) || 'Address not provided'}
        </p>
        <div className="mb-6 space-y-2 pt-4 border-t border-slate-100">
          {notice.publicationDate && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Published</span>
              <span className="font-semibold text-slate-800">{formatShortDate(notice.publicationDate)}</span>
            </div>
          )}
          {notice.repsDeadline && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Deadline</span>
              <span className="font-semibold text-slate-800">{formatShortDate(notice.repsDeadline)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Status</span>
            <span className="inline-flex items-center gap-1.5 capitalize font-semibold text-slate-800">
              <span className={`h-2 w-2 rounded-full ${notice.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {notice.status}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="group/link inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:gap-3 mt-auto"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          View full notice
          <ArrowRight className="h-4 w-4 transition-transform" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function NoticeCarousel({
  notices,
  loading,
  loadingMessage,
  emptyMessage,
  autoplayInterval = 5000,
}: NoticeCarouselProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const containerRef = useRef<HTMLDivElement>(null);

  // Number of cards per page based on viewport (3 for desktop, 2 for tablet, 1 for mobile)
  // For simplicity, we'll use 3 cards per page and let CSS handle responsiveness
  const cardsPerPage = 3;
  const totalPages = Math.ceil(notices.length / cardsPerPage);

  // Autoplay
  useEffect(() => {
    if (isPaused || loading || notices.length === 0 || totalPages <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, autoplayInterval);
    return () => clearInterval(timer);
  }, [isPaused, loading, notices.length, totalPages, autoplayInterval]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setDirection(-1);
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setDirection(1);
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }
  }, [totalPages]);

  const goToPrevPage = () => {
    setDirection(-1);
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToNextPage = () => {
    setDirection(1);
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const goToPage = (page: number) => {
    setDirection(page > currentPage ? 1 : -1);
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">{loadingMessage ?? 'Loading notices...'}</p>
        <CarouselSkeleton />
      </div>
    );
  }

  if (!notices.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12 text-center shadow-sm">
        <p className="text-lg text-slate-600">{emptyMessage ?? 'No notices found.'}</p>
      </div>
    );
  }

  // Get current page notices
  const startIndex = currentPage * cardsPerPage;
  const currentNotices = notices.slice(startIndex, startIndex + cardsPerPage);

  // Animation variants
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Recent notices carousel"
      aria-roledescription="carousel"
    >
      {/* Navigation arrows */}
      {totalPages > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevPage}
            className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-200 transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 md:-left-6"
            aria-label="Previous notices"
          >
            <ChevronLeft className="h-6 w-6 text-slate-700" />
          </button>
          <button
            type="button"
            onClick={goToNextPage}
            className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-200 transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 md:-right-6"
            aria-label="Next notices"
          >
            <ChevronRight className="h-6 w-6 text-slate-700" />
          </button>
        </>
      )}

      {/* Carousel content */}
      <div className="overflow-hidden px-2 py-2">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            aria-live="polite"
          >
            {currentNotices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onClick={() => navigate(`/notices/${notice.id}`)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2" role="tablist" aria-label="Carousel pages">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToPage(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                idx === currentPage
                  ? 'w-8 bg-blue-600'
                  : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              role="tab"
              aria-selected={idx === currentPage}
              aria-label={`Go to page ${idx + 1} of ${totalPages}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
