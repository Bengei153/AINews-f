/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';

// The backend serialises enums as their names.
export type PromoState = 'Scheduled' | 'Live' | 'Full' | 'Expired' | 'Paused';

export interface Promo {
  id: string;
  code: string;
  name: string;
  description: string;
  grantDays: number;
  startsAt: string;
  endsAt: string;
  maxRedemptions: number;
  redemptionCount: number;
  seatsLeft: number;
  state: PromoState;
  isPaused: boolean;
}

export interface PromoRedemption {
  email: string;
  fullName: string;
  redeemedAt: string;
  grantedDays: number;
}

export interface CreatePromoPayload {
  code: string | null; // null/blank = generate a random one
  name: string;
  description: string | null;
  grantDays: number;
  startsAt: string; // ISO
  endsAt: string; // ISO
  maxRedemptions: number;
}

export interface UpdatePromoPayload {
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  maxRedemptions: number;
}

export interface RedeemPromoResult {
  grantedDays: number;
  premiumExpiresAt: string | null;
  message: string;
}

const demoUnsupported = async (): Promise<never> => {
  await simulateNetworkDelay();
  throw { status: 400, title: 'Demo mode', detail: 'Promos need the real backend.' };
};

// --- Any signed-in user -------------------------------------------------------

export const redeemPromo = async (code: string): Promise<RedeemPromoResult> => {
  if (isDemoMode()) return demoUnsupported();
  const response = await apiClient.post<RedeemPromoResult>('/promos/redeem', { code });
  return response.data;
};

// --- Admin ---------------------------------------------------------------------

export const getPromos = async (): Promise<Promo[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<Promo[]>('/promos');
  return response.data;
};

export const getPromoRedemptions = async (promoId: string): Promise<PromoRedemption[]> => {
  if (isDemoMode()) return demoUnsupported();
  const response = await apiClient.get<PromoRedemption[]>(`/promos/${promoId}/redemptions`);
  return response.data;
};

export const createPromo = async (payload: CreatePromoPayload): Promise<Promo> => {
  if (isDemoMode()) return demoUnsupported();
  const response = await apiClient.post<Promo>('/promos', payload);
  return response.data;
};

export const updatePromo = async (promoId: string, payload: UpdatePromoPayload): Promise<Promo> => {
  if (isDemoMode()) return demoUnsupported();
  const response = await apiClient.put<Promo>(`/promos/${promoId}`, payload);
  return response.data;
};

export const setPromoPaused = async (promoId: string, paused: boolean): Promise<Promo> => {
  if (isDemoMode()) return demoUnsupported();
  const response = await apiClient.post<Promo>(`/promos/${promoId}/${paused ? 'pause' : 'resume'}`);
  return response.data;
};

export const deletePromo = async (promoId: string): Promise<void> => {
  if (isDemoMode()) return demoUnsupported();
  await apiClient.delete(`/promos/${promoId}`);
};
