/**
 * TableRowSkeleton - Skeleton placeholder for table rows
 * Used in notice lists, user lists, billing tables, etc.
 */

interface TableRowSkeletonProps {
  /** Number of rows to render */
  rows?: number;
  /** Number of columns per row */
  columns?: number;
  /** Column widths (w-* classes or percentages) */
  columnWidths?: string[];
  /** Whether to show checkbox column */
  showCheckbox?: boolean;
  /** Whether to show action column */
  showActions?: boolean;
  /** Additional CSS classes for the wrapper */
  className?: string;
}

export function TableRowSkeleton({
  rows = 5,
  columns = 4,
  columnWidths,
  showCheckbox = false,
  showActions = false,
  className = ''
}: TableRowSkeletonProps) {
  const defaultWidths = ['w-32', 'w-48', 'w-24', 'w-20', 'w-16', 'w-24'];

  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 py-4 border-b border-gray-100"
        >
          {showCheckbox && (
            <div className="h-5 w-5 bg-gray-200 rounded" />
          )}
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`h-4 bg-gray-200 rounded ${
                columnWidths?.[colIndex] || defaultWidths[colIndex % defaultWidths.length]
              }`}
            />
          ))}
          {showActions && (
            <div className="ml-auto flex gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-200 rounded" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * NoticeTableSkeleton - Skeleton matching notice table layout
 */
export function NoticeTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header placeholder */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="h-4 bg-gray-300 rounded w-16" />
          <div className="h-4 bg-gray-300 rounded w-24" />
          <div className="h-4 bg-gray-300 rounded w-20" />
          <div className="h-4 bg-gray-300 rounded w-16" />
          <div className="h-4 bg-gray-300 rounded w-20 ml-auto" />
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-4 animate-pulse">
            <div className="flex items-center gap-4">
              {/* Status indicator */}
              <div className="h-3 w-3 bg-gray-200 rounded-full" />
              {/* Title/Applicant */}
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
              {/* Type badge */}
              <div className="h-6 bg-gray-200 rounded-full w-20" />
              {/* Date */}
              <div className="h-4 bg-gray-200 rounded w-24" />
              {/* Actions */}
              <div className="h-8 w-8 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * UserListSkeleton - Skeleton for team member lists
 */
export function UserListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
          {/* Avatar */}
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
          {/* Name and email */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-48" />
          </div>
          {/* Role badge */}
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          {/* Actions */}
          <div className="h-8 w-20 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export default TableRowSkeleton;
