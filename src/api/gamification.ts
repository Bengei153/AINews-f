/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { GameProfile } from '../types/api';

export interface DailyActivityResult {
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  xpAwardedToday: boolean;
  streakBonusAwarded: boolean;
}

export const getMyGameProfile = async (): Promise<GameProfile> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { totalXp: 0, currentStreak: 0, longestStreak: 0, lastActivityDate: null };
  }
  const response = await apiClient.get<GameProfile>('/gamification/me');
  return response.data;
};

/// Call once per session while authenticated — idempotent per UTC day on
/// the backend, so calling it more than once is harmless.
export const pingDailyActivity = async (): Promise<DailyActivityResult> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { currentStreak: 0, longestStreak: 0, totalXp: 0, xpAwardedToday: false, streakBonusAwarded: false };
  }
  const response = await apiClient.post<DailyActivityResult>('/gamification/ping');
  return response.data;
};