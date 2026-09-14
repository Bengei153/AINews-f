/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { FollowStatus } from '../types/api';

export const getFollowStatus = async (userId: string): Promise<FollowStatus> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { isFollowing: false, followerCount: 0, followingCount: 0 };
  }

  const response = await apiClient.get<FollowStatus>(`/follows/${userId}/status`);
  return response.data;
};

export const followUser = async (userId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }

  await apiClient.post(`/follows/${userId}`);
};

export const unfollowUser = async (userId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }

  await apiClient.delete(`/follows/${userId}`);
};
