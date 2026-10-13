import { useMemo, useState } from 'react';
import { FolderPlus, Plus, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import ProjectCard, { ProjectCardSkeleton } from '../components/projects/ProjectCard.jsx';
import ProjectForm from '../components/projects/ProjectForm.jsx';
import { Chips } from '../components/ui/Field.jsx';
import { EmptyState, ErrorState } from '../components/ui/Feedback.jsx';
import { api } from '../api/index.js';
import { useAsync, useDebounced } from '../hooks/useAsync.js';
import { PROJECT_STATUSES, PROJECT_STATUS_META } from '../lib/constants.js';

export default function Projects() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [creating, setCreating] = useState(false);
  const term = useDebounced(search.trim(), 250);
  const { data, loading, error, reload, setData } = useAsync(() => api.projects.list({ search: term }), [term]);

  const options = useMemo(() => {
    const list = data || [];
    return [
      { value: 'all', label: 'All', count: list.length },
      ...PROJECT_STATUSES.map((value) => ({ value, label: PROJECT_STATUS_META[value].label, count: list.filter((p) => p.status === value).length }))
    ];
  }, [data]);

  const visible = (data || []).filter((project) => status === 'all' || project.status === status);
  const filtering = Boolean(term) || status !== 'all';

  return (
    <>
      <PageHeader
        title="Projects"
        description="Everything your team is building, with progress at a glance."
        actions={<button type="button" className="btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden="true" />New project</button>}
      />

      <div className="mb-6 space-y-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input type="search" className="input pl-10" placeholder="Search by title or description" aria-label="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Chips label="Filter by status" options={options} value={status} onChange={setStatus} />
      </div>

      {error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">{[0, 1, 2].map((i) => <ProjectCardSkeleton key={i} />)}</div>
      ) : visible.length === 0 ? (
        <div className="card">
          {filtering ? (
            <EmptyState icon={Search} title="No projects match" action={<button type="button" className="btn-secondary" onClick={() => { setSearch(''); setStatus('all'); }}>Clear filters</button>}>
              Try a different word or switch the status filter.
            </EmptyState>
          ) : (
            <EmptyState icon={FolderPlus} title="No projects yet" action={<button type="button" className="btn-primary" onClick={() => setCreating(true)}>Create a project</button>}>
              Start with a title and a due date. You can invite teammates and add tasks right after.
            </EmptyState>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}

      <ProjectForm open={creating} onClose={() => setCreating(false)} onSaved={(project) => setData((list) => [project, ...(list || [])])} />
    </>
  );
}
