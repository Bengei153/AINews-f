/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, BookmarkItem } from '../types/api';
import { getStoredUser, getRefreshToken, clearTokens } from '../api/client';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import { getMe, updateMeInterests, getBookmarks, toggleBookmark as apiToggleBookmark } from '../api/me';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  bookmarks: BookmarkItem[];
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateInterests: (interestIds: string[]) => Promise<void>;
  toggleBookmark: (articleId: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  refreshBookmarks: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore the session on boot. A returning visitor should look signed in straight away and STAY signed in:
  // the only thing that ends a session is the server saying so (the API client clears the tokens and fires
  // 'auth-logout-redirect' when that happens). A slow or unreachable server never does — it just means the
  // fresh profile arrives a little later.
  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;

    const loadProfile = async (attempt: number) => {
      try {
        const profile = await getMe();
        if (cancelled) return;
        setUser(profile);
        try {
          const bms = await getBookmarks();
          if (!cancelled) setBookmarks(bms);
        } catch {
          // Bookmarks are not essential to being signed in.
        }
      } catch (err) {
        if (cancelled) return;
        if (!getRefreshToken()) {
          // The server ended the session (tokens already cleared by the API client).
          setUser(null);
          return;
        }
        // A connection problem (e.g. the server waking up): stay signed in and try again shortly.
        console.warn('Could not refresh the profile yet; will retry:', err);
        if (attempt < 6) {
          retryTimer = window.setTimeout(() => loadProfile(attempt + 1), Math.min(5000 * (attempt + 1), 30000));
        }
      }
    };

    const hydrate = () => {
      const stored = getStoredUser();
      if (stored && stored.id && getRefreshToken()) {
        // What we saved at sign-in is enough to show the person as signed in immediately.
        setUser({
          id: stored.id,
          email: stored.email,
          fullName: stored.fullName,
          role: stored.role,
          interests: stored.interests || [],
        });
        setIsLoading(false);
        loadProfile(0);
      } else {
        setIsLoading(false);
      }
    };

    hydrate();

    // Listen to failure redirects emitted from axios interceptors
    const handleLogoutEvent = () => {
      clearTokens();
      setUser(null);
      setBookmarks([]);
    };

    // Signing in or out in another tab is reflected here too.
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== 'aibrief_refresh_token') return;
      if (event.newValue === null) {
        setUser(null);
        setBookmarks([]);
      } else if (event.oldValue === null) {
        hydrate();
      }
    };

    window.addEventListener('auth-logout-redirect', handleLogoutEvent);
    window.addEventListener('storage', handleStorage);
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      window.removeEventListener('auth-logout-redirect', handleLogoutEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authData = await apiLogin(email, password);
      const profile = await getMe();
      setUser(profile);
      
      const bms = await getBookmarks();
      setBookmarks(bms);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const authData = await apiRegister(fullName, email, password);
      const profile = await getMe();
      setUser(profile);
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setBookmarks([]);
  };

  const refreshProfile = async () => {
    try {
      const profile = await getMe();
      setUser(profile);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const refreshBookmarks = async () => {
    if (!user) return;
    try {
      const bms = await getBookmarks();
      setBookmarks(bms);
    } catch (err) {
      console.error('Failed to refresh bookmarks:', err);
    }
  };

  const updateInterests = async (interestIds: string[]) => {
    await updateMeInterests(interestIds);
    await refreshProfile();
  };

  const toggleBookmark = async (articleId: string): Promise<boolean> => {
    const bookmarked = await apiToggleBookmark(articleId);
    await refreshBookmarks();
    return bookmarked;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        bookmarks,
        login,
        register,
        logout,
        updateInterests,
        toggleBookmark,
        refreshProfile,
        refreshBookmarks,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
