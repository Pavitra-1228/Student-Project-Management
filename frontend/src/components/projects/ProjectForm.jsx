import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { Field, Select } from '../ui/Field.jsx';
import { Spinner } from '../ui/Feedback.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { api } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PROJECT_STATUSES, PROJECT_STATUS_META } from '../../lib/constants.js';

const blank = { title: '', description: '', status: 'planning', dueDate: '', mentorId: '', memberIds: [] };

export default function ProjectForm({ open, onClose, project, onSaved }) {
  const { user } = useAuth();
  const toast = useToast();
  const editing = Boolean(project);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [people, setPeople] = useState([]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      project
        ? { title: project.title, description: project.description, status: project.status, dueDate: project.dueDate || '', mentorId: project.mentorId ? String(project.mentorId) : '', memberIds: [] }
        : { ...blank, mentorId: user.role === 'mentor' ? String(user.id) : '' }
    );
    api.users.list().then(setPeople).catch(() => setPeople([]));
  }, [open, project, user]);

  const mentors = people.filter((person) => person.role === 'mentor' || person.role === 'admin');
  const students = people.filter((person) => person.role === 'student' && person.id !== user.id);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const toggleMember = (id) =>
    setForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(id) ? current.memberIds.filter((item) => item !== id) : [...current.memberIds, id]
    }));

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (form.title.trim().length < 3) next.title = 'Give the project a title of at least 3 characters';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      dueDate: form.dueDate || null,
      mentorId: form.mentorId ? Number(form.mentorId) : null
    };
    setSaving(true);
    try {
      const saved = editing
        ? await api.projects.update(project.id, payload)
        : await api.projects.create({ ...payload, memberIds: form.memberIds });
      toast.success(editing ? 'Project saved' : 'Project created');
      onSaved(saved);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit project' : 'Create a project'}
      description={editing ? undefined : 'Set the goal, pick a mentor and invite your team. You can change everything later.'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="project-form" className="btn-primary" disabled={saving}>
            {saving && <Spinner />}
            {editing ? 'Save project' : 'Create project'}
          </button>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Project title" error={errors.title}>
          {(props) => <input {...props} className="input" value={form.title} onChange={set('title')} maxLength={140} placeholder="Campus bike share app" data-autofocus />}
        </Field>
        <Field label="Description">
          {(props) => <textarea {...props} className="input" value={form.description} onChange={set('description')} maxLength={2000} placeholder="What are you building and who is it for?" />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            {(props) => (
              <Select {...props} value={form.status} onChange={set('status')}>
                {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{PROJECT_STATUS_META[status].label}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Due date">
            {(props) => <input {...props} type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />}
          </Field>
        </div>
        <Field label="Mentor">
          {(props) => (
            <Select {...props} value={form.mentorId} onChange={set('mentorId')}>
              <option value="">No mentor yet</option>
              {mentors.map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.name}</option>)}
            </Select>
          )}
        </Field>
        {!editing && students.length > 0 && (
          <fieldset>
            <legend className="label">Invite teammates</legend>
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-control border border-line p-1.5">
              {students.map((student) => (
                <label key={student.id} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-2.5 hover:bg-sunken">
                  <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={form.memberIds.includes(student.id)} onChange={() => toggleMember(student.id)} />
                  <Avatar name={student.name} color={student.avatarColor} size="xs" />
                  <span className="text-sm font-medium">{student.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </form>
    </Modal>
  );
}
