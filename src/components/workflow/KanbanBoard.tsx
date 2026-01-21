import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { cn } from '@/lib/cn';
import { useTransitionStage } from '@/hooks/useWorkflow';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import type { WorkflowStage, NoticeWithWorkflow } from '@/types/workflow';

export interface KanbanBoardProps {
  /** Workflow stages to display as columns */
  stages: WorkflowStage[];
  /** Notices grouped by current stage ID */
  noticesByStage: Record<string, NoticeWithWorkflow[]>;
  /** Callback when a notice is successfully moved */
  onNoticeMoved?: (noticeId: string, fromStageId: string, toStageId: string) => void;
  /** Additional className for the board container */
  className?: string;
}

/**
 * Kanban board for visualizing workflow stages and notices.
 * Uses dnd-kit for drag-and-drop stage transitions.
 */
export function KanbanBoard({
  stages,
  noticesByStage,
  onNoticeMoved,
  className,
}: KanbanBoardProps) {
  const [activeNotice, setActiveNotice] = useState<NoticeWithWorkflow | null>(null);
  const { mutate: transitionStage, isPending } = useTransitionStage();

  // Configure pointer sensor with slight activation delay to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Sort stages by position for correct column order
  const sortedStages = [...stages].sort((a, b) => a.position - b.position);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Get the notice data from the draggable
    const notice = active.data.current?.notice as NoticeWithWorkflow | undefined;
    if (notice) {
      setActiveNotice(notice);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNotice(null);

    if (!over) return;

    const noticeId = active.id as string;
    const toStageId = over.id as string;
    const notice = active.data.current?.notice as NoticeWithWorkflow | undefined;

    if (!notice) return;

    const fromStageId = notice.workflow_status?.current_stage_id;

    // Don't transition if dropped on same stage
    if (fromStageId === toStageId) return;

    // Call the transition API
    transitionStage(
      { noticeId, toStageId },
      {
        onSuccess: () => {
          if (fromStageId) {
            onNoticeMoved?.(noticeId, fromStageId, toStageId);
          }
        },
        onError: (error) => {
          console.error('Failed to transition notice:', error.message);
        },
      }
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          'flex gap-4 overflow-x-auto pb-4',
          isPending && 'opacity-75 pointer-events-none',
          className
        )}
      >
        {sortedStages.map((stage) => {
          const notices = noticesByStage[stage.id] || [];
          return (
            <KanbanColumn key={stage.id} stage={stage} count={notices.length}>
              {notices.map((notice) => (
                <KanbanCard key={notice.id} notice={notice} />
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      {/* Drag overlay shows a preview of the card being dragged */}
      <DragOverlay>
        {activeNotice ? (
          <KanbanCard notice={activeNotice} className="shadow-xl rotate-3" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
