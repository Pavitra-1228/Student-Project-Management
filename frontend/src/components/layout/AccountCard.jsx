import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { isDemo } from '../../api/index.js';
import { ROLE_META } from '../../lib/constants.js';

export default function AccountCard({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-3">
      {isDemo && (
        <p className="rounded-control bg-sun/20 px-3 py-2.5 text-xs leading-relaxed text-ink">
          Demo mode. Changes are saved in this browser only.
        </p>
      )}
      <div className="flex items-center gap-3 rounded-control border border-line bg-surface p-2.5">
        <Link to="/profile" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg">
          <Avatar name={user.name} color={user.avatarColor} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user.name}</span>
            <span className="block text-xs text-muted">{ROLE_META[user.role].label}</span>
          </span>
        </Link>
        <button type="button" className="btn-icon" onClick={signOut} aria-label="Sign out">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
