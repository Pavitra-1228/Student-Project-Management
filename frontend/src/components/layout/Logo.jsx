export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="rgb(var(--brand))" />
      <rect x="12" y="16" width="24" height="8" rx="4" fill="rgb(var(--on-brand))" />
      <rect x="12" y="28" width="40" height="8" rx="4" fill="#F7B801" />
      <rect x="12" y="40" width="16" height="8" rx="4" fill="#EF6351" />
    </svg>
  );
}

export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-tight">ProjectFlow</span>
    </span>
  );
}
