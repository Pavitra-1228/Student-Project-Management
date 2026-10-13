import { useMemo, useState } from 'react';
import { PartyPopper, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import TaskRow from '../components/tasks/TaskRow.jsx';
import { Chips } from '../components/ui/Field.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { api } from '../api/index.js';
import { useAsync, useDebounced } from '../hooks/useAsync.js';
import { useToast } from '../context/ToastContext.jsx';
import { STATUS_META, TASK_STATUSES } from '../lib/constants.js';

const SCOPES = [
  { value: 'me', label: 'Assigned to me' },
  { value: 'all', label: 'All visible tasks' }
];

const byDue = (a, b) => {
  if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? 1 : -1;
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return a.id - b.id;
};

export default function MyTasks() {
  const toast = useToast();
  const [scope, setScope] = useState('me');
  const [status, setStatus] = useState('open');
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim(), 250);
  const { data, loading, error, reload, setData } = useAsync(() => api.tasks.list({ assignee: scope === 'me' ? 'me' : undefined, search: term }), [scope, term]);

  const options = useMemo(() => {
    const list = data || [];
    return [
      { value: 'open', label: 'Open', count: list.filter((t) => t.status !== 'done').length },
      ...TASK_STATUSES.map((value) => ({ value, label: STATUS_META[value].label, count: list.filter((t) => t.status === value).length })),
      { value: 'all', label: 'Everything', count: list.length }
    ];
  }, [data]);

  const visible = (data || [])
    .filter((task) => status === 'all' || (status === 'open' ? task.status !== 'done' : task.status === status))
    .sort(byDue);

  const toggle = async (task) => {
    const next = task.status === 'done' ? 'todo' : 'done';
    setData((list) => list.map((item) => (item.id === task.id ? { ...item, status: next } : item)));
    try {
      await api.tasks.update(task.id, { status: next });
    } catch (err) {
      toast.error(err.message);
      reload({ silent: true });
    }
  };

  return (
    <>
      <PageHeader title="My tasks" description="Work assigned to you across every project, soonest deadline first." />
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[240px] max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input type="search" className="input pl-10" placeholder="Search tasks" aria-label="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Chips label="Task scope" options={SCOPES} value={scope} onChange={setScope} />
        </div>
        <Chips label="Filter by status" options={options} value={status} onChange={setStatus} />
      </div>

      <div className="card overflow-hidden">
        {error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <div className="space-y-3 p-4" aria-busy="true">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : visible.length === 0 ? (
          term || status !== 'open' ? (
            <EmptyState icon={Search} title="No tasks match" action={<button type="button" className="btn-secondary" onClick={() => { setSearch(''); setStatus('open'); }}>Reset filters</button>}>
              Change the status or search term to see more.
            </EmptyState>
          ) : (
            <EmptyState icon={PartyPopper} title="You are all clear">Nothing open is assigned to you. Check the board of a project to pick up more work.</EmptyState>
          )
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((task) => <TaskRow key={task.id} task={task} onToggle={toggle} />)}
          </ul>
        )}
      </div>
    </>
  );
}
