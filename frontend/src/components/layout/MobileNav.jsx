import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, FolderKanban, LayoutDashboard, ListChecks, Menu } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import NavList from './NavList.jsx';
import AccountCard from './AccountCard.jsx';
import { useNotifications } from '../../context/NotificationsContext.jsx';

const TABS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/notifications', label: 'Alerts', icon: Bell, badge: true }
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { unread } = useNotifications();

  return (
    <>
      <nav aria-label="Primary" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(({ to, label, icon: Icon, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${isActive ? 'text-brand' : 'text-muted'}`
                }
              >
                <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
                {label}
                {badge && unread > 0 && (
                  <span className="absolute right-[26%] top-2 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" aria-label={`${unread} unread`} />
                )}
              </NavLink>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setOpen(true)} className="flex min-h-[60px] w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted" aria-haspopup="dialog">
              <Menu className="h-[22px] w-[22px]" aria-hidden="true" />
              Menu
            </button>
          </li>
        </ul>
      </nav>
      <Modal open={open} onClose={() => setOpen(false)} title="Menu" variant="drawer">
        <div className="flex h-full flex-col justify-between gap-8">
          <NavList onNavigate={() => setOpen(false)} />
          <AccountCard onNavigate={() => setOpen(false)} />
        </div>
      </Modal>
    </>
  );
}
