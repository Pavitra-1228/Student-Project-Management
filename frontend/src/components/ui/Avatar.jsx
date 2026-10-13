import { initials } from '../../lib/text.js';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl'
};

export function Avatar({ name, color = '#0E7C7B', size = 'md', className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-bold text-white ${SIZES[size]} ${className}`}
      style={{ backgroundColor: color }}
      title={name}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ people = [], max = 4, size = 'sm' }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center" aria-label={`${people.length} team members`} role="img">
      {shown.map((person, index) => (
        <Avatar key={person.id} name={person.name} color={person.avatarColor} size={size} className={`ring-2 ring-surface ${index ? '-ml-2' : ''}`} />
      ))}
      {extra > 0 && (
        <span className="-ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-sunken text-xs font-semibold text-muted ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </div>
  );
}
