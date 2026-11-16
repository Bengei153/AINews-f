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

// --- Admin: "Add more tools" + review of any drafts ------------------------

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

// One field tools are sorted into, with how many published tools it holds.
// Empty fields are included: they are what "Add more tools" fills next.
export interface AiToolCategory {
  slug: string;
  label: string;
  count: number;
}

export const getAdminToolDrafts = async (): Promise<DraftAiTool[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<DraftAiTool[]>('/ai-tools/drafts');
  return response.data;
};

export const getAiToolCategories = async (): Promise<AiToolCategory[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<AiToolCategory[]>('/ai-tools/categories');
  return response.data;
};

// "Add more tools" - the one button. The server removes duplicates, sorts uncategorized tools into
// fields, searches the emptiest fields for new tools and adds them, all in the background. Resolves
// with the run id straight away; follow it with getIngestionRun(runId). 400 while a run is in progress.
export const addMoreAiTools = async (): Promise<string> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    throw { status: 400, title: 'Demo mode', detail: 'Adding tools needs the real backend.' };
  }
  const response = await apiClient.post<{ runId: string }>('/ai-tools/add-more');
  return response.data.runId;
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
