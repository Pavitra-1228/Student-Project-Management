import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, GraduationCap, Pencil, Plus, Search, Trash2, UserMinus, UserPlus } from 'lucide-react';
import KanbanBoard from '../components/tasks/KanbanBoard.jsx';
import TaskPanel from '../components/tasks/TaskPanel.jsx';
import TaskRow from '../components/tasks/TaskRow.jsx';
import ProjectForm from '../components/projects/ProjectForm.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { DueBadge, ProjectStatusBadge, RoleBadge } from '../components/ui/Badges.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { Select } from '../components/ui/Field.jsx';
import { FlowBar } from '../components/ui/FlowBar.jsx';
import { api } from '../api/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PRIORITIES, PRIORITY_META } from '../lib/constants.js';
import { moveLocally, projectPeople } from '../lib/tasks.js';

const TABS = [
  { id: 'board', label: 'Board' },
  { id: 'list', label: 'List' },
  { id: 'team', label: 'Team' }
];

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  const project = useAsync(() => api.projects.get(projectId), [projectId]);
  const tasks = useAsync(() => api.tasks.list({ projectId }), [projectId]);
  const directory = useAsync(() => api.users.list({ role: 'student' }), [projectId]);

  const [tab, setTab] = useState('board');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [panel, setPanel] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(null);

  const taskParam = Number(params.get('task')) || null;
  const list = tasks.data || [];
  const p = project.data;

  useEffect(() => {
    if (taskParam && list.length) {
      const found = list.find((task) => task.id === taskParam);
      if (found) setPanel({ mode: 'edit', taskId: found.id });
    }
  }, [taskParam, tasks.data]);

  const canManage = p && (user.role === 'admin' || p.ownerId === user.id || p.mentorId === user.id);
  const canDelete = p && (user.role === 'admin' || p.ownerId === user.id);
  const people = projectPeople(p);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return list.filter(
      (task) =>
        (!term || `${task.title} ${task.description}`.toLowerCase().includes(term)) &&
        (!priority || task.priority === priority) &&
        (!assignee || (assignee === 'none' ? !task.assigneeId : String(task.assigneeId) === assignee))
    );
  }, [list, search, priority, assignee]);

  const refreshProject = () => project.reload({ silent: true });

  const closePanel = () => {
    setPanel(null);
    if (params.has('task')) {
      const next = new URLSearchParams(params);
      next.delete('task');
      setParams(next, { replace: true });
    }
  };

  const move = async (task, status, index) => {
    if (task.status === status && index === task.position) return;
    tasks.setData((current) => moveLocally(current, task.id, status, index));
    try {
      await api.tasks.move(task.id, { status, index });
      refreshProject();
    } catch (error) {
      toast.error(error.message);
      tasks.reload({ silent: true });
    }
  };

  const toggle = (task) => move(task, task.status === 'done' ? 'todo' : 'done', 9999);

  const saved = (task, isNew) => {
    tasks.setData((current) => (isNew ? [...current, task] : current.map((item) => (item.id === task.id ? task : item))));
    refreshProject();
  };

  const bumpComments = (taskId, delta) =>
    tasks.setData((current) => current.map((task) => (task.id === taskId ? { ...task, commentCount: Math.max(0, task.commentCount + delta) } : task)));

  const deleteProject = async () => {
    try {
      await api.projects.remove(projectId);
      toast.success('Project deleted');
      navigate('/projects', { replace: true });
    } catch (error) {
      setDeleting(false);
      toast.error(error.message);
    }
  };

  const addMember = async (event) => {
    const userId = Number(event.target.value);
    if (!userId) return;
    try {
      project.setData(await api.projects.addMember(projectId, userId));
      toast.success('Teammate added');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeMember = async () => {
    try {
      project.setData(await api.projects.removeMember(projectId, removing.id));
      tasks.reload({ silent: true });
      toast.success('Teammate removed');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRemoving(null);
    }
  };

  if (project.error && !p) {
    return (
      <>
        <Link to="/projects" className="btn-ghost mb-4 -ml-3"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Projects</Link>
        <div className="card"><ErrorState error={project.error} onRetry={project.reload} /></div>
      </>
    );
  }

  if (!p) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Loading project">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-44 rounded-card" />
        <div className="grid gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-card" />)}</div>
      </div>
    );
  }

  const openTask = panel?.mode === 'edit' ? list.find((task) => task.id === panel.taskId) : null;
  const addable = (directory.data || []).filter((student) => !p.members.some((member) => member.id === student.id));

  return (
    <>
      <Link to="/projects" className="btn-ghost mb-3 -ml-3"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Projects</Link>

      <section className="card mb-6 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <ProjectStatusBadge status={p.status} />
              <DueBadge date={p.dueDate} done={p.status === 'completed'} />
            </div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{p.title}</h1>
            {p.description && <p className="mt-2 max-w-2xl leading-relaxed text-muted">{p.description}</p>}
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              {p.mentorName ? `Mentor: ${p.mentorName}` : 'No mentor assigned'}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" aria-hidden="true" />Edit</button>
              {canDelete && <button type="button" className="btn-icon border border-line" onClick={() => setDeleting(true)} aria-label="Delete project"><Trash2 className="h-[18px] w-[18px]" /></button>}
            </div>
          )}
        </div>
        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm text-muted">{p.taskCounts.done} of {p.taskCounts.total} tasks done</span>
            <span className="font-display text-2xl font-extrabold">{p.progress}%</span>
          </div>
          <FlowBar counts={p.taskCounts} height="h-4" showLegend />
        </div>
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Project views" className="inline-flex rounded-control bg-sunken p-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              role="tab"
              type="button"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`min-h-[38px] rounded-lg px-4 text-sm font-semibold transition ${tab === item.id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab !== 'team' && (
          <button type="button" className="btn-primary" onClick={() => setPanel({ mode: 'create', status: 'todo' })}><Plus className="h-4 w-4" aria-hidden="true" />New task</button>
        )}
      </div>

      {tab !== 'team' && (
        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input type="search" className="input pl-10" placeholder="Search tasks" aria-label="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select aria-label="Filter by priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="sm:min-w-[170px]">
            <option value="">All priorities</option>
            {PRIORITIES.map((value) => <option key={value} value={value}>{PRIORITY_META[value].label} priority</option>)}
          </Select>
          <Select aria-label="Filter by assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="sm:min-w-[170px]">
            <option value="">Everyone</option>
            <option value="none">Unassigned</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </Select>
        </div>
      )}

      {tab === 'board' && (
        <div role="tabpanel" id="panel-board" aria-labelledby="tab-board">
          {tasks.loading && !tasks.data ? (
            <div className="grid gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-card" />)}</div>
          ) : tasks.error && !tasks.data ? (
            <ErrorState error={tasks.error} onRetry={tasks.reload} />
          ) : (
            <KanbanBoard tasks={filtered} onOpen={(task) => setPanel({ mode: 'edit', taskId: task.id })} onMove={move} onAdd={(status) => setPanel({ mode: 'create', status })} />
          )}
        </div>
      )}

      {tab === 'list' && (
        <div role="tabpanel" id="panel-list" aria-labelledby="tab-list" className="card overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title={list.length ? 'No tasks match your filters' : 'No tasks yet'} action={!list.length && <button type="button" className="btn-primary" onClick={() => setPanel({ mode: 'create', status: 'todo' })}>Add the first task</button>}>
              {list.length ? 'Clear the search or filters to see everything.' : 'Break the project into small steps and assign each one.'}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((task) => <TaskRow key={task.id} task={task} showProject={false} showAssignee onToggle={toggle} onOpen={(item) => setPanel({ mode: 'edit', taskId: item.id })} />)}
            </ul>
          )}
        </div>
      )}

      {tab === 'team' && (
        <div role="tabpanel" id="panel-team" aria-labelledby="tab-team" className="card overflow-hidden">
          <ul className="divide-y divide-line">
            {p.members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-4 py-3.5">
                <Avatar name={member.name} color={member.avatarColor} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{member.name}{member.id === user.id && <span className="ml-2 text-xs font-medium text-muted">You</span>}</p>
                  <p className="text-xs text-muted">{member.id === p.ownerId ? 'Project owner' : 'Team member'}</p>
                </div>
                <RoleBadge role={member.role} />
                {canManage && member.id !== p.ownerId && (
                  <button type="button" className="btn-icon" onClick={() => setRemoving(member)} aria-label={`Remove ${member.name}`}><UserMinus className="h-[18px] w-[18px]" /></button>
                )}
              </li>
            ))}
            {p.mentorId && !p.members.some((member) => member.id === p.mentorId) && (
              <li className="flex items-center gap-3 px-4 py-3.5">
                <Avatar name={p.mentorName} color="#8B5CF6" />
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{p.mentorName}</p><p className="text-xs text-muted">Mentor</p></div>
                <RoleBadge role="mentor" />
              </li>
            )}
          </ul>
          {canManage && (
            <div className="flex flex-wrap items-center gap-3 border-t border-line bg-sunken/50 px-4 py-4">
              <UserPlus className="h-5 w-5 text-brand" aria-hidden="true" />
              <label htmlFor="add-member" className="text-sm font-semibold">Add a teammate</label>
              <div className="min-w-[220px] flex-1 sm:max-w-xs">
                <Select id="add-member" value="" onChange={addMember} disabled={!addable.length}>
                  <option value="">{addable.length ? 'Choose a student' : 'Everyone is already on the team'}</option>
                  {addable.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      <TaskPanel
        open={Boolean(panel) && (panel.mode === 'create' || Boolean(openTask))}
        onClose={closePanel}
        task={openTask}
        project={p}
        defaultStatus={panel?.status}
        onSaved={saved}
        onDeleted={(task) => { tasks.setData((current) => current.filter((item) => item.id !== task.id)); refreshProject(); }}
        onCommentCount={bumpComments}
      />
      <ProjectForm open={editing} onClose={() => setEditing(false)} project={p} onSaved={(next) => project.setData(next)} />
      <ConfirmDialog open={deleting} title="Delete this project?" message={`"${p.title}" and all of its tasks and comments will be permanently removed.`} confirmLabel="Delete project" onConfirm={deleteProject} onClose={() => setDeleting(false)} />
      <ConfirmDialog open={Boolean(removing)} title="Remove teammate?" message={`${removing?.name} will lose access to this project and their tasks become unassigned.`} confirmLabel="Remove" onConfirm={removeMember} onClose={() => setRemoving(null)} />
    </>
  );
}
