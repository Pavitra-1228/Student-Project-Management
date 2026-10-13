import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext.jsx';
import NotificationItem from './NotificationItem.jsx';
import { EmptyState } from '../ui/Feedback.jsx';

export default function NotificationBell() {
  const { items, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!wrapper.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        className="btn-icon relative"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-[68px] z-50 animate-rise overflow-hidden rounded-card border border-line bg-surface shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[400px]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-base font-bold">Notifications</h2>
            <button type="button" className="text-sm font-semibold text-brand hover:underline disabled:opacity-40" onClick={markAllRead} disabled={!unread}>
              Mark all as read
            </button>
          </div>
          <div className="max-h-[60vh] divide-y divide-line overflow-y-auto">
            {items.length === 0 ? (
              <EmptyState icon={BellOff} title="You are all caught up" compact>
                New comments, assignments and status changes show up here.
              </EmptyState>
            ) : (
              items.slice(0, 6).map((item) => <NotificationItem key={item.id} item={item} onOpen={() => setOpen(false)} />)
            )}
          </div>
          <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-3 text-center text-sm font-semibold text-brand hover:bg-sunken">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
