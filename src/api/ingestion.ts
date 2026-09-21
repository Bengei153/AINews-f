/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';

// The backend serialises enums as their names (JsonStringEnumConverter).
export type IngestionRunKind = 'NewsIngestion' | 'VideoIngestion' | 'CourseDiscovery';
export type IngestionTrigger = 'Scheduled' | 'Manual';
export type IngestionRunStatus = 'Queued' | 'Running' | 'Succeeded' | 'CompletedWithErrors' | 'Failed' | 'Abandoned';
export type IngestionStage = 'Setup' | 'Fetch' | 'Dedupe' | 'Generate' | 'Save' | 'Finish';
export type IngestionLogLevel = 'Info' | 'Warning' | 'Error';

export interface IngestionRunSummary {
  id: string;
  kind: IngestionRunKind;
  trigger: IngestionTrigger;
  status: IngestionRunStatus;
  /** True when a Queued/Running run has gone quiet (worker asleep, restart mid-run). */
  isStale: boolean;
  staleReason: string | null;
  created: string;
  startedAt: string | null;
  finishedAt: string | null;
  lastActivityAt: string;
  provider: string | null;
  model: string | null;
  itemsFetched: number;
  itemsCreated: number;
  itemsSkipped: number;
  itemsFailed: number;
  summary: string | null;
  errorMessage: string | null;
}

export interface IngestionLogEntry {
  sequence: number;
  timestamp: string;
  stage: IngestionStage;
  level: IngestionLogLevel;
  message: string;
  details: string | null;
}

export interface IngestionRunDetail {
  run: IngestionRunSummary;
  entries: IngestionLogEntry[];
}

export interface IngestionStatus {
  lastRun: IngestionRunSummary | null;
  lastSuccessAt: string | null;
  lastScheduledRunAt: string | null;
  lastDraftsCreatedAt: string | null;
  cronSchedule: string | null;
}

export const getIngestionStatus = async (kind: IngestionRunKind = 'NewsIngestion'): Promise<IngestionStatus> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { lastRun: null, lastSuccessAt: null, lastScheduledRunAt: null, lastDraftsCreatedAt: null, cronSchedule: null };
  }
  const response = await apiClient.get<IngestionStatus>('/admin/ingestion/status', { params: { kind } });
  return response.data;
};

export const getIngestionRuns = async (kind: IngestionRunKind = 'NewsIngestion', take = 25): Promise<IngestionRunSummary[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return [];
  }
  const response = await apiClient.get<IngestionRunSummary[]>('/admin/ingestion/runs', { params: { kind, take } });
  return response.data;
};

export const getIngestionRun = async (runId: string): Promise<IngestionRunDetail> => {
  const response = await apiClient.get<IngestionRunDetail>(`/admin/ingestion/runs/${runId}`);
  return response.data;
};
