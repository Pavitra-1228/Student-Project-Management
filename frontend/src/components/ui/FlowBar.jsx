import { STATUS_META } from '../../lib/constants.js';

const ORDER = ['done', 'review', 'in_progress', 'todo'];

export function FlowBar({ counts, height = 'h-2.5', showLegend = false }) {
  const total = ORDER.reduce((sum, key) => sum + (counts?.[key] || 0), 0);
  const label = total
    ? ORDER.map((key) => `${counts[key] || 0} ${STATUS_META[key].label.toLowerCase()}`).join(', ')
    : 'No tasks yet';

  return (
    <div>
      <div className={`flow-bar ${height}`} role="img" aria-label={label}>
        {total > 0 &&
          ORDER.map((key) =>
            counts[key] ? (
              <span
                key={key}
                className={`${STATUS_META[key].bar} ${key === 'todo' ? 'opacity-40' : ''}`}
                style={{ flexGrow: counts[key], flexBasis: 0 }}
                title={`${STATUS_META[key].label}: ${counts[key]}`}
              />
            ) : null
          )}
      </div>
      {showLegend && (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
          {ORDER.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[key].dot} ${key === 'todo' ? 'opacity-40' : ''}`} aria-hidden="true" />
              {STATUS_META[key].label}
              <span className="font-semibold text-ink">{counts?.[key] || 0}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
