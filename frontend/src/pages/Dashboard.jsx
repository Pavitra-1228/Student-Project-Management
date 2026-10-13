import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CalendarClock, CheckCheck, FolderKanban, FolderPlus, Users } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import { FlowBar } from '../components/ui/FlowBar.jsx';
import { DueBadge, PriorityBadge } from '../components/ui/Badges.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { api } from '../api/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { useChartColors } from '../hooks/useChartColors.js';
import { useAuth } from '../context/AuthContext.jsx';
import { greeting, weekdayShort } from '../lib/dates.js';
import { STATUS_META, TASK_STATUSES } from '../lib/constants.js';
import { pluralize } from '../lib/text.js';

function Stat({ icon: Icon, label, value, tone, to }) {
  const body = (
    <div className="card flex items-center gap-4 p-4 transition-colors hover:border-brand/50">
      <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <p className="font-display text-3xl font-extrabold leading-none">{value}</p>
        <p className="mt-1.5 text-sm text-muted">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to} className="block rounded-card">{body}</Link> : body;
}

function ChartCard({ title, description, children, className = '' }) {
  return (
    <section className={`card p-5 ${className}`}>
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-44 rounded-card" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}</div>
      <div className="grid gap-5 lg:grid-cols-3"><Skeleton className="h-80 rounded-card lg:col-span-2" /><Skeleton className="h-80 rounded-card" /></div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const colors = useChartColors();
  const { data, loading, error, reload } = useAsync(() => api.analytics.overview(), []);

  if (loading && !data) return (<><PageHeader title={`${greeting()}, ${user.name.split(' ')[0]}`} /><DashboardSkeleton /></>);
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const { totals, statusCounts, projectProgress, weekly, upcoming, usersByRole } = data;

  if (!totals.projects) {
    return (
      <>
        <PageHeader title={`${greeting()}, ${user.name.split(' ')[0]}`} />
        <div className="card">
          <EmptyState icon={FolderPlus} title="Create your first project" action={<Link to="/projects" className="btn-primary">Go to projects</Link>}>
            Projects hold your tasks, deadlines and team. Once you add one, your progress shows up here.
          </EmptyState>
        </div>
      </>
    );
  }

  const weeklyData = weekly.map((day) => ({ day: weekdayShort(day.date), Created: day.created, Completed: day.completed }));
  const pieData = TASK_STATUSES.map((status) => ({ status, name: STATUS_META[status].label, value: statusCounts[status] }));
  const tooltipStyle = { background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: 12, color: colors.ink, fontSize: 13 };

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]}`}
        description={totals.myOpen ? `You have ${pluralize(totals.myOpen, 'open task')} assigned to you.` : 'Nothing is assigned to you right now.'}
        actions={<Link to="/projects" className="btn-primary"><FolderKanban className="h-4 w-4" aria-hidden="true" />View projects</Link>}
      />

      <section className="card mb-5 overflow-hidden p-6 sm:p-8" aria-labelledby="flow-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="flow-heading" className="text-lg font-bold text-muted">Overall flow</h2>
            <p className="mt-1 font-display text-5xl font-extrabold leading-none sm:text-6xl">{totals.completionRate}%</p>
            <p className="mt-2 text-muted">{totals.done} of {totals.tasks} tasks finished across {pluralize(totals.projects, 'project')}</p>
          </div>
        </div>
        <div className="mt-6">
          <FlowBar counts={statusCounts} height="h-5" showLegend />
        </div>
      </section>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={FolderKanban} label="Active projects" value={totals.activeProjects} tone="bg-brand/15 text-brand" to="/projects" />
        <Stat icon={CheckCheck} label="Assigned to you" value={totals.myOpen} tone="bg-progress/15 text-progress" to="/tasks" />
        <Stat icon={CalendarClock} label="Due in 7 days" value={totals.dueSoon} tone="bg-review/20 text-review" />
        <Stat icon={AlertTriangle} label="Overdue tasks" value={totals.overdue} tone="bg-danger/12 text-danger" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard title="Weekly activity" description="Tasks created and completed over the last 7 days" className="lg:col-span-2">
          <div className="h-64" role="img" aria-label={`Bar chart. ${weeklyData.map((d) => `${d.day}: ${d.Created} created, ${d.Completed} completed`).join('. ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={4} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={colors.line} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 12 }} />
                <Tooltip cursor={{ fill: colors.line, opacity: 0.4 }} contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13, color: colors.muted }} />
                <Bar dataKey="Created" fill={colors.progress} radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Completed" fill={colors.done} radius={[6, 6, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Tasks by status" description="Everything you can see">
          <div className="relative h-64" role="img" aria-label={`Donut chart. ${pieData.map((d) => `${d.name}: ${d.value}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={3} stroke="none">
                  {pieData.map((entry) => <Cell key={entry.status} fill={colors[STATUS_META[entry.status].cssVar]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-4xl font-extrabold">{totals.tasks}</span>
              <span className="text-sm text-muted">tasks</span>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Project progress" className="lg:col-span-2">
          {projectProgress.length ? (
            <ul className="space-y-4">
              {projectProgress.slice(0, 6).map((project) => (
                <li key={project.id}>
                  <Link to={`/projects/${project.id}`} className="group block rounded-lg">
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-semibold group-hover:text-brand">{project.title}</span>
                      <span className="shrink-0 text-muted">{project.done}/{project.total} · <span className="font-semibold text-ink">{project.progress}%</span></span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${project.title} progress`}>
                      <div className="h-full rounded-full bg-done transition-all duration-700" style={{ width: `${project.progress}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">No projects yet.</p>}
        </ChartCard>

        <ChartCard title="Next deadlines">
          {upcoming.length ? (
            <ul className="space-y-3">
              {upcoming.map((task) => (
                <li key={task.id}>
                  <Link to={`/projects/${task.projectId}?task=${task.id}`} className="block rounded-control border border-line p-3 transition hover:border-brand/50">
                    <p className="truncate text-sm font-semibold">{task.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">{task.projectTitle}</p>
                    <div className="mt-2 flex flex-wrap gap-2"><DueBadge date={task.dueDate} /><PriorityBadge priority={task.priority} /></div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">No upcoming deadlines. Add due dates to tasks to see them here.</p>}
        </ChartCard>

        {user.role === 'admin' && (
          <ChartCard title="People" description="Accounts by role" className="lg:col-span-3">
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
              {['student', 'mentor', 'admin'].map((role) => (
                <div key={role} className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-brand" aria-hidden="true" />
                  <span className="font-display text-2xl font-extrabold">{usersByRole[role] || 0}</span>
                  <span className="text-sm capitalize text-muted">{role}s</span>
                </div>
              ))}
              <Link to="/team" className="btn-secondary ml-auto">Manage team</Link>
            </div>
          </ChartCard>
        )}
      </div>
    </>
  );
}
