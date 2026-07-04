// @ts-nocheck
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, clearTokens, getAccessToken, getRefreshToken, SESSION_EXPIRED_EVENT, setTokens } from '@/lib/api/client';
import { disconnectSocket, getSocket } from '@/lib/realtime/socketClient';
import type { AuthSessionUser } from '@/types/auth';
import type { UserProfile } from '@/types/user';

interface AuthContextValue {
  currentUser: AuthSessionUser | null;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  loading: boolean;
  authLoading: boolean;
  mounted: boolean;
  signin: (email: string, password: string) => Promise<UserProfile>;
  signup: (
    email: string,
    password: string,
    name: string,
    role?: string,
    department?: string,
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const applySession = useCallback((user: UserProfile) => {
    setUserProfile(user);
    setCurrentUser({
      uid: user.uid || user.id,
      email: user.email,
      role: String(user.role).toLowerCase(),
    });
    getSocket();
  }, []);

  const loadSession = useCallback(async () => {
    try {
      if (!getAccessToken() && !getRefreshToken()) {
        return;
      }
      const user = await api.get<UserProfile>('/api/v1/auth/me');
      if (user) applySession(user);
    } catch {
      clearTokens();
      setCurrentUser(null);
      setUserProfile(null);
      disconnectSocket();
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  const signup = async (
    email: string,
    password: string,
    name: string,
    _role = 'user',
    department = '',
  ) => {
    setAuthLoading(true);
    try {
      const data = await api.post<{
        access_token: string;
        refresh_token: string;
        user: UserProfile;
      }>('/api/v1/auth/register', {
        email,
        password,
        name,
        department,
      });
      if (!data) throw new Error('Registration failed');
      setTokens(data.access_token, data.refresh_token);
      applySession(data.user);
      return data.user;
    } finally {
      setAuthLoading(false);
    }
  };

  const signin = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const data = await api.post<{
        access_token: string;
        refresh_token: string;
        user: UserProfile;
      }>('/api/v1/auth/login', { email, password });
      if (!data) throw new Error('Login failed');
      setTokens(data.access_token, data.refresh_token);
      applySession(data.user);
      return data.user;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      try {
        await api.post('/api/v1/auth/logout', {});
      } catch {
        /* ignore */
      }
      clearTokens();
      disconnectSocket();
      setCurrentUser(null);
      setUserProfile(null);
      router.replace('/');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    const onSessionExpired = () => {
      setCurrentUser(null);
      setUserProfile(null);
      disconnectSocket();
      router.replace('/auth');
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [router]);

  const value: AuthContextValue = {
    currentUser,
    userProfile,
    setUserProfile,
    loading,
    authLoading,
    mounted,
    signin,
    signup,
    logout,
    refreshProfile: loadSession,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
