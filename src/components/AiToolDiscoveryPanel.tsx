/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminToolDrafts,
  discoverAiTools,
  updateAiTool,
  publishAiTool,
  deleteAiTool,
  DraftAiTool,
  UpdateAiToolPayload,
} from '../api/aiTools';
import { ImageUploadWidget } from './ImageUploadWidget';
import { Search, Sparkles, Loader2, CheckSquare, Trash2, Pencil, ExternalLink, Star } from 'lucide-react';

const fieldClass =
  'w-full text-sm px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/50';

const primaryButtonClass =
  'bg-stone-900 hover:bg-stone-800 disabled:opacity-75 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-md transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer';

interface AiToolDiscoveryPanelProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

// Self-contained (own queries, mutations, local edit state) so it drops into
// the admin Tools tab without threading its state through AdminPage, the
// same way IngestionLogsPanel is used elsewhere in this file.
export const AiToolDiscoveryPanel: React.FC<AiToolDiscoveryPanelProps> = ({ onNotify }) => {
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState('');
  const [lastRunErrors, setLastRunErrors] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: drafts, isLoading } = useQuery({
    queryKey: ['admin-tool-drafts'],
    queryFn: getAdminToolDrafts,
  });

  const discoverMutation = useMutation({
    mutationFn: () => discoverAiTools(topic.trim()),
    onSuccess: (result) => {
      setLastRunErrors(result.errors);
      queryClient.invalidateQueries({ queryKey: ['admin-tool-drafts'] });
      if (result.draftsCreated > 0) {
        onNotify('success', `Found ${result.draftsCreated} new tool${result.draftsCreated === 1 ? '' : 's'} — review them below.`);
        setTopic('');
      } else if (result.errors.length === 0) {
        onNotify('error', 'No new tools found for that topic — everything found was already listed.');
      } else {
        onNotify('error', 'The search finished but found nothing usable. See details below.');
      }
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Tool search failed — try again.'),
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

  const handleDiscover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLastRunErrors([]);
    discoverMutation.mutate();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Discard the draft for "${name}"? This can't be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="font-serif text-xl font-bold text-stone-800 flex items-center gap-1.5">
            <Search className="w-5 h-5 text-emerald-800" />
            Find AI Tools
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Type a topic — Claude searches the web for real, currently available tools on it. New ones land below as
            drafts; nothing goes live until you review and publish it.
          </p>
        </div>

        <form onSubmit={handleDiscover} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="e.g. AI tools for video editing"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={fieldClass}
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>
          <button
            type="submit"
            disabled={discoverMutation.isPending || !topic.trim()}
            className={`${primaryButtonClass} whitespace-nowrap`}
          >
            {discoverMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Find tools</span>
              </>
            )}
          </button>
        </form>

        {lastRunErrors.length > 0 && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-1">
            {lastRunErrors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-400">
          <CheckSquare className="w-4 h-4" />
          Tool Review Queue
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center py-12 gap-3 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs">Loading queue items...</p>
          </div>
        ) : !drafts || drafts.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
            <CheckSquare className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-stone-800">No tool drafts waiting</h3>
            <p className="text-sm text-stone-500">Search for a topic above to find some.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {drafts.map((draft) =>
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
