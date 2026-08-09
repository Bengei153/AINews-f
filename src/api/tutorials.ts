/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { Tutorial, TutorialDetail, PaginatedResult, DifficultyLevel } from '../types/api';

export interface GetTutorialsParams {
  toolName?: string;
  difficultyLevel?: DifficultyLevel;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

const EMPTY_PAGE: PaginatedResult<Tutorial> = { items: [], pageNumber: 1, totalPages: 0, totalCount: 0 };

export const getTutorials = async (params: GetTutorialsParams = {}): Promise<PaginatedResult<Tutorial>> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    // No tutorial seed data in the mock database yet — demo mode shows an
    // empty state here rather than fake tutorials.
    return EMPTY_PAGE;
  }

  const response = await apiClient.get<PaginatedResult<Tutorial>>('/tutorials', { params });
  return response.data;
};

export const getTutorialBySlug = async (slug: string): Promise<TutorialDetail> => {
  const response = await apiClient.get<TutorialDetail>(`/tutorials/${slug}`);
  return response.data;
};

export const incrementTutorialView = async (slug: string): Promise<number> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return 0;
  }
  const response = await apiClient.post<number>(`/tutorials/${slug}/view`);
  return response.data;
};

export interface CreateTutorialPayload {
  title: string;
  summary: string;
  body: string;
  toolName: string;
  difficultyLevel: DifficultyLevel;
  coverImageUrl?: string | null;
}

export const createTutorial = async (payload: CreateTutorialPayload): Promise<string> => {
  const response = await apiClient.post<string>('/tutorials', payload);
  return response.data;
};

export const publishTutorial = async (tutorialId: string): Promise<void> => {
  await apiClient.post(`/tutorials/${tutorialId}/publish`);
};

export interface DraftTutorial {
  id: string;
  title: string;
  summary: string;
  toolName: string;
  difficultyLevel: DifficultyLevel;
  status: string;
  created: string;
}

export const getAdminTutorialDrafts = async (): Promise<DraftTutorial[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<DraftTutorial[]>('/tutorials/drafts');
  return response.data;
};