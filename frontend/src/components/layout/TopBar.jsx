import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Search, Sun } from 'lucide-react';
import Logo from './Logo.jsx';
import NotificationBell from './NotificationBell.jsx';
import QuickSearch from './QuickSearch.jsx';
import Modal from '../ui/Modal.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button type="button" className="btn-icon" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export default function TopBar() {
  const { user } = useAuth();
  const [searching, setSearching] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-10">
        <Link to="/dashboard" className="lg:hidden" aria-label="ProjectFlow home">
          <Logo />
        </Link>
        <QuickSearch className="ml-0 hidden max-w-md flex-1 lg:block" />
        <div className="ml-auto flex items-center gap-1">
          <button type="button" className="btn-icon lg:hidden" onClick={() => setSearching(true)} aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
          <ThemeToggle />
          <NotificationBell />
          <Link to="/profile" className="ml-1 hidden rounded-full sm:block" aria-label="Your profile">
            <Avatar name={user.name} color={user.avatarColor} size="sm" />
          </Link>
        </div>
      </div>
      <Modal open={searching} onClose={() => setSearching(false)} title="Search" size="md">
        <QuickSearch autoFocus onDone={() => setSearching(false)} />
        <p className="mt-4 text-sm text-muted">Type at least two letters to find projects and tasks.</p>
      </Modal>
    </header>
  );
}
