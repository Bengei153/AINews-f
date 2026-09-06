/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { Course, CoursePricingType, PaginatedResult } from '../types/api';

export interface GetCoursesParams {
  courseCategoryId?: string;
  pricingType?: CoursePricingType;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

const EMPTY_PAGE: PaginatedResult<Course> = { items: [], pageNumber: 1, totalPages: 0, totalCount: 0 };

export const getCourses = async (params: GetCoursesParams = {}): Promise<PaginatedResult<Course>> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return EMPTY_PAGE;
  }

  const response = await apiClient.get<PaginatedResult<Course>>('/courses', { params });
  return response.data;
};

export const getCourseBySlug = async (slug: string): Promise<Course> => {
  const response = await apiClient.get<Course>(`/courses/${slug}`);
  return response.data;
};

export const publishCourse = async (courseId: string): Promise<void> => {
  await apiClient.post(`/courses/${courseId}/publish`);
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }
  await apiClient.delete(`/courses/${courseId}`);
};

export interface DraftCourse {
  id: string;
  title: string;
  provider: string;
  courseCategoryId: string;
  courseCategoryName: string;
  topic: string;
  description: string;
  thumbnailUrl: string | null;
  externalUrl: string;
  pricingType: CoursePricingType;
  price: string | null;
  status: string;
  created: string;
}

export const getAdminCourseDrafts = async (): Promise<DraftCourse[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<DraftCourse[]>('/courses/drafts');
  return response.data;
};

export interface CourseDiscoveryResult {
  candidatesFound: number;
  draftsCreated: number;
  skipped: number;
  errors: string[];
}

// Unlike video ingestion (fetches from configured channels), course
// discovery is topic-driven — the admin types what to search for, picks
// which category to file results under, and Claude (with the web_search
// tool, server-side) finds real courses on it.
export const discoverCourses = async (topic: string, courseCategoryId: string): Promise<CourseDiscoveryResult> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { candidatesFound: 0, draftsCreated: 0, skipped: 0, errors: ['Course discovery is not simulated in demo mode.'] };
  }
  const response = await apiClient.post<CourseDiscoveryResult>('/courses/discover', { topic, courseCategoryId });
  return response.data;
};