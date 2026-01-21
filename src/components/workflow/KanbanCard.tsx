import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/cn';
import { Clock, AlertTriangle, MapPin } from 'lucide-react';
import type { NoticeWithWorkflow } from '@/types/workflow';

export interface KanbanCardProps {
  /** Notice data with workflow status */
  notice: NoticeWithWorkflow;
  /** Additional className for the card container */
  className?: string;
}

/**
 * Draggable Kanban card for a notice.
 * Displays client/applicant name, premises address, and deadline indicator.
 * Uses dnd-kit useDraggable for drag-and-drop support.
 */
export function KanbanCard({ notice, className }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: notice.id,
    data: { notice }, // Pass notice data for access in drag handlers
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const deadline = notice.workflow_status?.deadline_date;
  const isOverdue = deadline ? new Date(deadline) < new Date() : false;
  const isUpcoming =
    deadline && !isOverdue
      ? new Date(deadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 // 3 days
      : false;

  // Format deadline date for display
  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'bg-white rounded-lg border border-slate-200 p-3 cursor-grab shadow-sm',
        'hover:shadow-md hover:border-slate-300 transition-shadow',
        isDragging && 'opacity-50 shadow-lg cursor-grabbing',
        className
      )}
    >
      {/* Client/Applicant Name */}
      <div className="font-medium text-slate-900 text-sm truncate">
        {notice.applicant_name}
      </div>

      {/* Premises Address */}
      <div className="flex items-start gap-1 mt-1">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span className="text-xs text-slate-600 line-clamp-2">
          {notice.premises_name ? `${notice.premises_name}, ` : ''}
          {notice.premises_address}
        </span>
      </div>

      {/* Deadline Row */}
      {deadline && (
        <div
          className={cn(
            'flex items-center gap-1 mt-2 text-xs font-medium',
            isOverdue && 'text-red-600',
            isUpcoming && !isOverdue && 'text-amber-600',
            !isOverdue && !isUpcoming && 'text-slate-500'
          )}
        >
          {isOverdue ? (
            <AlertTriangle className="w-3.5 h-3.5" aria-label="Overdue" />
          ) : (
            <Clock className="w-3.5 h-3.5" aria-label="Deadline" />
          )}
          <span>{formatDeadline(deadline)}</span>
          {isOverdue && <span className="ml-1">Overdue</span>}
        </div>
      )}
    </div>
  );
}
