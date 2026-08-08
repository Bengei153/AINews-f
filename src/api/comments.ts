/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { Comment } from '../types/api';

export const getComments = async (articleId: string): Promise<Comment[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }

  const response = await apiClient.get<Comment[]>(`/articles/${articleId}/comments`);
  return response.data;
};

export const createComment = async (articleId: string, body: string, imageUrl?: string | null): Promise<string> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return 'mock-comment-id';
  }

  const response = await apiClient.post<string>(`/articles/${articleId}/comments`, { body, imageUrl: imageUrl || null });
  return response.data;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }

  await apiClient.delete(`/comments/${commentId}`);
};