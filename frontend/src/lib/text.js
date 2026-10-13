export function initials(name = '') {
  const parts = name.replace(/^(Dr|Prof)\.?\s+/i, '').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export const classNames = (...parts) => parts.filter(Boolean).join(' ');
