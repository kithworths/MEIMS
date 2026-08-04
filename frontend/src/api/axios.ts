import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosRequestHeaders,
} from 'axios';

import logger from '../lib/logger';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const REFRESH_TOKEN_KEY = 'meims_refresh_token';

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null; // concurrency guard

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getStoredRefreshToken(): string | null {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token: string | null) {
  if (token) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearAuthTokens() {
  accessToken = null;
  setStoredRefreshToken(null);
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer when available
api.interceptors.request.use((config) => {
  const headers = (config.headers ?? {}) as AxiosRequestHeaders;

  if (accessToken) {
    headers.Authorization = 'Bearer ' + accessToken;
    logger.debug('Attaching access token to request');
  } else {
    logger.debug('No access token available for request');
  }

  config.headers = headers;
  return config;
});

// Refresh token flow with concurrency guard: if a refresh is already in progress, wait for it
async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    logger.debug('Waiting for in-flight token refresh');
    return refreshPromise;
  }

  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error('Refresh token not available');
  }

  refreshPromise = (async () => {
    try {
      // Use raw axios to avoid interceptors
      logger.debug('Refreshing access token');
      const response = await axios.post(`${BASE_URL}/v1/auth/refresh/`, {
        refresh: refreshToken,
      });

      const responseData = response.data?.data;
      const newAccessToken = responseData?.access;
      const newRefreshToken = responseData?.refresh;

      if (!newAccessToken) {
        throw new Error('Unable to refresh access token');
      }

      if (newRefreshToken) {
        setStoredRefreshToken(newRefreshToken);
      }

      setAccessToken(newAccessToken);
      logger.debug('Token refresh successful');
      return newAccessToken;
    } finally {
      // clear the in-flight promise regardless of outcome
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Response interceptor: if 401 and refresh token exists, try to refresh and retry
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const url = originalRequest?.url ?? '';

    // Only attempt refresh for API routes (avoid loops for refresh endpoint)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !url?.endsWith('/auth/refresh/') &&
      getStoredRefreshToken()
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: 'Bearer ' + newAccessToken,
        } as AxiosRequestHeaders;

        logger.debug('[api] Retrying original request with refreshed token', { url: originalRequest.url });

        return api(originalRequest);
      } catch (_refreshError) {
        // Refresh failed: clear tokens and allow application to redirect to login
        void _refreshError;
        clearAuthTokens();
        logger.warn('Token refresh failed; clearing local session', { error: _refreshError });
        // Do not automatically navigate here; let AuthProvider / app react to cleared tokens.
      }
    }

    return Promise.reject(error);
  },
);

export default api;
