import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/index.js';
import { useAuth } from './AuthContext.jsx';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const result = await api.notifications.list();
      setItems(result.notifications);
    } catch {
      return;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    reload();
    const id = setInterval(reload, 30000);
    return () => clearInterval(id);
  }, [user, reload]);

  const markRead = useCallback(async (id) => {
    setItems((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item)));
    try {
      await api.notifications.markRead(id);
    } catch {
      reload();
    }
  }, [reload]);

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((item) => ({ ...item, read: true })));
    try {
      await api.notifications.markAllRead();
    } catch {
      reload();
    }
  }, [reload]);

  const remove = useCallback(async (id) => {
    setItems((list) => list.filter((item) => item.id !== id));
    try {
      await api.notifications.remove(id);
    } catch {
      reload();
    }
  }, [reload]);

  const value = useMemo(
    () => ({ items, loading, unread: items.filter((item) => !item.read).length, reload, markRead, markAllRead, remove }),
    [items, loading, reload, markRead, markAllRead, remove]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => useContext(NotificationsContext);
