// @ts-nocheck
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api, clearTokens, getAccessToken, getRefreshToken, SESSION_EXPIRED_EVENT, setTokens } from '@/lib/api/client';
import { disconnectSocket, getSocket } from '@/lib/realtime/socketClient';
import type { AuthSessionUser } from '@/types/auth';
import type { UserProfile } from '@/types/user';
import {
  SystemLoadingScreen,
  type AuthLoadingAction,
} from '@/lib/ui/SystemLoadingScreen';

interface AuthContextValue {
  currentUser: AuthSessionUser | null;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  loading: boolean;
  authLoading: boolean;
  authAction: AuthLoadingAction;
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

const waitMs = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authAction, setAuthAction] = useState<AuthLoadingAction>('session');
  const [loaderRole, setLoaderRole] = useState<string | null>(null);
  const [loaderDepartment, setLoaderDepartment] = useState<string | null>(null);
  const [loaderVariant, setLoaderVariant] = useState<'loading' | 'error' | 'success'>('loading');
  const [loaderErrorMessage, setLoaderErrorMessage] = useState<string | null>(null);
  const [loaderUserName, setLoaderUserName] = useState<string | null>(null);
  const logoutClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authFailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAuthLoading = useCallback(() => {
    if (authFailTimer.current) {
      clearTimeout(authFailTimer.current);
      authFailTimer.current = null;
    }
    setAuthLoading(false);
    setAuthAction('idle');
    setLoaderRole(null);
    setLoaderDepartment(null);
    setLoaderUserName(null);
    setLoaderVariant('loading');
    setLoaderErrorMessage(null);
  }, []);

  const showAuthFailure = useCallback(
    (error: unknown, kind: 'login' | 'signup') => {
      const raw = String((error as { message?: string })?.message || '');
      const lower = raw.toLowerCase();
      const status = (error as { status?: number })?.status;

      let friendly = raw;
      if (
        status === 429 ||
        lower.includes('throttlerexception') ||
        lower.includes('too many requests') ||
        lower.includes('too many attempts')
      ) {
        friendly = lower.includes('please wait')
          ? raw
          : 'You have made too many attempts. Please wait about a minute, then try again.';
      } else if (
        kind === 'login' &&
        (lower.includes('invalid email or password') ||
          lower.includes('invalid credentials') ||
          lower.includes('unauthorized'))
      ) {
        friendly = 'Invalid email or password. Please check your credentials.';
      } else if (!friendly) {
        friendly =
          kind === 'signup'
            ? 'Account setup failed. Please try again.'
            : 'Sign-in failed. Please try again.';
      }

      setLoaderVariant('error');
      setLoaderErrorMessage(friendly);
      setAuthLoading(true);

      return new Promise<void>((resolve) => {
        authFailTimer.current = setTimeout(() => {
          authFailTimer.current = null;
          clearAuthLoading();
          resolve();
        }, 1600);
      });
    },
    [clearAuthLoading],
  );

  const applySession = useCallback((user: UserProfile) => {
    const role = String(user.role || 'user').toLowerCase();
    setUserProfile(user);
    setCurrentUser({
      uid: user.uid || user.id,
      email: user.email,
      role,
    });
    setLoaderRole(role);
    setLoaderDepartment(user.department || null);
    setLoaderUserName(user.name || null);
    getSocket();
  }, []);

  const loadSession = useCallback(async () => {
    setAuthAction('session');
    setLoaderVariant('loading');
    setLoaderErrorMessage(null);

    const startedAt = Date.now();
    let restored = false;

    try {
      if (!getAccessToken() && !getRefreshToken()) {
        return;
      }

      const user = await api.get<UserProfile>('/api/v1/auth/me');
      if (user) {
        applySession(user);
        restored = true;
      }
    } catch {
      clearTokens();
      setCurrentUser(null);
      setUserProfile(null);
      setLoaderRole(null);
      setLoaderDepartment(null);
      setLoaderUserName(null);
      disconnectSocket();
    } finally {
      if (restored) {
        const elapsed = Date.now() - startedAt;
        await waitMs(Math.max(0, 1900 - elapsed));
        setLoaderVariant('success');
        await waitMs(1100);
      }

      setLoading(false);
      setAuthAction('idle');
      setLoaderVariant('loading');
    }
  }, [applySession]);

  const signup = async (
    email: string,
    password: string,
    name: string,
    _role = 'user',
    department = '',
  ) => {
    setLoaderVariant('loading');
    setLoaderErrorMessage(null);
    setAuthAction('signup');
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
    } catch (error) {
      await showAuthFailure(error, 'signup');
      throw error;
    }
  };

  const signin = async (email: string, password: string) => {
    setLoaderVariant('loading');
    setLoaderErrorMessage(null);
    setAuthAction('login');
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
    } catch (error) {
      await showAuthFailure(error, 'login');
      throw error;
    }
  };

  const logout = async () => {
    if (logoutClearTimer.current) {
      clearTimeout(logoutClearTimer.current);
      logoutClearTimer.current = null;
    }

    const roleSnapshot =
      userProfile?.role || currentUser?.role || loaderRole || null;
    const departmentSnapshot = userProfile?.department || loaderDepartment || null;
    const nameSnapshot = userProfile?.name || loaderUserName || null;
    const startedAt = Date.now();

    setLoaderVariant('loading');
    setLoaderErrorMessage(null);
    setLoaderRole(roleSnapshot ? String(roleSnapshot).toLowerCase() : null);
    setLoaderDepartment(departmentSnapshot);
    setLoaderUserName(nameSnapshot);
    setAuthAction('logout');
    setAuthLoading(true);

    try {
      try {
        await api.post('/api/v1/auth/logout', {});
      } catch {
        /* ignore network errors during logout */
      }
      clearTokens();
      disconnectSocket();
      setCurrentUser(null);
      setUserProfile(null);
      router.replace('/');
    } finally {
      // Keep teardown animation visible long enough to feel intentional
      const elapsed = Date.now() - startedAt;
      await waitMs(Math.max(0, 2000 - elapsed));

      setLoaderVariant('success');

      logoutClearTimer.current = setTimeout(() => {
        clearAuthLoading();
        logoutClearTimer.current = null;
      }, 1300);
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
      clearAuthLoading();
      router.replace('/auth');
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [router, clearAuthLoading]);

  // Clear login/signup overlay once we leave the auth route
  useEffect(() => {
    if (
      authLoading &&
      (authAction === 'login' || authAction === 'signup') &&
      pathname &&
      !pathname.startsWith('/auth')
    ) {
      const timer = setTimeout(() => {
        clearAuthLoading();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [pathname, authLoading, authAction, clearAuthLoading]);

  // Safety: never leave auth transition overlay up indefinitely
  useEffect(() => {
    if (!authLoading || authAction === 'idle' || authAction === 'session') return;
    if (loaderVariant === 'error' || loaderVariant === 'success') return;
    const safety = setTimeout(() => {
      clearAuthLoading();
    }, 10000);
    return () => clearTimeout(safety);
  }, [authLoading, authAction, clearAuthLoading, loaderVariant]);

  useEffect(() => {
    return () => {
      if (logoutClearTimer.current) {
        clearTimeout(logoutClearTimer.current);
      }
      if (authFailTimer.current) {
        clearTimeout(authFailTimer.current);
      }
    };
  }, []);

  const value: AuthContextValue = {
    currentUser,
    userProfile,
    setUserProfile,
    loading,
    authLoading,
    authAction,
    mounted,
    signin,
    signup,
    logout,
    refreshProfile: loadSession,
  };

  const showSystemLoader = loading || authLoading;

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showSystemLoader && (
        <SystemLoadingScreen
          action={loading ? 'session' : authAction}
          role={loaderRole || userProfile?.role || currentUser?.role}
          department={loaderDepartment || userProfile?.department}
          userName={loaderUserName || userProfile?.name}
          variant={loaderVariant}
          errorMessage={loaderErrorMessage}
        />
      )}
    </AuthContext.Provider>
  );
}
