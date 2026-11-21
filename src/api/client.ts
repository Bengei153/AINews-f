/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types/api';

// Retrieve base URL from Vite environment variables (defaulting to mock if empty)
export const VITE_API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || '';

// If VITE_API_BASE_URL is not set or explicitly set to 'mock', fall back to
// the high-fidelity mock database simulation. NOTE: this must NOT match on
// the real backend's own address — localhost:5254 is where the actual
// ASP.NET Core API runs, so treating it as a mock trigger would silently
// route every request to the fake in-browser database instead.
export const isDemoMode = (): boolean => {
  return !VITE_API_BASE_URL || VITE_API_BASE_URL === 'mock';
};
// The backend's own root URL, without the /api suffix — used to build
// links to non-API routes it also serves, like /share/articles/{slug}
// (see ShareController on the backend). Derived rather than configured
// separately, so it can never drift out of sync with VITE_API_BASE_URL.
export const getApiRootUrl = (): string => VITE_API_BASE_URL.replace(/\/api\/?$/, '');

// Access token and refresh token storage keys
const ACCESS_TOKEN_KEY = 'aibrief_access_token';
const REFRESH_TOKEN_KEY = 'aibrief_refresh_token';
const USER_INFO_KEY = 'aibrief_user_info';

// Synchronous helper getters/setters for interceptors
export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const saveTokens = (accessToken: string, refreshToken: string, userInfo?: any): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (userInfo) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  }
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
};

export const getStoredUser = (): any | null => {
  const data = localStorage.getItem(USER_INFO_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

// Standard Axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- Keeping people signed in ------------------------------------------------------------------------
//
// The access token is short-lived (30 minutes); the refresh token lasts for weeks and is swapped for a new
// access token silently. Both live in localStorage, so a person stays signed in after closing the tab or the
// browser. The rules below exist so that ONLY the server saying "this session is over" ever signs someone out:
//
//  - A refresh that fails because the server is asleep (a free-tier host waking up takes about a minute),
//    unreachable or erroring is retried, and if it still can't be done the session is KEPT — the request
//    just fails and the person tries again, still signed in.
//  - Everything waiting on an expired token shares ONE refresh and is then retried — including the request
//    that started it. (Before, that request subscribed to "refresh finished" only after it had already
//    finished, so it waited forever: on coming back after 30 minutes the first call, loading the profile,
//    hung or failed and the person looked signed out.)
//  - The server rotates refresh tokens (each is single-use). If another tab already used ours, we pick up the
//    new tokens that tab saved instead of treating the rejection as a sign-out.

const REFRESH_TIMEOUT_MS = 90_000; // long enough for a sleeping host to wake up and answer
const REFRESH_RETRY_DELAYS_MS = [3_000, 6_000]; // after a connection problem or a 5xx

type RefreshFailure = { kind: 'ended' } | { kind: 'unreachable' };

const signalSessionEnded = (): void => {
  clearTokens();
  window.dispatchEvent(new CustomEvent('auth-logout-redirect'));
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Resolves with a fresh access token, or rejects with a RefreshFailure.
const requestNewAccessToken = async (): Promise<string> => {
  const usedRefreshToken = getRefreshToken();
  if (!usedRefreshToken) {
    signalSessionEnded();
    throw { kind: 'ended' } as RefreshFailure;
  }

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await axios.post(
        `${VITE_API_BASE_URL}/auth/refresh`,
        { refreshToken: usedRefreshToken },
        { timeout: REFRESH_TIMEOUT_MS }
      );
      const data = response.data;
      saveTokens(data.accessToken, data.refreshToken, {
        id: data.userId,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      });
      return data.accessToken as string;
    } catch (err: any) {
      const status = err?.response?.status;

      // The server answered, and said this refresh token is no good.
      if (status === 400 || status === 401 || status === 403) {
        // ...but another tab may have just exchanged it for a new pair, which is now in storage.
        const currentRefresh = getRefreshToken();
        const currentAccess = getAccessToken();
        if (currentRefresh && currentRefresh !== usedRefreshToken && currentAccess) {
          return currentAccess;
        }
        signalSessionEnded();
        throw { kind: 'ended' } as RefreshFailure;
      }

      // No answer, a timeout, or a server error: NOT a reason to sign anyone out.
      if (attempt >= REFRESH_RETRY_DELAYS_MS.length) {
        throw { kind: 'unreachable' } as RefreshFailure;
      }
      await sleep(REFRESH_RETRY_DELAYS_MS[attempt]);
    }
  }
};

// One refresh at a time, however many requests found their token expired together.
let refreshInFlight: Promise<string> | null = null;
const refreshAccessToken = (): Promise<string> => {
  if (!refreshInFlight) {
    refreshInFlight = requestNewAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

const isAuthCall = (url?: string): boolean => !!url && /\/auth\/(login|register|refresh)/.test(url);

// 1. Request Interceptor: Attach Authorization header automatically
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: on 401, refresh the token once and retry the request that failed.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthCall(originalRequest.url)) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (failure) {
        const f = failure as RefreshFailure;
        if (f?.kind === 'unreachable') {
          // The session is intact (tokens kept) — we just couldn't reach the server this time.
          const unreachable: ApiError = {
            status: 503,
            title: 'Server unavailable',
            detail: 'Could not reach the server. Please try again in a moment.',
          };
          return Promise.reject(unreachable);
        }
        // Session ended: tokens were already cleared and the logout event fired. Fall through to the normal 401 error.
      }
    }

    // Parse backend standard exception middleware shape
    if (error.response?.data) {
      const serverError: ApiError = error.response.data;
      return Promise.reject(serverError);
    }

    const standardError: ApiError = {
      status: error.response?.status || 500,
      title: 'Network Error',
      detail: error.message || 'An unexpected connection error occurred.',
    };
    return Promise.reject(standardError);
  }
);

// Small delay simulation helper for high-fidelity Mock Mode
export const simulateNetworkDelay = async () => {
  await new Promise((resolve) => setTimeout(resolve, 150));
};
