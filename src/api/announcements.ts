/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';

// The backend serialises enums as their names.
export type AnnouncementKind = 'General' | 'NewFeature' | 'Promo' | 'Social';
export type AnnouncementState = 'Live' | 'Scheduled' | 'Ended' | 'Off';

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  kind: AnnouncementKind;
  imageUrl: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  showAsPopup: boolean;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  revision: number;
  state: AnnouncementState;
  created: string;
}

export interface AnnouncementPayload {
  title: string;
  message: string;
  kind: AnnouncementKind;
  imageUrl: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  showAsPopup: boolean;
  startsAt: string | null; // ISO, null = live straight away
  endsAt: string | null; // ISO, null = until switched off
}

export interface CreateAnnouncementPayload extends AnnouncementPayload {
  isActive: boolean;
}

const demoUnsupported = async (): Promise<never> => {
  await simulateNetworkDelay();
  throw { status: 400, title: 'Demo mode', detail: 'Announcements need the real backend.' };
};

export const getAdminAnnouncements = async (): Promise<AdminAnnouncement[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<AdminAnnouncement[]>('/announcements/all');
  return response.data;
};

export const createAnnouncement = async (payload: CreateAnnouncementPayload): Promise<AdminAnnouncement> => {
  if (isDemoMode()) return demoUnsupported();
  const response = await apiClient.post<AdminAnnouncement>('/announcements', payload);
  return response.data;
};

export const updateAnnouncement = async (id: string, payload: AnnouncementPayload): Promise<AdminAnnouncement> => {
  if (isDemoMode()) return demoUnsupported();
  const response = await apiClient.put<AdminAnnouncement>(`/announcements/${id}`, payload);
  return response.data;
};

export const setAnnouncementActive = async (id: string, active: boolean): Promise<AdminAnnouncement> => {
  if (isDemoMode()) return demoUnsupported();
  const response = await apiClient.post<AdminAnnouncement>(`/announcements/${id}/${active ? 'activate' : 'deactivate'}`);
  return response.data;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  if (isDemoMode()) return demoUnsupported();
  await apiClient.delete(`/announcements/${id}`);
};
