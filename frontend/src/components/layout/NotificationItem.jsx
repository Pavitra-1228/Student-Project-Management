import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardPlus, FolderKanban, MessageSquare, X } from 'lucide-react';
import { timeAgo } from '../../lib/dates.js';
import { useNotifications } from '../../context/NotificationsContext.jsx';

const ICONS = {
  comment: { icon: MessageSquare, tint: 'bg-progress/15 text-progress' },
  assignment: { icon: ClipboardPlus, tint: 'bg-accent/15 text-accent' },
  status: { icon: CheckCircle2, tint: 'bg-done/15 text-done' },
  project: { icon: FolderKanban, tint: 'bg-brand/15 text-brand' }
};

export default function NotificationItem({ item, onOpen, removable = false }) {
  const navigate = useNavigate();
  const { markRead, remove } = useNotifications();
  const meta = ICONS[item.type] || ICONS.project;
  const Icon = meta.icon;

  const open = () => {
    if (!item.read) markRead(item.id);
    onOpen?.();
    if (item.link) navigate(item.link);
  };

  return (
    <div className={`group relative flex items-start gap-3 px-4 py-3.5 transition hover:bg-sunken ${item.read ? '' : 'bg-brand-soft/50'}`}>
      <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tint}`}>
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <button type="button" onClick={open} className="min-w-0 flex-1 rounded-lg text-left">
        <span className={`block text-sm leading-snug ${item.read ? 'text-muted' : 'font-semibold text-ink'}`}>{item.message}</span>
        <span className="mt-1 block text-xs text-muted">{timeAgo(item.createdAt)}</span>
      </button>
      {!item.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
      {removable && (
        <button
          type="button"
          onClick={() => remove(item.id)}
          className="btn-icon -my-1 h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          aria-label="Remove notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
