/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';

export type ImageUploadFolder = 'ArticleCovers' | 'AiToolLogos' | 'Comments';

export const uploadImage = async (file: File, folder: ImageUploadFolder): Promise<string> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    // No real storage in demo mode — just preview the file locally so the
    // UI still feels real. This URL only works in the current browser tab.
    return URL.createObjectURL(file);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  // Override the instance's default 'Content-Type: application/json' —
  // the browser sets the correct multipart boundary itself once this is
  // set to multipart/form-data, regardless of what we put here; it just
  // needs to not be application/json.
  const response = await apiClient.post<{ url: string }>('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.url;
};