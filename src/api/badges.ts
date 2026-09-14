/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { Badge } from '../types/api';

export const getMyBadges = async (): Promise<Badge[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }

  const response = await apiClient.get<Badge[]>('/badges/me');
  return response.data;
};

export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }

  const response = await apiClient.get<Badge[]>(`/badges/users/${userId}`);
  return response.data;
};
