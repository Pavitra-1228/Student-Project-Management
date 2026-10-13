import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import { LogoMark } from './components/layout/Logo.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import MyTasks from './pages/MyTasks.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';
import Team from './pages/Team.jsx';
import NotFound from './pages/NotFound.jsx';

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
      <LogoMark className="h-14 w-14 animate-pulse-soft" />
    </div>
  );
}

function RequireAuth() {
  const { user, booting } = useAuth();
  const location = useLocation();
  if (booting) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <AppShell />;
}

function PublicOnly() {
  const { booting } = useAuth();
  if (booting) return <Splash />;
  return <Outlet />;
}

function AdminOnly() {
  const { user } = useAuth();
  return user.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/tasks" element={<MyTasks />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route element={<AdminOnly />}>
          <Route path="/team" element={<Team />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
