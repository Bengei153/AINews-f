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

// Make one published tool the "Featured Tool of the Day" (admin). Clears the previous one.
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

  await apiClient.post(`/ai-tools/${toolId}/feature`);
};

// --- Admin: automated discovery + review ------------------------------------

export interface DraftAiTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  pricing: string;
  tags: string;
  logoUrl: string | null;
  created: string;
}

export interface UpdateAiToolPayload {
  name: string;
  description: string;
  websiteUrl: string;
  pricing: string;
  tags: string; // comma-separated
  rating: number; // 0-5; 0 hides the rating on the card
  logoUrl: string | null; // null removes the image
}

export interface AiToolDiscoveryResult {
  candidatesFound: number;
  draftsCreated: number;
  duplicates: number;
  unreachable: number;
  errors: string[];
}

export const getAdminToolDrafts = async (): Promise<DraftAiTool[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<DraftAiTool[]>('/ai-tools/drafts');
  return response.data;
};

// Topic-driven, like course discovery: the admin types what to look for and
// Claude (web search, server-side) finds real tools and saves them as drafts.
// Can take a minute or more, so the caller must show progress.
export const discoverAiTools = async (topic: string): Promise<AiToolDiscoveryResult> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return {
      candidatesFound: 0,
      draftsCreated: 0,
      duplicates: 0,
      unreachable: 0,
      errors: ['Tool discovery is not simulated in demo mode.'],
    };
  }
  const response = await apiClient.post<AiToolDiscoveryResult>('/ai-tools/discover', { topic });
  return response.data;
};

export const updateAiTool = async (toolId: string, payload: UpdateAiToolPayload): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const tools = MockDatabase.getAiTools();
    const tool = tools.find((t) => t.id === toolId);
    if (tool) {
      tool.name = payload.name;
      tool.description = payload.description;
      tool.websiteUrl = payload.websiteUrl;
      tool.pricing = payload.pricing;
      tool.tags = payload.tags;
      tool.rating = payload.rating;
      tool.logoUrl = payload.logoUrl;
      MockDatabase.saveAiTools(tools);
    }
    return;
  }
  await apiClient.put(`/ai-tools/${toolId}`, payload);
};

export const publishAiTool = async (toolId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return;
  }
  await apiClient.post(`/ai-tools/${toolId}/publish`);
};

export const deleteAiTool = async (toolId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    MockDatabase.saveAiTools(MockDatabase.getAiTools().filter((t) => t.id !== toolId));
    return;
  }
  await apiClient.delete(`/ai-tools/${toolId}`);
};
