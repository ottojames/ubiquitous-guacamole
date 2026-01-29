/**
 * ListItemSkeleton - Skeleton placeholder for list items
 * Used in activity feeds, recent items lists, representations, etc.
 */

interface ListItemSkeletonProps {
  /** Number of items to render */
  count?: number;
  /** Show avatar/icon placeholder */
  showAvatar?: boolean;
  /** Show timestamp placeholder */
  showTimestamp?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ListItemSkeleton({
  count = 5,
  showAvatar = true,
  showTimestamp = true,
  className = ''
}: ListItemSkeletonProps) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
          {showAvatar && (
            <div className="h-8 w-8 bg-gray-200 rounded-full flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            {/* Title line */}
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            {/* Description line */}
            <div className="h-3 bg-gray-100 rounded w-full" />
            {showTimestamp && (
              <div className="h-3 bg-gray-100 rounded w-20" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * RecentNoticesSkeleton - Skeleton for recent notices widget
 */
export function RecentNoticesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
          {/* Status dot */}
          <div className="h-2 w-2 bg-gray-200 rounded-full" />
          {/* Content */}
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-gray-200 rounded w-4/5" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
          {/* Arrow/action */}
          <div className="h-4 w-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * ActivityFeedSkeleton - Skeleton for activity/audit log feeds
 */
export function ActivityFeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          {/* Timeline dot and line */}
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 bg-gray-200 rounded-full" />
            {i < count - 1 && (
              <div className="w-0.5 h-12 bg-gray-100 mt-1" />
            )}
          </div>
          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-3/4 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * RepresentationsSkeleton - Skeleton for representations list
 */
export function RepresentationsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {/* Type badge */}
              <div className="h-6 bg-gray-200 rounded-full w-20" />
              {/* Date */}
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
            {/* Status */}
            <div className="h-6 bg-gray-200 rounded-full w-16" />
          </div>
          {/* Name */}
          <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
          {/* Content preview */}
          <div className="space-y-1">
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * DeadlinesSkeleton - Skeleton for upcoming deadlines widget
 */
export function DeadlinesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
          {/* Calendar icon */}
          <div className="h-10 w-10 bg-gray-200 rounded-lg flex-shrink-0" />
          {/* Content */}
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
          {/* Days remaining */}
          <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
      ))}
    </div>
  );
}

export default ListItemSkeleton;
