import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, ListChecks, Search } from 'lucide-react';
import { api } from '../../api/index.js';
import { useDebounced } from '../../hooks/useAsync.js';
import { Spinner } from '../ui/Feedback.jsx';
import { STATUS_META } from '../../lib/constants.js';

export default function QuickSearch({ autoFocus = false, onDone, className = '' }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [state, setState] = useState({ projects: [], tasks: [], loading: false });
  const [focused, setFocused] = useState(autoFocus);
  const wrapper = useRef(null);
  const input = useRef(null);
  const query = useDebounced(term.trim(), 250);

  useEffect(() => {
    if (query.length < 2) {
      setState({ projects: [], tasks: [], loading: false });
      return undefined;
    }
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    Promise.all([api.projects.list({ search: query }), api.tasks.list({ search: query })])
      .then(([projects, tasks]) => active && setState({ projects: projects.slice(0, 4), tasks: tasks.slice(0, 5), loading: false }))
      .catch(() => active && setState({ projects: [], tasks: [], loading: false }));
    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        input.current?.focus();
      }
    };
    const onPointer = (event) => {
      if (!wrapper.current?.contains(event.target)) setFocused(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, []);

  const go = (path) => {
    setTerm('');
    setFocused(false);
    onDone?.();
    navigate(path);
  };

  const showPanel = focused && term.trim().length >= 2;
  const empty = !state.loading && !state.projects.length && !state.tasks.length;

  return (
    <div ref={wrapper} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        ref={input}
        type="search"
        value={term}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onChange={(event) => setTerm(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && (setFocused(false), event.currentTarget.blur())}
        placeholder="Search projects and tasks"
        aria-label="Search projects and tasks"
        className="input pl-10 pr-16"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-sunken px-1.5 py-0.5 text-[11px] font-semibold text-muted lg:block">Ctrl K</kbd>
      {state.loading && <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted lg:right-14" />}

      {showPanel && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[70vh] animate-rise overflow-y-auto rounded-card border border-line bg-surface p-2 shadow-lift">
          {empty && <p className="px-3 py-5 text-center text-sm text-muted">No matches for "{term.trim()}"</p>}
          {state.projects.length > 0 && (
            <div>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold text-muted">Projects</p>
              {state.projects.map((project) => (
                <button key={project.id} type="button" onClick={() => go(`/projects/${project.id}`)} className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left hover:bg-sunken">
                  <FolderKanban className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  <span className="truncate text-sm font-medium">{project.title}</span>
                </button>
              ))}
            </div>
          )}
          {state.tasks.length > 0 && (
            <div>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold text-muted">Tasks</p>
              {state.tasks.map((task) => (
                <button key={task.id} type="button" onClick={() => go(`/projects/${task.projectId}?task=${task.id}`)} className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left hover:bg-sunken">
                  <ListChecks className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{task.title}</span>
                    <span className="block truncate text-xs text-muted">{task.projectTitle} · {STATUS_META[task.status].label}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
