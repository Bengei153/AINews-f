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

/** The public project detail, plus whether the signed-in viewer is the one who made it (so the page can offer Edit / Unpublish / Delete). */
export type CreatedPageDetailForViewer = CreatedPageDetail & {
  isOwner?: boolean;
  /** Short address of the page Mark built, e.g. "pelz-foods-k3f9x2", served at /api/pelz-foods-k3f9x2. Null when there is no built page. */
  siteAddress?: string | null;
};

export const getCreatedPageBySlug = async (slug: string): Promise<CreatedPageDetailForViewer> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    throw new Error('Page not found.');
  }
  const response = await apiClient.get<CreatedPageDetailForViewer>(`/created-pages/${slug}`);
  return response.data;
};

// --- Owner dashboard + wizard ----------------------------------------------

// BuiltPage = Mark built a web page for this project and AI Brief hosts it (no outside link needed).
export type DeliveryMode = 'Download' | 'Link' | 'ConnectBackend' | 'BuiltPage';

// Where Mark's page build is up to. 'None' = never built.
export type PageBuildStatus = 'None' | 'Building' | 'Ready' | 'Failed';

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
  buildStatus: PageBuildStatus;
  buildError: string | null;
  /** The page Mark built. Untrusted AI-written code: only ever show it inside <BuiltPageFrame>. */
  builtHtml: string | null;
  builtAt: string | null;
  /** True when there is an earlier version to go back to (Mark's last change can be undone). */
  canUndoBuild: boolean;
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
    buildStatus: PageBuildStatus;
    hasBuiltPage: boolean;
  };
  /** Set when Mark just started building the page this turn. */
  buildInstruction?: string | null;
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

// --- Mark builds the page -----------------------------------------------------

// The "Build with Mark" / "Rebuild" button. Returns at once; the build runs in the background, so poll
// getCreatedPageForEdit until buildStatus leaves 'Building'. `instruction` is what to build or change.
export const buildCreatedPage = async (pageId: string, instruction?: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    throw new Error('Building pages is not simulated in demo mode.');
  }
  await apiClient.post(`/created-pages/${pageId}/build`, { instruction: instruction?.trim() || null });
};

// Puts the page back to how it was before Mark's last build or change. Instant, no AI call. Press again to bring the change back.
export const undoBuildCreatedPage = async (pageId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    throw new Error('Undo is not simulated in demo mode.');
  }
  await apiClient.post(`/created-pages/${pageId}/build/undo`);
};

// Takes the owner's published page back to a draft (it leaves the public Projects page, nothing is lost).
// Not Premium-gated: a member whose Premium has ended can still take their own page down.
export const unpublishCreatedPage = async (pageId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }
  await apiClient.post(`/created-pages/${pageId}/unpublish`);
};
