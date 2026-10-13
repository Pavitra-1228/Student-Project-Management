import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import MobileNav from './MobileNav.jsx';
import { NotificationsProvider } from '../../context/NotificationsContext.jsx';

export default function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <NotificationsProvider>
      <div className="min-h-screen lg:pl-[272px]">
        <a href="#main" className="sr-only rounded-control bg-brand px-4 py-2 font-semibold text-on-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80]">
          Skip to content
        </a>
        <Sidebar />
        <TopBar />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-6 outline-none sm:px-6 lg:px-10 lg:pb-14 lg:pt-8">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </NotificationsProvider>
  );
}
