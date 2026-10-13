import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';
import { DueBadge } from '../ui/Badges.jsx';
import { PRIORITY_META, STATUS_META, TASK_STATUSES } from '../../lib/constants.js';

export default function TaskCard({ task, onOpen, onStep, onDragStart, onDragEnd, dragging }) {
  const index = TASK_STATUSES.indexOf(task.status);
  const previous = TASK_STATUSES[index - 1];
  const next = TASK_STATUSES[index + 1];

  return (
    <article
      role="listitem"
      draggable
      data-task-id={task.id}
      onDragStart={(event) => onDragStart(event, task)}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-control border border-line bg-surface p-3.5 shadow-sm transition active:cursor-grabbing ${
        dragging ? 'opacity-40' : 'hover:border-brand/50'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_META[task.priority].dot}`} title={`${PRIORITY_META[task.priority].label} priority`} />
        <button type="button" onClick={() => onOpen(task)} className="min-w-0 flex-1 rounded-md text-left">
          <span className="sr-only">{PRIORITY_META[task.priority].label} priority. </span>
          <span className={`block text-[15px] font-semibold leading-snug ${task.status === 'done' ? 'text-muted line-through decoration-muted/60' : ''}`}>{task.title}</span>
        </button>
      </div>

      {task.dueDate && (
        <div className="mt-3">
          <DueBadge date={task.dueDate} done={task.status === 'done'} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-muted">
          {task.assigneeName ? <Avatar name={task.assigneeName} color={task.assigneeColor} size="xs" /> : <span className="italic">Unassigned</span>}
          {task.commentCount > 0 && (
            <span className="inline-flex items-center gap-1" aria-label={`${task.commentCount} comments`}>
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {task.commentCount}
            </span>
          )}
        </div>
        <div className="flex items-center">
          <button type="button" className="btn-icon h-8 w-8 disabled:opacity-25" disabled={!previous} onClick={() => onStep(task, previous)} aria-label={previous ? `Move to ${STATUS_META[previous].label}` : 'Already in the first column'}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" className="btn-icon h-8 w-8 disabled:opacity-25" disabled={!next} onClick={() => onStep(task, next)} aria-label={next ? `Move to ${STATUS_META[next].label}` : 'Already in the last column'}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
