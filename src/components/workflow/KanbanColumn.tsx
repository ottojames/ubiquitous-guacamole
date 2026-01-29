import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/cn';
import type { WorkflowStage } from '@/types/workflow';
import type { ReactNode } from 'react';

export interface KanbanColumnProps {
  /** The workflow stage this column represents */
  stage: WorkflowStage;
  /** Number of notices in this column */
  count: number;
  /** Children (typically KanbanCard components) */
  children: ReactNode;
  /** Additional className for the column container */
  className?: string;
}

/**
 * Kanban board column representing a workflow stage.
 * Uses dnd-kit useDroppable for drag-and-drop support.
 * Children are typically KanbanCard components that are draggable.
 */
export function KanbanColumn({
  stage,
  count,
  children,
  className,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { stage }, // Pass stage data for access in drag handlers
  });

  return (
    <div
      className={cn(
        'flex flex-col min-w-[280px] max-w-[320px] bg-slate-50 rounded-lg',
        className
      )}
    >
      {/* Column Header */}
      <div className="px-3 py-2 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: stage.color }}
            />
            <span className="font-medium text-slate-900 text-sm truncate">
              {stage.name}
            </span>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-2 space-y-2 min-h-[200px] transition-colors duration-150',
          isOver && 'bg-blue-50 ring-2 ring-blue-200 ring-inset'
        )}
      >
        {children}
        {count === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-slate-400 italic">
            No notices
          </div>
        )}
      </div>
    </div>
  );
}
