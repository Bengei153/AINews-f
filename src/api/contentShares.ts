/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { SharedContentType } from '../types/api';

export interface SendContentSharePayload {
  recipientUserIds: string[];
  contentType: SharedContentType;
  contentId: string;
  message?: string | null;
}

// Returns how many recipients actually received it (a picked user who has
// since unfollowed you between opening the picker and submitting it is
// silently skipped server-side, not an error).
export const sendContentShare = async (payload: SendContentSharePayload): Promise<number> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return payload.recipientUserIds.length;
  }

  const response = await apiClient.post<number>('/content-shares', payload);
  return response.data;
};
