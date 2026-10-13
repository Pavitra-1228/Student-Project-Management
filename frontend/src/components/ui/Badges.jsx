import { DUE_TONE_CLASS, dueInfo } from '../../lib/dates.js';
import { PRIORITY_META, PROJECT_STATUS_META, ROLE_META, STATUS_META } from '../../lib/constants.js';
import { CalendarClock } from 'lucide-react';

function Pill({ tint, dot, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold text-ink ${tint} ${className}`}>
      {dot && <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

export const StatusBadge = ({ status }) => (
  <Pill tint={STATUS_META[status].tint} dot={STATUS_META[status].dot}>{STATUS_META[status].label}</Pill>
);

export const ProjectStatusBadge = ({ status }) => (
  <Pill tint={PROJECT_STATUS_META[status].tint} dot={PROJECT_STATUS_META[status].dot}>{PROJECT_STATUS_META[status].label}</Pill>
);

export const PriorityBadge = ({ priority }) => (
  <Pill tint={PRIORITY_META[priority].tint} dot={PRIORITY_META[priority].dot}>{PRIORITY_META[priority].label}</Pill>
);

export const RoleBadge = ({ role }) => <Pill tint={ROLE_META[role].tint}>{ROLE_META[role].label}</Pill>;

export function DueBadge({ date, done = false, className = '' }) {
  const info = dueInfo(date, done);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${DUE_TONE_CLASS[info.tone]} ${className}`}>
      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
      {info.label}
    </span>
  );
}
