import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const refreshingRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    verifySession();
  }, []);

  const verifySession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          return;
        }
      }

      // Access token expired — try refresh
      const refreshed = await tryRefresh();
      if (!refreshed) {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const tryRefresh = async (): Promise<boolean> => {
    // Deduplicate concurrent refresh attempts
    if (refreshingRef.current) return refreshingRef.current;

    refreshingRef.current = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
            return true;
          }
        }
        return false;
      } catch {
        return false;
      } finally {
        refreshingRef.current = null;
      }
    })();

    return refreshingRef.current;
  };

  // Wrapper around fetch that auto-refreshes on 401
  const authFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const opts: RequestInit = { ...init, credentials: 'include' };
    let response = await fetch(input, opts);

    if (response.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        response = await fetch(input, opts);
      } else {
        setUser(null);
      }
    }

    return response;
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error: any) {
      if (error.message) throw error;
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  const logout = () => {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});

    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.is_admin === true;

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
