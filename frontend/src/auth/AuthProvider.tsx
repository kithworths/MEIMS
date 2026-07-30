import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { fetchProfile, login as performLogin, logout as performLogout, refreshSession } from '../api/auth';
import { clearAuthTokens, getStoredRefreshToken, setAccessToken, setStoredRefreshToken } from '../api/axios';
import type { AuthUser } from '../api/auth';
import logger from '../lib/logger';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission?: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    const refreshToken = getStoredRefreshToken();

    // Development logging
    if (refreshToken) logger.debug('Refresh token loaded from storage');
    else logger.debug('No refresh token found in storage');

    if (!refreshToken) {
      setLoading(false);
      return;
    }

    try {
      // Attempt to refresh access token using refresh token
      logger.debug('Attempting to refresh session');
      const accessToken = await refreshSession();
      logger.debug('Refresh successful; storing access token');
      setAccessToken(accessToken);

      // Load user profile
      logger.debug('Fetching current user profile');
      const profile = await fetchProfile();
      setUser(profile);
      logger.debug('Current user loaded', { email: profile?.email });
    } catch (error) {
      logger.warn('Failed to restore session; clearing tokens', { error });
        clearAuthTokens();
        setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    logger.debug('Logging in', { email });
    const authResponse = await performLogin(email, password);
    logger.debug('Login successful; storing tokens');
    setAccessToken(authResponse.access);
    setStoredRefreshToken(authResponse.refresh);
    setUser(authResponse.user);
  }, []);

  const logout = useCallback(async () => {
    logger.debug('Logging out');
    const refreshToken = getStoredRefreshToken();

    try {
      if (refreshToken) {
        await performLogout(refreshToken);
      }
    } catch (err) {
      // Allow local logout even if the API call fails.
      logger.warn('Logout API call failed', { error: err });
    } finally {
      clearAuthTokens();
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (permission?: string) => {
      // If no specific permission is required, allow access for authenticated users
      if (!permission) return Boolean(user);

      // Defensive checks - if the user object contains roles or permissions, check them
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = user as any;
      if (!u) return false;

      if (Array.isArray(u.permissions) && u.permissions.includes(permission)) return true;
      if (u.is_superuser || u.is_staff) return true;

      if (Array.isArray(u.roles)) {
        const roles = u.roles as string[];
        if (roles.includes(permission)) return true;
        const permissionModule = permission.split('.')[0];
        if (roles.some((role) => role.toLowerCase() === permissionModule.toLowerCase())) return true;
      }

      if (typeof u.role === 'string') {
        const roleName = u.role.toLowerCase();
        if (roleName === permission.toLowerCase() || permission.toLowerCase().startsWith(`${roleName}.`)) return true;
      }

      return false;
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      hasPermission,
    }),
    [user, loading, login, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}
