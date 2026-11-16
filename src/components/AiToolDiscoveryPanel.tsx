/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminToolDrafts,
  getAiToolCategories,
  addMoreAiTools,
  updateAiTool,
  publishAiTool,
  deleteAiTool,
  DraftAiTool,
  UpdateAiToolPayload,
} from '../api/aiTools';
import { getIngestionRun, getIngestionRuns, IngestionRunStatus } from '../api/ingestion';
import { ImageUploadWidget } from './ImageUploadWidget';
import { Sparkles, Loader2, CheckSquare, Trash2, Pencil, ExternalLink, Star, Plus } from 'lucide-react';
import '../styles/mark-promos.css';

const fieldClass =
  'w-full text-sm px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/50';

const primaryButtonClass =
  'bg-stone-900 hover:bg-stone-800 disabled:opacity-75 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-md transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer';

interface AiToolDiscoveryPanelProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

const isActive = (status: IngestionRunStatus | undefined) => status === 'Queued' || status === 'Running';

// The whole "grow the directory" workflow is one button. Everything else (finding tools, sorting them
// into fields, dropping duplicates, checking links, publishing) happens on the server, and this panel
// just follows the run live. It is self-contained (own queries, mutations and state) so it drops into
// the admin Tools tab without threading state through AdminPage.
export const AiToolDiscoveryPanel: React.FC<AiToolDiscoveryPanelProps> = ({ onNotify }) => {
  const queryClient = useQueryClient();
  const [runId, setRunId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const announcedRunRef = useRef<string | null>(null);

  const { data: drafts, isLoading } = useQuery({
    queryKey: ['admin-tool-drafts'],
    queryFn: getAdminToolDrafts,
  });

  const { data: categories } = useQuery({
    queryKey: ['ai-tool-categories'],
    queryFn: getAiToolCategories,
  });

  // If a run is already going (page reloaded, or the weekly job is running), pick it up.
  const { data: latestRuns } = useQuery({
    queryKey: ['ai-tool-latest-run'],
    queryFn: () => getIngestionRuns('AIToolDiscovery', 1),
  });

  useEffect(() => {
    const latest = latestRuns?.[0];
    if (!runId && latest && isActive(latest.status) && !latest.isStale) {
      announcedRunRef.current = null;
      setRunId(latest.id);
    }
  }, [latestRuns, runId]);

  const { data: runDetail } = useQuery({
    queryKey: ['ai-tool-run', runId],
    queryFn: () => getIngestionRun(runId as string),
    enabled: !!runId,
    refetchInterval: (query) => (isActive(query.state.data?.run.status) ? 2500 : false),
  });

  const run = runDetail?.run;
  const running = !!runId && (!run || isActive(run.status));

  // When a run we were watching finishes, refresh what it changed and say how it went — once.
  useEffect(() => {
    if (!run || isActive(run.status) || announcedRunRef.current === run.id) return;
    announcedRunRef.current = run.id;
    queryClient.invalidateQueries({ queryKey: ['ai-tools'] });
    queryClient.invalidateQueries({ queryKey: ['ai-tool-categories'] });
    queryClient.invalidateQueries({ queryKey: ['admin-tool-drafts'] });
    queryClient.invalidateQueries({ queryKey: ['ai-tool-latest-run'] });
    onNotify(run.status === 'Failed' || run.status === 'Abandoned' ? 'error' : 'success', run.summary || 'Finished.');
  }, [run, queryClient, onNotify]);

  const addMoreMutation = useMutation({
    mutationFn: addMoreAiTools,
    onSuccess: (id) => {
      announcedRunRef.current = null;
      setRunId(id);
      queryClient.removeQueries({ queryKey: ['ai-tool-run', id] });
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not start. Try again in a moment.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAiToolPayload }) => updateAiTool(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tool-drafts'] });
      setEditingId(null);
      onNotify('success', 'Changes saved.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not save changes.'),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishAiTool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tool-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['ai-tools'] });
      queryClient.invalidateQueries({ queryKey: ['ai-tool-categories'] });
      onNotify('success', 'Tool published to the directory.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not publish this tool.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAiTool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tool-drafts'] });
      onNotify('success', 'Draft removed.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not remove this draft.'),
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Discard the draft for "${name}"? This can't be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const recentEntries = (runDetail?.entries ?? []).slice(-8);
  const totalTools = (categories ?? []).reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="font-serif text-xl font-bold text-stone-800 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-emerald-800" />
            Grow the Tools Directory
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            One button. The site finds new tools on its own, sorts them into their fields, skips anything already
            listed, checks every link and publishes the rest. It also runs by itself on a schedule.
          </p>
        </div>

        <div className="tools-admin__run">
          <button
            type="button"
            onClick={() => addMoreMutation.mutate()}
            disabled={running || addMoreMutation.isPending}
            className={`${primaryButtonClass} whitespace-nowrap`}
          >
            {running || addMoreMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Adding tools...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add more tools</span>
              </>
            )}
          </button>
          <p className="tools-admin__run-note">
            {running
              ? 'Working in the background. You can leave this page, and it keeps going.'
              : run
                ? run.summary || 'Finished.'
                : totalTools > 0
                  ? `${totalTools} tools published so far.`
                  : 'Press to add the first batch.'}
          </p>
        </div>

        {runId && recentEntries.length > 0 && (
          <ul className="tools-admin__log" aria-live="polite">
            {recentEntries.map((entry) => (
              <li key={entry.sequence} className={`tools-admin__log-line tools-admin__log-line--${entry.level.toLowerCase()}`}>
                {entry.message}
              </li>
            ))}
          </ul>
        )}

        {categories && categories.length > 0 && (
          <div className="tools-admin__fields">
            <p className="tools-admin__fields-title">Tools per field (emptiest fields are filled first)</p>
            <ul className="tools-admin__field-list">
              {categories.map((c) => (
                <li key={c.slug} className={`tools-admin__field${c.count === 0 ? ' tools-admin__field--empty' : ''}`}>
                  <span>{c.label}</span>
                  <strong>{c.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(isLoading || (drafts && drafts.length > 0)) && (
        <div className="space-y-4">
          <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-400">
            <CheckSquare className="w-4 h-4" />
            Tools waiting for review
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center py-12 gap-3 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs">Loading queue items...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {(drafts ?? []).map((draft) =>
              editingId === draft.id ? (
                <DraftEditForm
                  key={draft.id}
                  draft={draft}
                  isSaving={updateMutation.isPending}
                  onCancel={() => setEditingId(null)}
                  onSave={(payload) => updateMutation.mutate({ id: draft.id, payload })}
                />
              ) : (
                <div
                  key={draft.id}
                  className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-stone-300 transition-colors"
                >
                  <div className="flex items-start gap-4 max-w-2xl">
                    {draft.logoUrl ? (
                      <img
                        src={draft.logoUrl}
                        alt={draft.name}
                        className="w-16 h-16 object-cover rounded-lg border border-stone-200 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed border-stone-300 bg-stone-50 shrink-0 flex items-center justify-center text-stone-300">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          {draft.pricing || 'Pricing unknown'}
                        </span>
                        {!draft.logoUrl && (
                          <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                            No logo yet
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">{draft.name}</h3>
                      <p className="text-xs text-stone-600 line-clamp-2">{draft.description}</p>
                      <a
                        href={draft.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-700 underline break-all inline-flex items-center gap-1"
                      >
                        {draft.websiteUrl}
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => setEditingId(draft.id)}
                      className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 p-2.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                      title="Edit before publishing"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => publishMutation.mutate(draft.id)}
                      disabled={publishMutation.isPending}
                      className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm cursor-pointer transition-colors whitespace-nowrap"
                    >
                      Approve &amp; Publish
                    </button>
                    <button
                      onClick={() => handleDelete(draft.id, draft.name)}
                      disabled={deleteMutation.isPending}
                      className="bg-white hover:bg-red-50 disabled:opacity-60 text-red-600 border border-red-200 p-2.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                      title="Discard draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface DraftEditFormProps {
  draft: DraftAiTool;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (payload: UpdateAiToolPayload) => void;
}

// Inline edit form for one draft — this is the "add the image myself" step:
// everything else came from the search, the logo (and any correction) is added here.
const DraftEditForm: React.FC<DraftEditFormProps> = ({ draft, isSaving, onCancel, onSave }) => {
  const [name, setName] = useState(draft.name);
  const [description, setDescription] = useState(draft.description);
  const [websiteUrl, setWebsiteUrl] = useState(draft.websiteUrl);
  const [pricing, setPricing] = useState(draft.pricing);
  const [tags, setTags] = useState(draft.tags);
  const [rating, setRating] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string | null>(draft.logoUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, websiteUrl, pricing, tags, rating, logoUrl });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block">Tool Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} required />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block">Pricing *</label>
          <input type="text" value={pricing} onChange={(e) => setPricing(e.target.value)} className={fieldClass} required />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${fieldClass} h-24`}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">Website URL *</label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className={fieldClass}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block">Comma separated tags</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className={fieldClass} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block flex items-center gap-1">
            <Star className="w-3 h-3" /> Rating (optional, 0-5)
          </label>
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">Logo</label>
        <ImageUploadWidget folder="AiToolLogos" currentUrl={logoUrl} onUploaded={(url) => setLogoUrl(url || null)} />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-bold py-2.5 px-5 rounded-lg text-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button type="submit" disabled={isSaving} className={primaryButtonClass}>
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </form>
  );
};
