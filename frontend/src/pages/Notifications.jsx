import { BellOff, CheckCheck } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import NotificationItem from '../components/layout/NotificationItem.jsx';
import { EmptyState, Skeleton } from '../components/ui/Feedback.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';

export default function Notifications() {
  const { items, loading, unread, markAllRead } = useNotifications();

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : 'You are up to date.'}
        actions={<button type="button" className="btn-secondary" onClick={markAllRead} disabled={!unread}><CheckCheck className="h-4 w-4" aria-hidden="true" />Mark all as read</button>}
      />
      <div className="card overflow-hidden">
        {loading && !items.length ? (
          <div className="space-y-3 p-4" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState icon={BellOff} title="No notifications yet">Comments on your tasks, new assignments and status changes will appear here.</EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {items.map((item) => <NotificationItem key={item.id} item={item} removable />)}
          </div>
        )}
      </div>
    </>
  );
}
