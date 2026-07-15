/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, getStoredUser, simulateNetworkDelay } from './client';
import { Interest, UserProfile, BookmarkItem } from '../types/api';
import { MockDatabase } from './mockDb';

export const getInterests = async (): Promise<Interest[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return MockDatabase.getInterests();
  }

  const response = await apiClient.get<Interest[]>('/interests');
  return response.data;
};

export const getMe = async (): Promise<UserProfile> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const stored = getStoredUser();
    if (!stored || !stored.id) {
      throw {
        status: 401,
        title: 'Unauthorized',
        detail: 'Authentication is required to access your profile.',
      };
    }

    const users = MockDatabase.getUsers();
    const user = users.find((u) => u.id === stored.id);
    if (!user) {
      throw {
        status: 401,
        title: 'Unauthorized',
        detail: 'User session has expired or is invalid.',
      };
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      interests: user.interests,
    };
  }

  const response = await apiClient.get<UserProfile>('/me');
  return response.data;
};

export const updateMeInterests = async (interestIds: string[]): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const stored = getStoredUser();
    if (!stored || !stored.id) {
      throw {
        status: 401,
        title: 'Unauthorized',
        detail: 'Authentication is required to update interests.',
      };
    }

    const users = MockDatabase.getUsers();
    const user = users.find((u) => u.id === stored.id);
    if (!user) {
      throw {
        status: 401,
        title: 'Unauthorized',
        detail: 'User session invalid.',
      };
    }

    // Convert interest ids to names
    const allInterests = MockDatabase.getInterests();
    const chosenNames = allInterests
      .filter((i) => interestIds.includes(i.id))
      .map((i) => i.name);

    user.interests = chosenNames;
    MockDatabase.saveUsers(users);
    return;
  }

  await apiClient.put('/me/interests', { interestIds });
};

export const getBookmarks = async (): Promise<BookmarkItem[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const stored = getStoredUser();
    if (!stored || !stored.id) {
      throw {
        status: 401,
        title: 'Unauthorized',
        detail: 'Authentication is required to fetch bookmarks.',
      };
    }
    return MockDatabase.getBookmarksForUser(stored.id);
  }

  const response = await apiClient.get<BookmarkItem[]>('/me/bookmarks');
  return response.data;
};

export const toggleBookmark = async (articleId: string): Promise<boolean> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const stored = getStoredUser();
    if (!stored || !stored.id) {
      throw {
        status: 401,
        title: 'Unauthorized',
        detail: 'Please log in to bookmark articles.',
      };
    }

    const users = MockDatabase.getUsers();
    const user = users.find((u) => u.id === stored.id);
    if (!user) {
      throw {
        status: 401,
        title: 'Unauthorized',
        detail: 'User session invalid.',
      };
    }

    const index = user.bookmarks.indexOf(articleId);
    let bookmarked = false;
    if (index >= 0) {
      user.bookmarks.splice(index, 1); // remove
    } else {
      user.bookmarks.push(articleId); // add
      bookmarked = true;
    }

    MockDatabase.saveUsers(users);
    return bookmarked;
  }

  const response = await apiClient.post<boolean>(`/me/bookmarks/${articleId}`);
  return response.data;
};
