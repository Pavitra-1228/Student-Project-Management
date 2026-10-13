import { NavLink } from 'react-router-dom';
import { Bell, FolderKanban, LayoutDashboard, ListChecks, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationsContext.jsx';

export function useNavItems() {
  const { user } = useAuth();
  const items = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/tasks', label: 'My tasks', icon: ListChecks },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
    { to: '/profile', label: 'Profile', icon: UserRound }
  ];
  if (user?.role === 'admin') items.splice(4, 0, { to: '/team', label: 'Team', icon: ShieldCheck });
  return items;
}

export default function NavList({ onNavigate }) {
  const items = useNavItems();
  const { unread } = useNotifications();

  return (
    <nav aria-label="Main">
      <ul className="space-y-1">
        {items.map(({ to, label, icon: Icon, badge }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex min-h-[44px] items-center gap-3 rounded-control px-3 text-[15px] font-semibold transition ${
                  isActive ? 'bg-brand-soft text-ink' : 'text-muted hover:bg-sunken hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-5 w-5 ${isActive ? 'text-brand' : ''}`} aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  {badge && unread > 0 && (
                    <span className="min-w-[22px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs font-bold text-white" aria-label={`${unread} unread`}>
                      {unread}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
