/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminEarnStoryDrafts,
  discoverEarnStories,
  generateEarnStorySummary,
  generateAllPendingEarnStorySummaries,
  updateEarnStory,
  publishEarnStory,
  deleteEarnStory,
  DraftEarnStory,
  UpdateEarnStoryPayload,
} from '../api/earnStories';
import { ImageUploadWidget } from './ImageUploadWidget';
import { Search, Sparkles, Loader2, CheckSquare, Trash2, Pencil, ExternalLink, Wand2, PlayCircle } from 'lucide-react';

const fieldClass =
  'w-full text-sm px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/50';

const primaryButtonClass =
  'bg-stone-900 hover:bg-stone-800 disabled:opacity-75 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-md transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer';

interface EarnStoryDiscoveryPanelProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

// Self-contained (own queries, mutations, local edit state), same shape as
// AiToolDiscoveryPanel — drops into the admin Earn Stories tab without
// threading its state through AdminPage.
export const EarnStoryDiscoveryPanel: React.FC<EarnStoryDiscoveryPanelProps> = ({ onNotify }) => {
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState('');
  const [lastRunErrors, setLastRunErrors] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const { data: drafts, isLoading } = useQuery({
    queryKey: ['admin-earn-story-drafts'],
    queryFn: getAdminEarnStoryDrafts,
  });

  const pendingCount = drafts?.filter((d) => !d.hasSummary).length ?? 0;

  const discoverMutation = useMutation({
    mutationFn: () => discoverEarnStories(topic.trim()),
    onSuccess: (result) => {
      setLastRunErrors(result.errors);
      queryClient.invalidateQueries({ queryKey: ['admin-earn-story-drafts'] });
      if (result.draftsCreated > 0) {
        onNotify('success', `Found ${result.draftsCreated} new video${result.draftsCreated === 1 ? '' : 's'} — review them below.`);
        setTopic('');
      } else if (result.errors.length === 0) {
        onNotify('error', 'No new videos found for that topic — everything found was already listed.');
      } else {
        onNotify('error', 'The search finished but found nothing usable. See details below.');
      }
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Video search failed — try again.'),
  });

  // Tracked with local generatingId (not mutation.isPending alone) so the
  // spinner shows on the ONE card being generated, not every card at once —
  // several of these could be in flight if a bulk generation is running too.
  const generateSummaryMutation = useMutation({
    mutationFn: (storyId: string) => generateEarnStorySummary(storyId),
    onSuccess: (result, storyId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-earn-story-drafts'] });
      setGeneratingId(null);
      if (result.success) {
        onNotify('success', 'Summary generated — review it below before publishing.');
      } else {
        onNotify('error', result.failureReason || 'Could not generate a summary for this video.');
      }
    },
    onError: (err: any) => {
      setGeneratingId(null);
      onNotify('error', err?.detail || 'Could not generate a summary for this video.');
    },
  });

  const generateAllPendingMutation = useMutation({
    mutationFn: generateAllPendingEarnStorySummaries,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-earn-story-drafts'] });
      if (result.attempted === 0) {
        onNotify('success', 'Nothing pending — every draft already has a summary.');
      } else {
        onNotify('success', `Generated ${result.succeeded} of ${result.attempted} pending summaries.`);
      }
      setLastRunErrors(result.errors);
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Bulk generation failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEarnStoryPayload }) => updateEarnStory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-earn-story-drafts'] });
      setEditingId(null);
      onNotify('success', 'Changes saved.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not save changes.'),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishEarnStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-earn-story-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['earn-stories'] });
      onNotify('success', 'Story published.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not publish this story — does it have a generated summary yet?'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEarnStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-earn-story-drafts'] });
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

  const handleGenerate = (storyId: string) => {
    setGeneratingId(storyId);
    generateSummaryMutation.mutate(storyId);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Discard the draft for "${title}"? This can't be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="font-serif text-xl font-bold text-stone-800 flex items-center gap-1.5">
            <Search className="w-5 h-5 text-emerald-800" />
            Find Videos
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Type a topic — Claude searches the web for real public YouTube videos about it. New ones land below as
            bare drafts; nothing gets a written summary (or goes live) until you generate and review it.
          </p>
        </div>

        <form onSubmit={handleDiscover} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="e.g. how I made money with AI freelancing"
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
                <span>Find videos</span>
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-400">
            <CheckSquare className="w-4 h-4" />
            Story Review Queue
          </div>
          {pendingCount > 0 && (
            <button
              onClick={() => generateAllPendingMutation.mutate()}
              disabled={generateAllPendingMutation.isPending}
              className="bg-white hover:bg-stone-50 disabled:opacity-60 text-stone-700 border border-stone-200 font-bold py-2 px-4 rounded-lg text-xs shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              {generateAllPendingMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating {pendingCount} summaries... this can take a while</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate all {pendingCount} pending</span>
                </>
              )}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center py-12 gap-3 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs">Loading queue items...</p>
          </div>
        ) : !drafts || drafts.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
            <CheckSquare className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-stone-800">No story drafts waiting</h3>
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
                    <img
                      src={draft.coverImageUrl || `https://img.youtube.com/vi/${extractVideoId(draft.videoUrl)}/mqdefault.jpg`}
                      alt={draft.title}
                      className="w-24 h-16 object-cover rounded-lg border border-stone-200 shrink-0"
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                          {draft.category}
                        </span>
                        <span
                          className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                            draft.hasSummary
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {draft.hasSummary ? 'Summary ready' : 'No summary yet'}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">{draft.title}</h3>
                      <p className="text-xs text-stone-500">{draft.channelName}</p>
                      <a
                        href={draft.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-700 underline break-all inline-flex items-center gap-1"
                      >
                        {draft.videoUrl}
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                    <button
                      onClick={() => handleGenerate(draft.id)}
                      disabled={generatingId === draft.id}
                      className="bg-white hover:bg-stone-50 disabled:opacity-60 text-stone-700 border border-stone-200 text-xs font-bold py-2 px-3 rounded-lg shadow-sm cursor-pointer transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                      title="Watch the video and (re)write the detailed summary"
                    >
                      {generatingId === draft.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Watching video...</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>{draft.hasSummary ? 'Regenerate' : 'Generate Summary'}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setEditingId(draft.id)}
                      className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 p-2.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                      title="Edit before publishing"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => publishMutation.mutate(draft.id)}
                      disabled={publishMutation.isPending || !draft.hasSummary}
                      className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm cursor-pointer transition-colors whitespace-nowrap"
                      title={draft.hasSummary ? 'Publish this story' : 'Generate a summary first'}
                    >
                      Approve &amp; Publish
                    </button>
                    <button
                      onClick={() => handleDelete(draft.id, draft.title)}
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

// Lightweight client-side extraction just for the queue's fallback thumbnail —
// the server does the authoritative version (EarnStoryIdentity) for anything
// that's actually stored or embedded.
function extractVideoId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : '';
}

interface DraftEditFormProps {
  draft: DraftEarnStory;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (payload: UpdateEarnStoryPayload) => void;
}

// Inline edit form for one draft. Lets the admin fix anything the AI got
// slightly wrong, add/replace the cover image, and — since DetailedSummary is
// just text here — hand-edit the generated write-up directly if needed.
const DraftEditForm: React.FC<DraftEditFormProps> = ({ draft, isSaving, onCancel, onSave }) => {
  const [title, setTitle] = useState(draft.title);
  const [category, setCategory] = useState(draft.category);
  const [whatTheyBuilt, setWhatTheyBuilt] = useState(draft.whatTheyBuilt);
  const [detailedSummary, setDetailedSummary] = useState(draft.detailedSummary ?? '');
  const [toolsUsedText, setToolsUsedText] = useState(draft.toolsUsedText);
  const [startupCost, setStartupCost] = useState(draft.startupCost);
  const [timeToFirstIncome, setTimeToFirstIncome] = useState(draft.timeToFirstIncome);
  const [claimedEarnings, setClaimedEarnings] = useState(draft.claimedEarnings);
  const [caveats, setCaveats] = useState(draft.caveats);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(draft.coverImageUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      category,
      whatTheyBuilt,
      detailedSummary,
      toolsUsedText,
      startupCost,
      timeToFirstIncome,
      claimedEarnings,
      caveats,
      coverImageUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} required />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block">Category</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass} />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">One-sentence hook (shown on the card)</label>
        <input type="text" value={whatTheyBuilt} onChange={(e) => setWhatTheyBuilt(e.target.value)} className={fieldClass} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">
          Detailed Summary (Markdown) {!draft.hasSummary && <span className="text-amber-600 normal-case font-normal">— not generated yet; publishing needs this filled in</span>}
        </label>
        <textarea
          value={detailedSummary}
          onChange={(e) => setDetailedSummary(e.target.value)}
          className={`${fieldClass} h-56 font-mono text-xs`}
          placeholder="## What They Did&#10;...&#10;&#10;## Step-by-Step&#10;...&#10;&#10;## Tools Used&#10;...&#10;&#10;## Costs & Timeline&#10;...&#10;&#10;## Claimed Earnings&#10;...&#10;&#10;## Our Take&#10;..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block">Startup Cost</label>
          <input type="text" value={startupCost} onChange={(e) => setStartupCost(e.target.value)} className={fieldClass} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block">Time to First Income</label>
          <input type="text" value={timeToFirstIncome} onChange={(e) => setTimeToFirstIncome(e.target.value)} className={fieldClass} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block">Claimed Earnings</label>
          <input type="text" value={claimedEarnings} onChange={(e) => setClaimedEarnings(e.target.value)} className={fieldClass} />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">Comma-separated tools used</label>
        <input type="text" value={toolsUsedText} onChange={(e) => setToolsUsedText(e.target.value)} className={fieldClass} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">Caveats (the honest, skeptical read)</label>
        <textarea value={caveats} onChange={(e) => setCaveats(e.target.value)} className={`${fieldClass} h-20`} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">Cover Image</label>
        <ImageUploadWidget folder="EarnStoryCovers" currentUrl={coverImageUrl} onUploaded={(url) => setCoverImageUrl(url || null)} />
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
