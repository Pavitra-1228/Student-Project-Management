import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export function Field({ label, error, hint, children, className = '' }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="hint-error" role="alert">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <div className="relative">
      <select className={`input appearance-none pr-10 ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
    </div>
  );
}

export function Chips({ options, value, onChange, label }) {
  return (
    <div className="scroll-x -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-[38px] shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition ${
              active ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-muted hover:border-brand/50 hover:text-ink'
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-on-brand/20' : 'bg-sunken'}`}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
