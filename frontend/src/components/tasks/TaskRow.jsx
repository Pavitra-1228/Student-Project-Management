import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';
import { DueBadge, PriorityBadge, StatusBadge } from '../ui/Badges.jsx';

export default function TaskRow({ task, onToggle, onOpen, showProject = true, showAssignee = false }) {
  const done = task.status === 'done';
  const title = (
    <span className={`block truncate font-semibold ${done ? 'text-muted line-through decoration-muted/60' : ''}`}>{task.title}</span>
  );

  return (
    <li className="flex items-center gap-3 px-4 py-3 transition hover:bg-sunken/70 sm:gap-4">
      {onToggle && (
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? `Reopen ${task.title}` : `Mark ${task.title} as done`}
          onClick={() => onToggle(task)}
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${done ? 'border-done bg-done text-white' : 'border-line hover:border-brand'}`}
        >
          {done && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>
      )}
      <div className="min-w-0 flex-1">
        {onOpen ? (
          <button type="button" onClick={() => onOpen(task)} className="block w-full min-w-0 rounded-md text-left">{title}</button>
        ) : (
          <Link to={`/projects/${task.projectId}?task=${task.id}`} className="block min-w-0 rounded-md">{title}</Link>
        )}
        {showProject && <span className="block truncate text-xs text-muted">{task.projectTitle}</span>}
        <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && <DueBadge date={task.dueDate} done={done} />}
        </div>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        {task.dueDate && <DueBadge date={task.dueDate} done={done} />}
      </div>
      {showAssignee && (task.assigneeName ? <Avatar name={task.assigneeName} color={task.assigneeColor} size="sm" /> : <span className="hidden w-8 text-xs italic text-muted sm:block">None</span>)}
    </li>
  );
}
