import { cn } from '@/lib/cn';
import { Clock, AlertTriangle } from 'lucide-react';
import type { WorkflowStage } from '@/types/workflow';

export interface WorkflowStageBadgeProps {
  stage: Pick<WorkflowStage, 'name' | 'color'>;
  /** Deadline date (ISO string). Shows indicator when present. */
  deadline?: string | null;
  /** Size variant */
  size?: 'sm' | 'default';
  className?: string;
}

/**
 * Badge showing workflow stage name with color and optional deadline indicator.
 * Used in Kanban cards, notice lists, and status displays.
 */
export function WorkflowStageBadge({
  stage,
  deadline,
  size = 'default',
  className,
}: WorkflowStageBadgeProps) {
  const isOverdue = deadline ? new Date(deadline) < new Date() : false;
  const isUpcoming = deadline && !isOverdue
    ? new Date(deadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 // 3 days
    : false;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        sizeClasses,
        className
      )}
      style={{
        backgroundColor: `${stage.color}20`, // 12.5% opacity
        color: stage.color,
      }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: stage.color }}
      />
      <span className="truncate">{stage.name}</span>
      {isOverdue && (
        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" aria-label="Overdue" />
      )}
      {isUpcoming && !isOverdue && (
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-label="Deadline soon" />
      )}
    </span>
  );
}
