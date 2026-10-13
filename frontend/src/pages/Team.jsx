import { useState } from 'react';
import { Search, Trash2, Users } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Select } from '../components/ui/Field.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { api } from '../api/index.js';
import { useAsync, useDebounced } from '../hooks/useAsync.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ROLE_META } from '../lib/constants.js';
import { pluralize } from '../lib/text.js';

export default function Team() {
  const { user } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState(null);
  const term = useDebounced(search.trim(), 250);
  const { data, loading, error, reload, setData } = useAsync(() => api.users.list({ search: term }), [term]);

  const changeRole = async (person, role) => {
    const previous = person.role;
    setData((list) => list.map((item) => (item.id === person.id ? { ...item, role } : item)));
    try {
      await api.users.setRole(person.id, role);
      toast.success(`${person.name} is now a ${ROLE_META[role].label.toLowerCase()}`);
    } catch (err) {
      setData((list) => list.map((item) => (item.id === person.id ? { ...item, role: previous } : item)));
      toast.error(err.message);
    }
  };

  const remove = async () => {
    try {
      await api.users.remove(target.id);
      setData((list) => list.filter((item) => item.id !== target.id));
      toast.success('Account deleted');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTarget(null);
    }
  };

  return (
    <>
      <PageHeader title="Team" description={data ? `${pluralize(data.length, 'person', 'people')} on ProjectFlow. Change roles or remove accounts.` : 'Manage accounts and roles.'} />
      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input type="search" className="input pl-10" placeholder="Search by name or email" aria-label="Search people" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <div className="space-y-3 p-4" aria-busy="true">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : data.length === 0 ? (
          <EmptyState icon={Users} title="No one matches that search">Try a different name or email.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {data.map((person) => (
              <li key={person.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5">
                <Avatar name={person.name} color={person.avatarColor} />
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate font-semibold">{person.name}{person.id === user.id && <span className="ml-2 text-xs font-medium text-muted">You</span>}</p>
                  <p className="truncate text-sm text-muted">{person.email}</p>
                </div>
                <div className="w-36">
                  <Select aria-label={`Role for ${person.name}`} value={person.role} disabled={person.id === user.id} onChange={(e) => changeRole(person, e.target.value)}>
                    {Object.entries(ROLE_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                  </Select>
                </div>
                <button type="button" className="btn-icon disabled:opacity-30" disabled={person.id === user.id} onClick={() => setTarget(person)} aria-label={`Delete ${person.name}`}>
                  <Trash2 className="h-[18px] w-[18px]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog open={Boolean(target)} title="Delete this account?" message={`${target?.name} and the projects they own will be permanently removed.`} confirmLabel="Delete account" onConfirm={remove} onClose={() => setTarget(null)} />
    </>
  );
}
