/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { Category, ArticlePillar } from '../types/api';
import { MockDatabase } from './mockDb';

export const getCategories = async (): Promise<Category[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return MockDatabase.getCategories();
  }

  const response = await apiClient.get<Category[]>('/categories');
  return response.data;
};

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  pillar: ArticlePillar;
  description: string;
}

export const createCategory = async (payload: CreateCategoryPayload): Promise<string> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const categories = MockDatabase.getCategories();
    
    // Check uniqueness
    if (categories.some((c) => c.slug === payload.slug)) {
      throw {
        status: 400,
        title: 'Validation Failed',
        detail: 'Category slug already exists.',
      };
    }

    const newId = `cat-${categories.length + 1}`;
    const newCat: Category = {
      id: newId,
      ...payload,
    };

    categories.push(newCat);
    MockDatabase.saveCategories(categories);
    return newId;
  }

  const response = await apiClient.post<string>('/categories', payload);
  return response.data;
};
