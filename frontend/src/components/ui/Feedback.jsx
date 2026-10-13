import { CloudOff, LoaderCircle } from 'lucide-react';

export function Spinner({ className = 'h-4 w-4' }) {
  return <LoaderCircle className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse-soft rounded-control bg-sunken ${className}`} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon, title, children, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
      {Icon && (
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <EmptyState
      icon={CloudOff}
      title="We could not load this"
      action={onRetry && <button type="button" className="btn-secondary" onClick={onRetry}>Try again</button>}
    >
      {error?.message || 'Check your connection and try again.'}
    </EmptyState>
  );
}
