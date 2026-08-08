/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { ArticleReactions, ReactionType } from '../types/api';

const EMPTY_COUNTS: Record<ReactionType, number> = { Like: 0, Love: 0, Insightful: 0, MindBlown: 0 };

export const getReactions = async (articleId: string): Promise<ArticleReactions> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { counts: EMPTY_COUNTS, currentUserReaction: null };
  }

  const response = await apiClient.get<ArticleReactions>(`/articles/${articleId}/reactions`);
  return response.data;
};

/// Sets the current user's reaction. Passing the same type that's already
/// active toggles it off — mirrors the backend's toggle behavior exactly.
export const setReaction = async (articleId: string, reactionType: ReactionType): Promise<ReactionType | null> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return reactionType;
  }

  const response = await apiClient.post<ReactionType | null>(`/articles/${articleId}/reactions`, { reactionType });
  return response.data;
};