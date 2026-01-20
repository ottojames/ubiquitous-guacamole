/**
 * CardSkeleton - Skeleton placeholder for stat/metric cards
 * Used in dashboards during data loading
 */

interface CardSkeletonProps {
  /** Number of cards to render */
  count?: number;
  /** Whether to show icon placeholder */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function CardSkeleton({
  count = 1,
  showIcon = true,
  className = ''
}: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-white rounded-lg border border-gray-200 p-6 animate-pulse ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              {/* Label placeholder */}
              <div className="h-4 bg-gray-200 rounded w-24" />
              {/* Value placeholder */}
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
            {showIcon && (
              /* Icon placeholder */
              <div className="h-10 w-10 bg-gray-200 rounded-lg" />
            )}
          </div>
          {/* Optional subtitle/change indicator */}
          <div className="mt-3 h-3 bg-gray-100 rounded w-20" />
        </div>
      ))}
    </>
  );
}

/**
 * StatCardSkeleton - Skeleton for stat cards with specific layout
 * Matches the layout of stat cards in dashboards
 */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CardSkeleton count={count} />
    </div>
  );
}

/**
 * SubscriptionCardSkeleton - Skeleton for firm subscription card
 */
export function SubscriptionCardSkeleton() {
  return (
    <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg border border-purple-200 p-6 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          {/* Plan name */}
          <div className="h-6 bg-purple-200 rounded w-32" />
          {/* Price */}
          <div className="h-8 bg-purple-200 rounded w-24" />
          {/* Status badge */}
          <div className="h-5 bg-purple-200 rounded-full w-16" />
        </div>
        {/* Icon/graphic placeholder */}
        <div className="h-16 w-16 bg-purple-200 rounded-lg" />
      </div>
      {/* Progress bar placeholder */}
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-purple-100 rounded w-full" />
        <div className="h-4 bg-purple-100 rounded w-32" />
      </div>
    </div>
  );
}

export default CardSkeleton;
