/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, BookmarkItem } from '../types/api';
import { getStoredUser, clearTokens, isDemoMode } from '../api/client';
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

  // Initial user session hydration on boot
  useEffect(() => {
    const hydrate = async () => {
      const stored = getStoredUser();
      if (stored && stored.id) {
        try {
          // Attempt to fetch fresh profile from API
          const profile = await getMe();
          setUser(profile);
          
          // Fetch user's bookmarks
          const bms = await getBookmarks();
          setBookmarks(bms);
        } catch (err) {
          console.warn('Failed to restore active session:', err);
          // Fall back to stored info in localStorage to keep offline resilient
          if (isDemoMode()) {
            setUser({
              id: stored.id,
              email: stored.email,
              fullName: stored.fullName,
              role: stored.role,
              interests: stored.interests || [],
            });
          } else {
            clearTokens();
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    hydrate();

    // Listen to failure redirects emitted from axios interceptors
    const handleLogoutEvent = () => {
      clearTokens();
      setUser(null);
      setBookmarks([]);
    };

    window.addEventListener('auth-logout-redirect', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout-redirect', handleLogoutEvent);
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
