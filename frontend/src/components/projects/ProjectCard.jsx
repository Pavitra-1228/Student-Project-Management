import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { ProjectStatusBadge, DueBadge } from '../ui/Badges.jsx';
import { FlowBar } from '../ui/FlowBar.jsx';
import { AvatarStack } from '../ui/Avatar.jsx';

export default function ProjectCard({ project }) {
  const { taskCounts: counts } = project;
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card group flex h-full flex-col gap-4 p-5 transition-colors hover:border-brand/60"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-snug group-hover:text-brand">{project.title}</h3>
        <ProjectStatusBadge status={project.status} />
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-muted">{project.description || 'No description yet.'}</p>

      <div className="mt-auto space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted">{counts.done} of {counts.total} tasks done</span>
          <span className="font-display text-lg font-bold">{project.progress}%</span>
        </div>
        <FlowBar counts={counts} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <AvatarStack people={project.members} />
        <DueBadge date={project.dueDate} done={project.status === 'completed'} />
      </div>
      {project.mentorName && (
        <p className="-mt-1 flex items-center gap-2 text-xs text-muted">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          Mentor: {project.mentorName}
        </p>
      )}
    </Link>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="card space-y-4 p-5" aria-hidden="true">
      <div className="h-6 w-2/3 animate-pulse-soft rounded-lg bg-sunken" />
      <div className="h-10 animate-pulse-soft rounded-lg bg-sunken" />
      <div className="h-2.5 animate-pulse-soft rounded-full bg-sunken" />
      <div className="h-8 w-1/2 animate-pulse-soft rounded-lg bg-sunken" />
    </div>
  );
}
