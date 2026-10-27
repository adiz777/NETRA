import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserPublic, UserRole } from '@shared/types/auth.js';
import apiClient, { ApiError } from '../api/client.js';

interface AuthContextType {
  user: UserPublic | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  switchDemoUser: (targetRole: 'investigator' | 'admin') => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_INVESTIGATOR = {
  email: 'investigator@netra.local',
  password: 'Investigator123!',
  fullName: 'Special Agent Dana Scully',
  role: 'investigator' as UserRole,
};

export const DEMO_ADMIN = {
  email: 'admin@netra.local',
  password: 'AdminMaster123!',
  fullName: 'Director Fox Mulder',
  role: 'admin' as UserRole,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [token, setToken] = useState<string | null>(apiClient.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Fetch initial profile if token exists in localStorage
  useEffect(() => {
    async function loadSession() {
      const storedToken = apiClient.getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
        setToken(storedToken);
      } catch (err) {
        console.warn('[AuthContext] Session expired or invalid:', err);
        apiClient.logout();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.login({ email, password });
      setUser(res.user);
      setToken(res.token);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Authentication failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string, role: UserRole = 'investigator') => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.register({ email, password, fullName, role });
        setUser(res.user);
        setToken(res.token);
      } catch (err: any) {
        const msg = err instanceof ApiError ? err.message : 'Registration failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    apiClient.logout();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const switchDemoUser = useCallback(
    async (targetRole: 'investigator' | 'admin') => {
      setIsLoading(true);
      setError(null);
      const demo = targetRole === 'admin' ? DEMO_ADMIN : DEMO_INVESTIGATOR;

      try {
        // Try login first
        const res = await apiClient.login({ email: demo.email, password: demo.password });
        setUser(res.user);
        setToken(res.token);
      } catch (err: any) {
        // If login failed (e.g. user does not exist in fresh D1), register first then login
        try {
          const res = await apiClient.register({
            email: demo.email,
            password: demo.password,
            fullName: demo.fullName,
            role: demo.role,
          });
          setUser(res.user);
          setToken(res.token);
        } catch (regErr: any) {
          console.error('[AuthContext] Failed to switch demo user:', regErr);
          setError(regErr.message || 'Failed to switch demo user');
          throw regErr;
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        switchDemoUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
