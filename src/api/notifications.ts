/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { Notification, PaginatedResult } from '../types/api';

const EMPTY_PAGE: PaginatedResult<Notification> = { items: [], pageNumber: 1, totalPages: 0, totalCount: 0 };

export interface GetMyNotificationsParams {
  pageNumber?: number;
  pageSize?: number;
}

export const getMyNotifications = async (params: GetMyNotificationsParams = {}): Promise<PaginatedResult<Notification>> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    // No notification seed data in the mock database yet — demo mode
    // shows an empty state here rather than fake notifications (mirrors
    // getShowcasePosts).
    return EMPTY_PAGE;
  }

  const response = await apiClient.get<PaginatedResult<Notification>>('/notifications', { params });
  return response.data;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return 0;
  }

  const response = await apiClient.get<number>('/notifications/unread-count');
  return response.data;
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }

  await apiClient.post(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }

  await apiClient.post('/notifications/read-all');
};
