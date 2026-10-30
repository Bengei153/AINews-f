/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, getApiRootUrl, isDemoMode, simulateNetworkDelay } from './client';

// --- Types -----------------------------------------------------------------

export interface BenchmarkCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  weight: number;
  sortOrder: number;
}

export interface BenchmarkModel {
  id: string;
  name: string;
  slug: string;
  creator: string;
  notes: string;
  isOpenWeights: boolean;
  isPublished: boolean;
  /** Weighted average of the model's scores; null only if it has none yet. */
  overall: number | null;
  /** Score (0–100) per category, keyed by category slug. A missing key means "not tested". */
  scores: Record<string, number>;
  lastModified: string;
}

export interface BenchmarkBoard {
  categories: BenchmarkCategory[];
  models: BenchmarkModel[];
}

// --- Public ----------------------------------------------------------------

const EMPTY_BOARD: BenchmarkBoard = { categories: [], models: [] };

export const getBenchmarkBoard = async (): Promise<BenchmarkBoard> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return EMPTY_BOARD;
  }
  const response = await apiClient.get<BenchmarkBoard>('/benchmarks');
  return response.data;
};

// --- Sharing ---------------------------------------------------------------

export interface BenchmarkShareParams {
  a?: string | null;
  b?: string | null;
  /** Category slug; omit for the overall ranking. */
  category?: string | null;
}

const toQuery = (pairs: Record<string, string | null | undefined>): string => {
  const query = Object.entries(pairs)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join('&');
  return query ? `?${query}` : '';
};

/**
 * The link to hand out. It points at the backend's /share/benchmarks route (not at this app),
 * because link-preview crawlers (WhatsApp, X, Slack, LinkedIn, ...) read <meta> tags from the raw
 * HTML and never run JavaScript — this SPA can't serve those tags itself. People who click it are
 * redirected on to /benchmarks with the same comparison selected.
 */
export const buildBenchmarkShareUrl = ({ a, b, category }: BenchmarkShareParams): string =>
  `${getApiRootUrl()}/share/benchmarks${toQuery({ a, b, category })}`;

/** The preview image itself — what the shared link looks like in a chat or feed. */
export const buildBenchmarkImageUrl = ({ a, b, category }: BenchmarkShareParams, version?: string): string =>
  `${getApiRootUrl()}/share/benchmarks/image.png${toQuery({ a, b, category, v: version })}`;

// --- Admin -----------------------------------------------------------------

export interface SaveBenchmarkCategoryPayload {
  name: string;
  description: string;
  weight: number;
  sortOrder: number;
}

export interface SaveBenchmarkModelPayload {
  name: string;
  creator: string;
  notes: string;
  isOpenWeights: boolean;
  isPublished: boolean;
  /** Keyed by category slug. A category left out means "not tested". */
  scores: Record<string, number>;
}

export interface ImportBenchmarkPayload {
  categories?: { name: string; description?: string; weight?: number; sortOrder?: number }[];
  models?: {
    name: string;
    creator?: string;
    notes?: string;
    isOpenWeights?: boolean;
    isPublished?: boolean;
    scores?: Record<string, number>;
  }[];
}

export interface ImportBenchmarkResult {
  categoriesCreated: number;
  categoriesUpdated: number;
  modelsCreated: number;
  modelsUpdated: number;
  errors: string[];
}

export const getAdminBenchmarkBoard = async (): Promise<BenchmarkBoard> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return EMPTY_BOARD;
  }
  const response = await apiClient.get<BenchmarkBoard>('/benchmarks/admin');
  return response.data;
};

export const saveBenchmarkCategory = async (id: string | null, payload: SaveBenchmarkCategoryPayload): Promise<void> => {
  if (id) await apiClient.put(`/benchmarks/categories/${id}`, payload);
  else await apiClient.post('/benchmarks/categories', payload);
};

export const deleteBenchmarkCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/benchmarks/categories/${id}`);
};

export const saveBenchmarkModel = async (id: string | null, payload: SaveBenchmarkModelPayload): Promise<void> => {
  if (id) await apiClient.put(`/benchmarks/models/${id}`, payload);
  else await apiClient.post('/benchmarks/models', payload);
};

export const deleteBenchmarkModel = async (id: string): Promise<void> => {
  await apiClient.delete(`/benchmarks/models/${id}`);
};

export const importBenchmarkData = async (payload: ImportBenchmarkPayload): Promise<ImportBenchmarkResult> => {
  const response = await apiClient.post<ImportBenchmarkResult>('/benchmarks/import', payload);
  return response.data;
};

/** Turns the server's error shape into one readable sentence (validation errors list their fields). */
export const describeApiError = (err: any, fallback = 'Something went wrong — please try again.'): string => {
  const fieldErrors: Record<string, string[]> | undefined = err?.errors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const messages = Object.values(fieldErrors).flat();
    if (messages.length > 0) return messages.join(' ');
  }
  return err?.detail || fallback;
};
