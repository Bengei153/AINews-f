/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { AITool } from '../types/api';
import { MockDatabase } from './mockDb';

export const getAiTools = async (featuredOnly: boolean = false): Promise<AITool[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const tools = MockDatabase.getAiTools();
    if (featuredOnly) {
      return tools.filter((t) => t.isFeaturedToday);
    }
    return tools;
  }

  const response = await apiClient.get<AITool[]>('/ai-tools', {
    params: { featuredOnly },
  });
  return response.data;
};

export interface CreateAiToolPayload {
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  pricing: string;
  tags: string; // comma-separated
  logoUrl?: string | null;
}

export const createAiTool = async (payload: CreateAiToolPayload): Promise<string> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const tools = MockDatabase.getAiTools();

    if (tools.some((t) => t.slug === payload.slug)) {
      throw {
        status: 400,
        title: 'Validation Failed',
        detail: 'Tool slug already exists.',
      };
    }

    const newId = `tool-${tools.length + 1}`;
    
    // If setting this one to featured (or simple auto-rotate), let's keep things straightforward
    const newTool: AITool = {
      id: newId,
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      websiteUrl: payload.websiteUrl,
      pricing: payload.pricing,
      rating: 4.5, // Default rating for curated items
      tags: payload.tags,
      isFeaturedToday: false, // Start as unfeatured
      logoUrl: payload.logoUrl || null,
    };

    tools.push(newTool);
    MockDatabase.saveAiTools(tools);
    return newId;
  }

  const response = await apiClient.post<string>('/ai-tools', payload);
  return response.data;
};

// Toggle a tool as the featured spotlight tool of the day (mock helper)
export const setFeaturedTool = async (toolId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const tools = MockDatabase.getAiTools();
    tools.forEach((t) => {
      t.isFeaturedToday = t.id === toolId;
    });
    MockDatabase.saveAiTools(tools);
    return;
  }
};
