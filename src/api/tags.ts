/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { Tag } from '../types/api';
import { MockDatabase } from './mockDb';

export const getTags = async (): Promise<Tag[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return MockDatabase.getTags();
  }

  const response = await apiClient.get<Tag[]>('/tags');
  return response.data;
};

export interface CreateTagPayload {
  name: string;
  slug: string;
}

export const createTag = async (payload: CreateTagPayload): Promise<string> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const tags = MockDatabase.getTags();

    if (tags.some((t) => t.slug === payload.slug)) {
      throw {
        status: 400,
        title: 'Validation Failed',
        detail: 'Tag slug already exists.',
      };
    }

    const newId = `tag-${tags.length + 1}`;
    const newTag: Tag = {
      id: newId,
      ...payload,
    };

    tags.push(newTag);
    MockDatabase.saveTags(tags);
    return newId;
  }

  const response = await apiClient.post<string>('/tags', payload);
  return response.data;
};
