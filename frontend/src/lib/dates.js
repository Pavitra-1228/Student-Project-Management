const MS_DAY = 86400000;

export function toISODate(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export const todayISO = () => toISODate(new Date());

export function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function daysUntil(value) {
  const target = parseDate(value);
  if (!target) return null;
  const today = parseDate(todayISO());
  return Math.round((target - today) / MS_DAY);
}

export function formatDate(value, withYear = false) {
  const date = parseDate(value);
  if (!date) return 'No date';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {})
  });
}

export function dueInfo(value, done = false) {
  const days = daysUntil(value);
  if (days === null) return { label: 'No due date', tone: 'none', days: null };
  if (done) return { label: formatDate(value), tone: 'done', days };
  if (days < 0) return { label: days === -1 ? 'Overdue by 1 day' : `Overdue by ${Math.abs(days)} days`, tone: 'overdue', days };
  if (days === 0) return { label: 'Due today', tone: 'soon', days };
  if (days === 1) return { label: 'Due tomorrow', tone: 'soon', days };
  if (days <= 7) return { label: `Due in ${days} days`, tone: 'soon', days };
  return { label: `Due ${formatDate(value)}`, tone: 'ok', days };
}

export const DUE_TONE_CLASS = {
  overdue: 'bg-danger/12 text-danger',
  soon: 'bg-review/20 text-ink',
  ok: 'bg-sunken text-muted',
  none: 'bg-sunken text-muted',
  done: 'bg-done/15 text-ink'
};

export function timeAgo(iso) {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function weekdayShort(value) {
  return parseDate(value).toLocaleDateString(undefined, { weekday: 'short' });
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
