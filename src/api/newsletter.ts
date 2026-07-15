/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';

export const subscribeToNewsletter = async (email: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }

  await apiClient.post('/newsletter/subscribe', { email });
};

export const unsubscribeFromNewsletter = async (token: string): Promise<{ message: string }> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { message: "You've been unsubscribed." };
  }

  const response = await apiClient.get<{ message: string }>('/newsletter/unsubscribe', {
    params: { token },
  });
  return response.data;
};

export interface NewsletterSendResult {
  articleCount: number;
  recipientCount: number;
  failedSends: number;
  errors: string[];
}

export const sendNewsletterNow = async (articleCount: number = 5): Promise<NewsletterSendResult> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { articleCount: 0, recipientCount: 0, failedSends: 0, errors: ['Newsletter sending is not simulated in demo mode.'] };
  }

  const response = await apiClient.post<NewsletterSendResult>('/newsletter/send', null, {
    params: { articleCount },
  });
  return response.data;
};