/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { Video, VideoDetail, PaginatedResult } from '../types/api';

export interface GetVideosParams {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

const EMPTY_PAGE: PaginatedResult<Video> = { items: [], pageNumber: 1, totalPages: 0, totalCount: 0 };

export const getVideos = async (params: GetVideosParams = {}): Promise<PaginatedResult<Video>> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return EMPTY_PAGE;
  }

  const response = await apiClient.get<PaginatedResult<Video>>('/videos', { params });
  return response.data;
};

export const getVideoBySlug = async (slug: string): Promise<VideoDetail> => {
  const response = await apiClient.get<VideoDetail>(`/videos/${slug}`);
  return response.data;
};

export const incrementVideoView = async (slug: string): Promise<number> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return 0;
  }
  const response = await apiClient.post<number>(`/videos/${slug}/view`);
  return response.data;
};

export const publishVideo = async (videoId: string): Promise<void> => {
  await apiClient.post(`/videos/${videoId}/publish`);
};

export const deleteVideo = async (videoId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }
  await apiClient.delete(`/videos/${videoId}`);
};

export interface DraftVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  aiReview: string;
  status: string;
  created: string;
}

export const getAdminVideoDrafts = async (): Promise<DraftVideo[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<DraftVideo[]>('/videos/drafts');
  return response.data;
};

export interface VideoIngestionResult {
  videosFetched: number;
  draftsCreated: number;
  skipped: number;
  errors: string[];
}

export const triggerVideoIngestion = async (): Promise<VideoIngestionResult> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { videosFetched: 0, draftsCreated: 0, skipped: 0, errors: ['Video ingestion is not simulated in demo mode.'] };
  }
  const response = await apiClient.post<VideoIngestionResult>('/videos/ingest');
  return response.data;
};