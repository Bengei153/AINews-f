/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { EarnStoryCard, EarnStoryDetail } from '../types/api';

// --- Public ------------------------------------------------------------------

export const getEarnStories = async (category?: string): Promise<EarnStoryCard[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    // No seed content for this brand-new section in demo mode — the empty
    // state on the page itself explains that and points at "Log in as admin".
    return [];
  }
  const response = await apiClient.get<EarnStoryCard[]>('/earn-stories', { params: { category } });
  return response.data;
};

export const getEarnStoryBySlug = async (slug: string): Promise<EarnStoryDetail> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    throw new Error('Story not found.');
  }
  const response = await apiClient.get<EarnStoryDetail>(`/earn-stories/${slug}`);
  return response.data;
};

// --- Admin: automated discovery + review --------------------------------------

export interface DraftEarnStory {
  id: string;
  title: string;
  slug: string;
  category: string;
  channelName: string;
  videoUrl: string;
  whatTheyBuilt: string;
  detailedSummary: string | null;
  toolsUsedText: string;
  startupCost: string;
  timeToFirstIncome: string;
  claimedEarnings: string;
  caveats: string;
  coverImageUrl: string | null;
  hasSummary: boolean;
  created: string;
}

export interface UpdateEarnStoryPayload {
  title: string;
  category: string;
  whatTheyBuilt: string;
  detailedSummary: string;
  toolsUsedText: string; // comma-separated
  startupCost: string;
  timeToFirstIncome: string;
  claimedEarnings: string;
  caveats: string;
  coverImageUrl: string | null; // null removes the image
}

export interface EarnStoryDiscoveryResult {
  candidatesFound: number;
  draftsCreated: number;
  duplicates: number;
  unreachable: number;
  errors: string[];
}

export interface GenerateSummaryResult {
  success: boolean;
  failureReason: string | null;
}

export interface GeneratePendingSummariesResult {
  attempted: number;
  succeeded: number;
  errors: string[];
}

export const getAdminEarnStoryDrafts = async (): Promise<DraftEarnStory[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<DraftEarnStory[]>('/earn-stories/drafts');
  return response.data;
};

// Topic-driven, same shape as AI tool discovery: finds real public YouTube
// videos and saves them as bare drafts. Does NOT watch the videos yet — that
// is a separate, slower step (generateEarnStorySummary), so this step stays
// quick.
export const discoverEarnStories = async (topic: string): Promise<EarnStoryDiscoveryResult> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return {
      candidatesFound: 0,
      draftsCreated: 0,
      duplicates: 0,
      unreachable: 0,
      errors: ['Video discovery is not simulated in demo mode.'],
    };
  }
  const response = await apiClient.post<EarnStoryDiscoveryResult>('/earn-stories/discover', { topic });
  return response.data;
};

// Watches one story's video and (re)generates its detailed summary. Can take
// a while (the video is actually being processed) — the caller should show a
// per-card loading state, not a blocking full-page spinner.
export const generateEarnStorySummary = async (storyId: string): Promise<GenerateSummaryResult> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { success: false, failureReason: 'Video summarization is not simulated in demo mode.' };
  }
  const response = await apiClient.post<GenerateSummaryResult>(`/earn-stories/${storyId}/generate-summary`);
  return response.data;
};

// Generates summaries for every draft that doesn't have one yet, one at a
// time server-side. Can take several minutes for a large queue.
export const generateAllPendingEarnStorySummaries = async (): Promise<GeneratePendingSummariesResult> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { attempted: 0, succeeded: 0, errors: ['Video summarization is not simulated in demo mode.'] };
  }
  const response = await apiClient.post<GeneratePendingSummariesResult>('/earn-stories/generate-pending');
  return response.data;
};

export const updateEarnStory = async (storyId: string, payload: UpdateEarnStoryPayload): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }
  await apiClient.put(`/earn-stories/${storyId}`, payload);
};

export const publishEarnStory = async (storyId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }
  await apiClient.post(`/earn-stories/${storyId}/publish`);
};

export const deleteEarnStory = async (storyId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }
  await apiClient.delete(`/earn-stories/${storyId}`);
};
