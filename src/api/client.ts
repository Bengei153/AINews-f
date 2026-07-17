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

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

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

// 2 & 3 & 4. Response Interceptor: Catch 401 and attempt single silent refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 Unauthorized, and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid refreshing on refresh calls or if we are already refreshing
      if (originalRequest.url?.includes('/auth/refresh')) {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth-logout-redirect'));
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth-logout-redirect'));
        return Promise.reject(error);
      }
      
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          // Perform the silent refresh call
          const response = await axios.post(`${VITE_API_BASE_URL}/auth/refresh`, { refreshToken });
          const data = response.data;
          
          saveTokens(data.accessToken, data.refreshToken, {
            id: data.userId,
            fullName: data.fullName,
            email: data.email,
            role: data.role
          });
          
          isRefreshing = false;
          onRefreshed(data.accessToken);
        } catch (refreshError) {
          isRefreshing = false;
          clearTokens();
          window.dispatchEvent(new CustomEvent('auth-logout-redirect'));
          return Promise.reject(refreshError);
        }
      }
      
      // Return a promise that resolves when the token refresh completes
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(apiClient(originalRequest));
        });
      });
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
