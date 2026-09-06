/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';
import { AiProvider, AiTask, AiTaskModelConfig, ArticleWritingTemplate } from '../types/api';

export const getAiTaskConfigs = async (): Promise<AiTaskModelConfig[]> => {
  const response = await apiClient.get<AiTaskModelConfig[]>('/admin/ai-settings/tasks');
  return response.data;
};

export const setAiTaskConfig = async (task: AiTask, provider: AiProvider, model: string): Promise<void> => {
  await apiClient.put(`/admin/ai-settings/tasks/${task}`, { provider, model });
};

export const getArticleWritingTemplate = async (): Promise<ArticleWritingTemplate> => {
  const response = await apiClient.get<ArticleWritingTemplate>('/admin/ai-settings/article-template');
  return response.data;
};

export const updateArticleWritingTemplate = async (promptTemplate: string): Promise<void> => {
  await apiClient.put('/admin/ai-settings/article-template', { promptTemplate });
};