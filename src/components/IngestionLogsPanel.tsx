/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clipboard, Clock, Info, Loader2, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import { triggerNewsIngestion } from '../api/articles';
import {
  getIngestionRun,
  getIngestionRuns,
  getIngestionStatus,
  IngestionLogEntry,
  IngestionRunStatus,
  IngestionRunSummary,
} from '../api/ingestion';

interface IngestionLogsPanelProps {
  /** A run to open straight away, e.g. the one just queued from "Fetch new articles now". */
  focusRunId?: string | null;
  /** Called once focusRunId has been selected, so the parent can clear it. */
  onFocusHandled?: () => void;
}

type BadgeTone = 'ok' | 'warn' | 'bad' | 'info' | 'muted';

const isInProgress = (run: IngestionRunSummary) =>
  (run.status === 'Queued' || run.status === 'Running') && !run.isStale;

const timeAgo = (iso: string | null | undefined): string => {
  if (!iso) return 'never';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
};

const clock = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const dateTime = (iso: string): string =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const durationOf = (run: IngestionRunSummary): string => {
  if (!run.startedAt) return '—';
  const end = run.finishedAt ? new Date(run.finishedAt).getTime() : Date.now();
  const seconds = Math.max(0, Math.round((end - new Date(run.startedAt).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

const describeStatus = (run: IngestionRunSummary): { label: string; tone: BadgeTone } => {
  if (run.isStale) {
    return run.status === 'Queued'
      ? { label: 'Stuck in queue', tone: 'bad' }
      : { label: 'Stopped responding', tone: 'bad' };
  }
  const map: Record<IngestionRunStatus, { label: string; tone: BadgeTone }> = {
    Queued: { label: 'Queued', tone: 'info' },
    Running: { label: 'Running', tone: 'info' },
    Succeeded: { label: 'Succeeded', tone: 'ok' },
    CompletedWithErrors: { label: 'Finished with errors', tone: 'warn' },
    Failed: { label: 'Failed', tone: 'bad' },
    Abandoned: { label: 'Interrupted', tone: 'bad' },
  };
  return map[run.status];
};

const StatusBadge: React.FC<{ run: IngestionRunSummary }> = ({ run }) => {
  const { label, tone } = describeStatus(run);
  return (
    <span className={`ingestion-badge ingestion-badge--${tone}`}>
      {isInProgress(run) && <Loader2 className="ingestion-badge__spinner" aria-hidden="true" />}
      {label}
    </span>
  );
};

const LevelIcon: React.FC<{ level: IngestionLogEntry['level'] }> = ({ level }) => {
  if (level === 'Error') return <XCircle className="ingestion-log__icon ingestion-log__icon--bad" aria-label="Error" />;
  if (level === 'Warning') return <AlertTriangle className="ingestion-log__icon ingestion-log__icon--warn" aria-label="Warning" />;
  return <Info className="ingestion-log__icon ingestion-log__icon--info" aria-label="Info" />;
};

const isDailyCron = (cron: string | null) => !!cron && /^\S+\s+\S+\s+\*\s+\*\s+\*$/.test(cron.trim());

export const IngestionLogsPanel: React.FC<IngestionLogsPanelProps> = ({ focusRunId, onFocusHandled }) => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [problemsOnly, setProblemsOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  // ---- data -------------------------------------------------------------
  const statusQuery = useQuery({
    queryKey: ['ingestion-status'],
    queryFn: () => getIngestionStatus('NewsIngestion'),
    refetchInterval: 15000,
  });

  const runsQuery = useQuery({
    queryKey: ['ingestion-runs'],
    queryFn: () => getIngestionRuns('NewsIngestion', 25),
    // Poll quickly while something is running, slowly otherwise.
    refetchInterval: (query) => (query.state.data?.some(isInProgress) ? 3000 : 15000),
  });

  const detailQuery = useQuery({
    queryKey: ['ingestion-run', selectedId],
    queryFn: () => getIngestionRun(selectedId as string),
    enabled: !!selectedId,
    refetchInterval: (query) => {
      const run = query.state.data?.run;
      return run && isInProgress(run) ? 2000 : false;
    },
  });

  const runs = runsQuery.data ?? [];

  // Open the run that was just queued from the "Fetch new articles now" button.
  useEffect(() => {
    if (focusRunId) {
      setSelectedId(focusRunId);
      queryClient.invalidateQueries({ queryKey: ['ingestion-runs'] });
      onFocusHandled?.();
    }
  }, [focusRunId, onFocusHandled, queryClient]);

  // Otherwise default to the newest run.
  useEffect(() => {
    if (!selectedId && runs.length > 0) {
      setSelectedId(runs[0].id);
    }
  }, [selectedId, runs]);

  // ---- run now ------------------------------------------------------------
  const runNow = useMutation({
    mutationFn: triggerNewsIngestion,
    onSuccess: (result) => {
      if (result.runId) setSelectedId(result.runId);
      queryClient.invalidateQueries({ queryKey: ['ingestion-runs'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-status'] });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['admin-drafts'] }), 45000);
    },
  });

  // ---- derived -----------------------------------------------------------
  const status = statusQuery.data;
  const warnings = useMemo(() => {
    const list: string[] = [];
    if (!status) return list;

    if (!status.lastRun) {
      list.push('No runs have been recorded yet. If the schedule should already have fired, the server may have been asleep at the scheduled time.');
      return list;
    }

    if (!status.lastScheduledRunAt) {
      list.push('Only manual runs have been recorded so far — the schedule has not fired since this log was added.');
    } else if (isDailyCron(status.cronSchedule)) {
      const hours = (Date.now() - new Date(status.lastScheduledRunAt).getTime()) / 3_600_000;
      if (hours > 26) {
        list.push(
          `The schedule is daily but the last scheduled run was ${timeAgo(status.lastScheduledRunAt)}. ` +
            'If the backend is on Render\'s free plan it goes to sleep after ~15 minutes idle, and a sleeping server cannot run scheduled jobs.',
        );
      }
    }

    if (!status.lastDraftsCreatedAt) {
      list.push('No run has created a draft yet.');
    }
    return list;
  }, [status]);

  const detail = detailQuery.data;
  const entries = useMemo(() => {
    const all = detail?.entries ?? [];
    return problemsOnly ? all.filter((e) => e.level !== 'Info') : all;
  }, [detail, problemsOnly]);

  const copyLog = async () => {
    if (!detail) return;
    const { run } = detail;
    const header = [
      `Run ${run.id} — ${describeStatus(run).label} (${run.trigger})`,
      `Started: ${run.startedAt ?? 'not started'} | Provider: ${run.provider ?? '?'} / ${run.model ?? '?'}`,
      `Fetched ${run.itemsFetched}, created ${run.itemsCreated}, skipped ${run.itemsSkipped}, failed ${run.itemsFailed}`,
      ...(run.summary ? [`Summary: ${run.summary}`] : []),
      '',
    ];
    const body = detail.entries.map((e) => {
      const line = `[${e.timestamp}] ${e.level.toUpperCase()} ${e.stage}: ${e.message}`;
      return e.details ? `${line}\n${e.details.replace(/^/gm, '    ')}` : line;
    });
    try {
      await navigator.clipboard.writeText([...header, ...body].join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — nothing sensible to do */
    }
  };

  // ---- render --------------------------------------------------------------
  return (
    <section className="ingestion" aria-label="Article ingestion logs">
      <header className="ingestion__header">
        <div>
          <h2 className="ingestion__title">Article ingestion logs</h2>
          <p className="ingestion__subtitle">
            Every run of the news collector, with the reason behind each result — including runs that produced no drafts.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary btn-primary--small"
          onClick={() => runNow.mutate()}
          disabled={runNow.isPending}
        >
          {runNow.isPending ? <Loader2 className="ingestion__btn-icon ingestion__btn-icon--spin" /> : <Sparkles className="ingestion__btn-icon" />}
          {runNow.isPending ? 'Queuing…' : 'Fetch new articles now'}
        </button>
      </header>

      {runNow.isError && (
        <div className="ingestion__notice ingestion__notice--bad" role="alert">
          {(runNow.error as any)?.detail || 'Could not start ingestion.'}
        </div>
      )}

      {/* ---- health ---- */}
      <div className="ingestion__health">
        <div className="ingestion__stat">
          <span className="ingestion__stat-label">Last run</span>
          <span className="ingestion__stat-value">{status?.lastRun ? timeAgo(status.lastRun.created) : 'none yet'}</span>
        </div>
        <div className="ingestion__stat">
          <span className="ingestion__stat-label">Last successful run</span>
          <span className="ingestion__stat-value">{timeAgo(status?.lastSuccessAt)}</span>
        </div>
        <div className="ingestion__stat">
          <span className="ingestion__stat-label">Last time drafts were created</span>
          <span className="ingestion__stat-value">{timeAgo(status?.lastDraftsCreatedAt)}</span>
        </div>
        <div className="ingestion__stat">
          <span className="ingestion__stat-label">Schedule</span>
          <span className="ingestion__stat-value">{status?.cronSchedule ? <code>{status.cronSchedule}</code> : '—'} <small>(UTC)</small></span>
        </div>
      </div>

      {warnings.map((w) => (
        <div key={w} className="ingestion__notice ingestion__notice--warn" role="status">
          <AlertTriangle className="ingestion__notice-icon" aria-hidden="true" />
          <span>{w}</span>
        </div>
      ))}

      <div className="ingestion__layout">
        {/* ---- runs list ---- */}
        <aside className="ingestion__runs" aria-label="Recent runs">
          <div className="ingestion__runs-head">
            <span>Recent runs</span>
            <button
              type="button"
              className="ingestion__icon-btn"
              onClick={() => {
                runsQuery.refetch();
                statusQuery.refetch();
                detailQuery.refetch();
              }}
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw className={`ingestion__btn-icon ${runsQuery.isFetching ? 'ingestion__btn-icon--spin' : ''}`} />
            </button>
          </div>

          {runsQuery.isLoading && <p className="ingestion__empty">Loading…</p>}
          {runsQuery.isError && <p className="ingestion__empty ingestion__empty--bad">Could not load runs. Is the ingestion-log migration applied?</p>}
          {!runsQuery.isLoading && !runsQuery.isError && runs.length === 0 && (
            <p className="ingestion__empty">No runs recorded yet. Press “Fetch new articles now” to create one.</p>
          )}

          <ul className="ingestion__run-list">
            {runs.map((run) => (
              <li key={run.id}>
                <button
                  type="button"
                  className={`ingestion__run ${run.id === selectedId ? 'ingestion__run--active' : ''}`}
                  onClick={() => setSelectedId(run.id)}
                >
                  <span className="ingestion__run-top">
                    <span className="ingestion__run-time">{dateTime(run.created)}</span>
                    <StatusBadge run={run} />
                  </span>
                  <span className="ingestion__run-meta">
                    {run.trigger === 'Manual' ? 'Manual' : 'Scheduled'}
                    {' · '}
                    {run.itemsCreated} new · {run.itemsSkipped} skipped · {run.itemsFailed} failed
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* ---- run detail ---- */}
        <div className="ingestion__detail">
          {!selectedId && <p className="ingestion__empty">Select a run to see its log.</p>}
          {selectedId && detailQuery.isLoading && <p className="ingestion__empty">Loading run…</p>}
          {selectedId && detailQuery.isError && (
            <p className="ingestion__empty ingestion__empty--bad">Could not load this run.</p>
          )}

          {detail && (
            <>
              <div className="ingestion__detail-head">
                <div className="ingestion__detail-title">
                  <StatusBadge run={detail.run} />
                  <span>
                    {detail.run.trigger === 'Manual' ? 'Started from the admin panel' : 'Started by the schedule'}
                    {' · '}
                    {dateTime(detail.run.created)}
                    {' · took '}
                    {durationOf(detail.run)}
                  </span>
                </div>
                <button type="button" className="btn-secondary btn-secondary--small" onClick={copyLog}>
                  <Clipboard className="ingestion__btn-icon" />
                  {copied ? 'Copied' : 'Copy log'}
                </button>
              </div>

              <dl className="ingestion__counts">
                <div><dt>Fetched</dt><dd>{detail.run.itemsFetched}</dd></div>
                <div><dt>New drafts</dt><dd>{detail.run.itemsCreated}</dd></div>
                <div><dt>Already ingested</dt><dd>{detail.run.itemsSkipped}</dd></div>
                <div><dt>Failed</dt><dd>{detail.run.itemsFailed}</dd></div>
                <div><dt>AI</dt><dd>{detail.run.provider ? `${detail.run.provider} · ${detail.run.model}` : '—'}</dd></div>
              </dl>

              {detail.run.isStale && detail.run.staleReason && (
                <div className="ingestion__notice ingestion__notice--bad" role="alert">
                  <Clock className="ingestion__notice-icon" aria-hidden="true" />
                  <span>{detail.run.staleReason}</span>
                </div>
              )}

              {detail.run.summary && (
                <div className={`ingestion__notice ingestion__notice--${describeStatus(detail.run).tone}`}>
                  {describeStatus(detail.run).tone === 'ok' ? (
                    <CheckCircle2 className="ingestion__notice-icon" aria-hidden="true" />
                  ) : (
                    <Info className="ingestion__notice-icon" aria-hidden="true" />
                  )}
                  <span>{detail.run.summary}</span>
                </div>
              )}

              <div className="ingestion__log-head">
                <span>Step-by-step log ({detail.entries.length})</span>
                <label className="ingestion__toggle">
                  <input type="checkbox" checked={problemsOnly} onChange={(e) => setProblemsOnly(e.target.checked)} />
                  Warnings and errors only
                </label>
              </div>

              {entries.length === 0 ? (
                <p className="ingestion__empty">{problemsOnly ? 'No warnings or errors in this run.' : 'No log lines yet.'}</p>
              ) : (
                <ol className="ingestion-log">
                  {entries.map((entry) => (
                    <li key={entry.sequence} className={`ingestion-log__row ingestion-log__row--${entry.level.toLowerCase()}`}>
                      <LevelIcon level={entry.level} />
                      <div className="ingestion-log__body">
                        <div className="ingestion-log__line">
                          <span className="ingestion-log__time">{clock(entry.timestamp)}</span>
                          <span className="ingestion-log__stage">{entry.stage}</span>
                          <span className="ingestion-log__message">{entry.message}</span>
                        </div>
                        {entry.details && (
                          <details className="ingestion-log__details">
                            <summary>Details</summary>
                            <pre>{entry.details}</pre>
                          </details>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
