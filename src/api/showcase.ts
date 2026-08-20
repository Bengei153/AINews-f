/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { ShowcasePost, ShowcaseReactions, ReactionType, Comment, PaginatedResult } from '../types/api';

export interface GetShowcasePostsParams {
  toolName?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

const EMPTY_PAGE: PaginatedResult<ShowcasePost> = { items: [], pageNumber: 1, totalPages: 0, totalCount: 0 };

export const getShowcasePosts = async (params: GetShowcasePostsParams = {}): Promise<PaginatedResult<ShowcasePost>> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    // No showcase seed data in the mock database yet — demo mode shows an
    // empty state here rather than fake posts (mirrors getTutorials).
    return EMPTY_PAGE;
  }

  const response = await apiClient.get<PaginatedResult<ShowcasePost>>('/showcase/posts', { params });
  return response.data;
};

export const getShowcasePost = async (showcasePostId: string): Promise<ShowcasePost> => {
  const response = await apiClient.get<ShowcasePost>(`/showcase/posts/${showcasePostId}`);
  return response.data;
};

export interface CreateShowcasePostPayload {
  title: string;
  description: string;
  imageUrl?: string | null;
  toolsUsed?: string | null;
}

export const createShowcasePost = async (payload: CreateShowcasePostPayload): Promise<string> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return 'mock-showcase-post-id';
  }

  const response = await apiClient.post<string>('/showcase/posts', payload);
  return response.data;
};

export const deleteShowcasePost = async (showcasePostId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }
  await apiClient.delete(`/showcase/posts/${showcasePostId}`);
};

const EMPTY_COUNTS: Record<ReactionType, number> = { Like: 0, Love: 0, Insightful: 0, MindBlown: 0 };

export const getShowcaseReactions = async (showcasePostId: string): Promise<ShowcaseReactions> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { counts: EMPTY_COUNTS, currentUserReaction: null };
  }

  const response = await apiClient.get<ShowcaseReactions>(`/showcase/posts/${showcasePostId}/reactions`);
  return response.data;
};

/// Sets the current user's reaction on a showcase post. Passing the same
/// type that's already active toggles it off — mirrors setReaction (articles).
export const setShowcaseReaction = async (showcasePostId: string, reactionType: ReactionType): Promise<ReactionType | null> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return reactionType;
  }

  const response = await apiClient.post<ReactionType | null>(`/showcase/posts/${showcasePostId}/reactions`, { reactionType });
  return response.data;
};

export const getShowcaseComments = async (showcasePostId: string): Promise<Comment[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }

  const response = await apiClient.get<Comment[]>(`/showcase/posts/${showcasePostId}/comments`);
  return response.data;
};

export const createShowcaseComment = async (showcasePostId: string, body: string, imageUrl?: string | null): Promise<string> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return 'mock-showcase-comment-id';
  }

  const response = await apiClient.post<string>(`/showcase/posts/${showcasePostId}/comments`, { body, imageUrl: imageUrl || null });
  return response.data;
};

export const deleteShowcaseComment = async (showcaseCommentId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }

  await apiClient.delete(`/showcase/comments/${showcaseCommentId}`);
};