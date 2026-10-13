import { useRef, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import TaskCard from './TaskCard.jsx';
import { STATUS_META, TASK_STATUSES } from '../../lib/constants.js';
import { groupByStatus } from '../../lib/tasks.js';

const EMPTY_COPY = {
  todo: 'Nothing waiting. Add the next task.',
  in_progress: 'Drag a task here when you start it.',
  review: 'Tasks ready for a mentor look land here.',
  done: 'Finished work shows up here.'
};

export default function KanbanBoard({ tasks, onOpen, onMove, onAdd }) {
  const columns = groupByStatus(tasks);
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);
  const dragRef = useRef(null);

  const indexFor = (event, element) => {
    const cards = [...element.querySelectorAll('[data-task-id]')].filter((node) => Number(node.dataset.taskId) !== dragRef.current);
    const found = cards.findIndex((node) => {
      const box = node.getBoundingClientRect();
      return event.clientY < box.top + box.height / 2;
    });
    return found === -1 ? cards.length : found;
  };

  const startDrag = (event, task) => {
    dragRef.current = task.id;
    setDragId(task.id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(task.id));
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragId(null);
    setOver(null);
  };

  const drop = (event, status) => {
    event.preventDefault();
    const id = dragRef.current;
    if (id == null) return;
    const index = indexFor(event, event.currentTarget);
    const task = tasks.find((item) => item.id === id);
    endDrag();
    if (task) onMove(task, status, index);
  };

  return (
    <div className="scroll-x -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
      {TASK_STATUSES.map((status) => {
        const meta = STATUS_META[status];
        const list = columns[status];
        const visible = list.filter((task) => task.id !== dragId);
        const active = over?.status === status;
        return (
          <section
            key={status}
            aria-label={`${meta.label}, ${list.length} tasks`}
            className={`flex w-[84%] shrink-0 snap-center flex-col rounded-card bg-sunken/70 p-3 transition-shadow sm:w-[46%] lg:w-auto ${active ? `ring-2 ${meta.ring}` : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              const index = indexFor(event, event.currentTarget.querySelector('[data-list]'));
              if (!over || over.status !== status || over.index !== index) setOver({ status, index });
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setOver(null);
            }}
            onDrop={(event) => drop(event, status)}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h3 className="flex items-center gap-2 font-display text-base font-bold">
                <span className={`h-3 w-3 rounded-full ${meta.dot}`} aria-hidden="true" />
                {meta.label}
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">{list.length}</span>
              </h3>
              <button type="button" className="btn-icon h-9 w-9" onClick={() => onAdd(status)} aria-label={`Add a task to ${meta.label}`}>
                <Plus className="h-[18px] w-[18px]" />
              </button>
            </header>

            <div data-list role="list" className="flex min-h-[120px] flex-1 flex-col gap-2.5">
              {list.length === 0 && !active && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-control border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  {EMPTY_COPY[status]}
                </div>
              )}
              {list.map((task) => (
                <div key={task.id} className="contents">
                  {active && dragId !== null && visible.indexOf(task) === over.index && <div className={`h-1 rounded-full ${meta.bar}`} aria-hidden="true" />}
                  <TaskCard
                    task={task}
                    dragging={dragId === task.id}
                    onOpen={onOpen}
                    onStep={(item, target) => onMove(item, target, columns[target].length)}
                    onDragStart={startDrag}
                    onDragEnd={endDrag}
                  />
                </div>
              ))}
              {active && dragId !== null && over.index >= visible.length && <div className={`h-1 rounded-full ${meta.bar}`} aria-hidden="true" />}
            </div>
          </section>
        );
      })}
    </div>
  );
}
