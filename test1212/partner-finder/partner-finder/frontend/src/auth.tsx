import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError } from './api';

export interface Me { id: number; name: string; avatar_url: string | null; profile_completed: boolean; is_admin?: boolean }

interface AuthValue {
  user: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try { setUser(await api<Me>('/me')); }
    catch (e) { if (e instanceof ApiError && e.status === 401) setUser(null); else throw e; }
  }, []);

  useEffect(() => { refresh().catch(() => setUser(null)).finally(() => setLoading(false)); }, [refresh]);

  const login = async (email: string, password: string) => { await api('/auth/login', { method: 'POST', body: { email, password } }); await refresh(); };
  const register = async (email: string, password: string, nickname: string) => { await api('/auth/register', { method: 'POST', body: { email, password, nickname } }); await refresh(); };
  const logout = async () => { await api('/auth/logout', { method: 'POST' }); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
