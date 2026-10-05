/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { CreatedPageCard, CreatedPageDetail } from '../types/api';

// --- Public --------------------------------------------------------------

export const getCreatedPages = async (category?: string): Promise<CreatedPageCard[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<CreatedPageCard[]>('/created-pages', { params: { category } });
  return response.data;
};

export const getCreatedPageBySlug = async (slug: string): Promise<CreatedPageDetail> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    throw new Error('Page not found.');
  }
  const response = await apiClient.get<CreatedPageDetail>(`/created-pages/${slug}`);
  return response.data;
};

// --- Owner dashboard + wizard ----------------------------------------------

export type DeliveryMode = 'Download' | 'Link' | 'ConnectBackend';

export interface MyCreatedPage {
  id: string;
  title: string;
  slug: string;
  status: 'Draft' | 'Published';
  deliveryMode: DeliveryMode;
  coverImageUrl: string | null;
  viewCount: number;
  created: string;
}

export interface OwnedCreatedPage {
  id: string;
  title: string;
  slug: string;
  status: 'Draft' | 'Published';
  shortDescription: string;
  detailedDescription: string;
  category: string;
  toolsUsedText: string;
  deliveryMode: DeliveryMode;
  deliveryUrl: string;
  coverImageUrl: string | null;
  viewCount: number;
}

export interface UpdatePagePayload {
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: string;
  toolsUsedText: string;
  deliveryMode: DeliveryMode;
  deliveryUrl: string;
  coverImageUrl: string | null;
}

export const getMyCreatedPages = async (): Promise<MyCreatedPage[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<MyCreatedPage[]>('/created-pages/mine');
  return response.data;
};

export const getCreatedPageForEdit = async (pageId: string): Promise<OwnedCreatedPage> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    throw new Error('Page not found.');
  }
  const response = await apiClient.get<OwnedCreatedPage>(`/created-pages/${pageId}/edit`);
  return response.data;
};

export const createPageDraft = async (title: string): Promise<string> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    throw new Error('Creating pages is not simulated in demo mode.');
  }
  const response = await apiClient.post<string>('/created-pages', { title });
  return response.data;
};

export const updateCreatedPage = async (pageId: string, payload: UpdatePagePayload): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }
  await apiClient.put(`/created-pages/${pageId}`, payload);
};

export const publishCreatedPage = async (pageId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }
  await apiClient.post(`/created-pages/${pageId}/publish`);
};

export const deleteCreatedPage = async (pageId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }
  await apiClient.delete(`/created-pages/${pageId}`);
};

// --- Mark ------------------------------------------------------------------

export interface MarkChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface MarkChatResponse {
  pageId: string;
  reply: string;
  page: {
    id: string;
    title: string;
    shortDescription: string;
    detailedDescription: string;
    category: string;
    toolsUsedText: string;
    deliveryMode: DeliveryMode;
    deliveryUrl: string;
    coverImageUrl: string | null;
  };
}

// pageId null starts a brand-new page on the first message.
export const sendMarkChatMessage = async (
  pageId: string | null,
  history: MarkChatTurn[],
  message: string
): Promise<MarkChatResponse> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    throw new Error('Chatting with Mark is not simulated in demo mode.');
  }
  const response = await apiClient.post<MarkChatResponse>('/created-pages/chat', {
    pageId,
    history,
    message,
  });
  return response.data;
};
