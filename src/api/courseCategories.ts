/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { CourseCategory } from '../types/api';

export const getCourseCategories = async (): Promise<CourseCategory[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }

  const response = await apiClient.get<CourseCategory[]>('/course-categories');
  return response.data;
};

export interface CourseCategoryPayload {
  name: string;
  slug: string;
  description?: string | null;
}

export const createCourseCategory = async (payload: CourseCategoryPayload): Promise<string> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return 'mock-course-category-id';
  }

  const response = await apiClient.post<string>('/course-categories', payload);
  return response.data;
};

export const updateCourseCategory = async (courseCategoryId: string, payload: CourseCategoryPayload): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }

  await apiClient.put(`/course-categories/${courseCategoryId}`, payload);
};

export const deleteCourseCategory = async (courseCategoryId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }

  await apiClient.delete(`/course-categories/${courseCategoryId}`);
};