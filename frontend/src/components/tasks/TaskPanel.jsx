import { useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { Field, Select } from '../ui/Field.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { RoleBadge } from '../ui/Badges.jsx';
import { Skeleton, Spinner } from '../ui/Feedback.jsx';
import { api } from '../../api/index.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PRIORITIES, PRIORITY_META, STATUS_META, TASK_STATUSES } from '../../lib/constants.js';
import { projectPeople } from '../../lib/tasks.js';
import { timeAgo } from '../../lib/dates.js';

const blank = { title: '', description: '', status: 'todo', priority: 'medium', assigneeId: '', dueDate: '' };

function Comments({ taskId, onCountChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, setData } = useAsync(() => api.comments.list(taskId), [taskId]);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const post = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      const comment = await api.comments.add(taskId, body);
      setData((list) => [...(list || []), comment]);
      onCountChange(1);
      setBody('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPosting(false);
    }
  };

  const remove = async (comment) => {
    try {
      await api.comments.remove(comment.id);
      setData((list) => list.filter((item) => item.id !== comment.id));
      onCountChange(-1);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <section aria-labelledby="comments-heading" className="mt-8 border-t border-line pt-6">
      <h3 id="comments-heading" className="mb-4 text-lg font-bold">Comments</h3>
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      ) : data?.length ? (
        <ul className="space-y-4">
          {data.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar name={comment.userName} color={comment.avatarColor} size="sm" />
              <div className="min-w-0 flex-1 rounded-control bg-sunken px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold">{comment.userName}</span>
                  <RoleBadge role={comment.userRole} />
                  <span className="text-xs text-muted">{timeAgo(comment.createdAt)}</span>
                  {(comment.userId === user.id || user.role === 'admin') && (
                    <button type="button" onClick={() => remove(comment)} className="ml-auto text-xs font-semibold text-muted hover:text-danger">Delete</button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-control border border-dashed border-line px-4 py-5 text-center text-sm text-muted">No comments yet. Ask a question or share an update.</p>
      )}
      <form onSubmit={post} className="mt-4 space-y-2">
        <label htmlFor="new-comment" className="sr-only">Write a comment</label>
        <textarea
          id="new-comment"
          className="input"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => (event.metaKey || event.ctrlKey) && event.key === 'Enter' && post(event)}
          placeholder="Write a comment"
          maxLength={1500}
        />
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={posting || !body.trim()}>
            {posting ? <Spinner /> : <Send className="h-4 w-4" aria-hidden="true" />}
            Post comment
          </button>
        </div>
      </form>
    </section>
  );
}

export default function TaskPanel({ open, onClose, task, project, defaultStatus = 'todo', onSaved, onDeleted, onCommentCount }) {
  const { user } = useAuth();
  const toast = useToast();
  const editing = Boolean(task);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const people = projectPeople(project);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      task
        ? { title: task.title, description: task.description, status: task.status, priority: task.priority, assigneeId: task.assigneeId ? String(task.assigneeId) : '', dueDate: task.dueDate || '' }
        : { ...blank, status: defaultStatus, assigneeId: people.some((person) => person.id === user.id) ? String(user.id) : '' }
    );
  }, [open, task?.id, defaultStatus]);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const canDelete = editing && project && (user.role === 'admin' || project.ownerId === user.id || project.mentorId === user.id || task.createdBy === user.id);

  const submit = async (event) => {
    event.preventDefault();
    if (form.title.trim().length < 2) {
      setErrors({ title: 'Give the task a title' });
      return;
    }
    setErrors({});
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
      dueDate: form.dueDate || null
    };
    setSaving(true);
    try {
      const saved = editing ? await api.tasks.update(task.id, payload) : await api.tasks.create({ ...payload, projectId: project.id });
      toast.success(editing ? 'Task saved' : 'Task created');
      onSaved(saved, !editing);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.tasks.remove(task.id);
      toast.success('Task deleted');
      setConfirming(false);
      onDeleted(task);
      onClose();
    } catch (error) {
      setConfirming(false);
      toast.error(error.message);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        variant="drawer"
        title={editing ? 'Task details' : 'New task'}
        description={project?.title}
        footer={
          <>
            {canDelete && (
              <button type="button" className="btn-ghost mr-auto text-danger hover:text-danger" onClick={() => setConfirming(true)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" form="task-form" className="btn-primary" disabled={saving}>
              {saving && <Spinner />}
              {editing ? 'Save changes' : 'Create task'}
            </button>
          </>
        }
      >
        <form id="task-form" onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Title" error={errors.title}>
            {(props) => <input {...props} className="input" value={form.title} onChange={set('title')} maxLength={160} placeholder="Design the login screen" data-autofocus />}
          </Field>
          <Field label="Description">
            {(props) => <textarea {...props} className="input" value={form.description} onChange={set('description')} maxLength={3000} placeholder="Add context, links or acceptance criteria" />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              {(props) => <Select {...props} value={form.status} onChange={set('status')}>{TASK_STATUSES.map((status) => <option key={status} value={status}>{STATUS_META[status].label}</option>)}</Select>}
            </Field>
            <Field label="Priority">
              {(props) => <Select {...props} value={form.priority} onChange={set('priority')}>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_META[priority].label}</option>)}</Select>}
            </Field>
            <Field label="Assignee">
              {(props) => (
                <Select {...props} value={form.assigneeId} onChange={set('assigneeId')}>
                  <option value="">Unassigned</option>
                  {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Due date">
              {(props) => <input {...props} type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />}
            </Field>
          </div>
        </form>
        {editing && <Comments taskId={task.id} onCountChange={(delta) => onCommentCount?.(task.id, delta)} />}
      </Modal>
      <ConfirmDialog open={confirming} title="Delete this task?" message="The task and its comments will be removed for everyone on the project. This cannot be undone." confirmLabel="Delete task" onConfirm={remove} onClose={() => setConfirming(false)} />
    </>
  );
}
