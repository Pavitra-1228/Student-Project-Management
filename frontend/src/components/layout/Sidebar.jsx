import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import NavList from './NavList.jsx';
import AccountCard from './AccountCard.jsx';

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
      <Link to="/dashboard" className="mb-8 px-2" aria-label="ProjectFlow home">
        <Logo />
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavList />
      </div>
      <AccountCard />
    </aside>
  );
}
