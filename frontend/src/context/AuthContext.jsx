import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, session } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(session.get()));

  const logout = useCallback(() => {
    session.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!session.get()) return undefined;
    let active = true;
    api.auth
      .me()
      .then((me) => active && setUser(me))
      .catch(() => session.clear())
      .finally(() => active && setBooting(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.addEventListener('pf:unauthorized', logout);
    return () => window.removeEventListener('pf:unauthorized', logout);
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const result = await api.auth.login(credentials);
    session.set(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (details) => {
    const result = await api.auth.register(details);
    session.set(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const value = useMemo(() => ({ user, booting, login, register, logout, setUser }), [user, booting, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
