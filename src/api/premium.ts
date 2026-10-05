/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';

export interface SubscriptionStatus {
  isPremium: boolean;
  expiresAt: string | null;
}

export const getPremiumStatus = async (): Promise<SubscriptionStatus> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { isPremium: false, expiresAt: null };
  }
  const response = await apiClient.get<SubscriptionStatus>('/premium/status');
  return response.data;
};

// Starts a Flutterwave checkout and returns the hosted payment link — the
// caller is expected to do `window.location.href = checkoutUrl`, since this
// has to be a real top-level navigation (Flutterwave's page can't open in an
// iframe).
export const initiatePremiumCheckout = async (): Promise<{ checkoutUrl: string }> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    throw new Error('Checkout is not simulated in demo mode.');
  }
  const response = await apiClient.post<{ checkoutUrl: string }>('/premium/checkout');
  return response.data;
};

export interface PremiumSubscriber {
  userId: string;
  email: string;
  fullName: string;
  expiresAt: string | null;
  isActive: boolean;
}

export const getPremiumSubscribers = async (): Promise<PremiumSubscriber[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<PremiumSubscriber[]>('/premium/subscribers');
  return response.data;
};
