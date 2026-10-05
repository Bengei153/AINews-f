/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPageDraft,
  getCreatedPageForEdit,
  updateCreatedPage,
  publishCreatedPage,
  OwnedCreatedPage,
} from '../api/createdPages';
import { MarkChatResponse } from '../api/createdPages';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { PremiumUpsell } from '../components/PremiumUpsell';
import { MarkChatPanel } from '../components/MarkChatPanel';
import { PageWizardForm } from '../components/PageWizardForm';
import { Sparkles, FileEdit, Loader2, ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react';

export const CreatePage: React.FC = () => {
  const { pageId } = useParams<{ pageId?: string }>();
  const { isPremium, isLoading: isLoadingPremium } = usePremiumStatus();

  if (isLoadingPremium) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isPremium) {
    return <PremiumUpsell context="build a project page" />;
  }

  if (!pageId) return <StartScreen />;
  if (pageId === 'new') return <FreshMarkSession />;
  return <PageEditor pageId={pageId} />;
};

const StartScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (t: string) => createPageDraft(t),
    onSuccess: (id) => navigate(`/create/${id}`),
  });

  return (
    <div className="max-w-xl mx-auto space-y-8 text-center">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Build a project page</h1>
        <p className="text-sm text-stone-500">Chat it through with Mark, or fill it in yourself — you can switch anytime.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/create/new"
          className="group bg-white border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl p-6 text-left transition-colors space-y-2"
        >
          <Sparkles className="w-7 h-7 text-emerald-700" />
          <h3 className="font-bold text-stone-900">Chat with Mark</h3>
          <p className="text-xs text-stone-500">Describe what you built — Mark asks the right questions and writes it up for you.</p>
        </Link>

        <div className="bg-white border-2 border-stone-200 hover:border-stone-300 rounded-2xl p-6 text-left space-y-3">
          <FileEdit className="w-7 h-7 text-stone-700" />
          <h3 className="font-bold text-stone-900">Use the guided form</h3>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
            className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            onClick={() => title.trim() && createMutation.mutate(title.trim())}
            disabled={!title.trim() || createMutation.isPending}
            className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Start</span>}
          </button>
        </div>
      </div>

      <Link to="/my-pages" className="inline-block text-xs font-bold text-stone-500 hover:text-stone-800">
        ← Back to my pages
      </Link>
    </div>
  );
};

// A brand-new Mark conversation with no page yet. Once Mark's first reply creates one
// server-side, the URL is replaced with the real id so the session becomes resumable/bookmarkable
// and the dual-mode editor (with the Wizard tab) becomes available.
const FreshMarkSession: React.FC = () => {
  const navigate = useNavigate();

  const handlePageUpdated = (newPageId: string) => {
    navigate(`/create/${newPageId}`, { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/create" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </Link>
      <MarkChatPanel pageId={null} onPageUpdated={handlePageUpdated} />
    </div>
  );
};

const PageEditor: React.FC<{ pageId: string }> = ({ pageId }) => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'chat' | 'wizard'>('wizard');
  const [notice, setNotice] = useState<string | null>(null);

  const { data: page, isLoading } = useQuery({
    queryKey: ['owned-page', pageId],
    queryFn: () => getCreatedPageForEdit(pageId),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateCreatedPage>[1]) => updateCreatedPage(pageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owned-page', pageId] });
      setNotice('Saved.');
      setTimeout(() => setNotice(null), 2500);
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishCreatedPage(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owned-page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['my-pages'] });
    },
  });

  // Mark's responses come with a full snapshot already — write it straight into the query
  // cache rather than refetching, so the Wizard tab reflects Mark's changes the instant they
  // switch to it.
  const handleMarkUpdate = (_: string, snapshot: MarkChatResponse['page']) => {
    queryClient.setQueryData<OwnedCreatedPage | undefined>(['owned-page', pageId], (prev) =>
      prev ? { ...prev, ...snapshot } : prev
    );
  };

  if (isLoading || !page) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  const canPublish = page.deliveryUrl.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link to="/my-pages" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800">
          <ArrowLeft className="w-3.5 h-3.5" />
          My Pages
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              page.status === 'Published'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {page.status}
          </span>
          {page.status === 'Published' && (
            <Link
              to={`/projects/${page.slug}`}
              target="_blank"
              className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1"
            >
              View live <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      <h1 className="font-serif text-2xl font-bold text-stone-900">{page.title}</h1>

      <div className="flex gap-2 border-b border-stone-200">
        <button
          onClick={() => setTab('wizard')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
            tab === 'wizard' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Guided Form
        </button>
        <button
          onClick={() => setTab('chat')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
            tab === 'chat' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Chat with Mark
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {notice}
        </div>
      )}

      {tab === 'wizard' ? (
        <PageWizardForm page={page} isSaving={saveMutation.isPending} onSave={(payload) => saveMutation.mutate(payload)} />
      ) : (
        <MarkChatPanel pageId={pageId} onPageUpdated={handleMarkUpdate} />
      )}

      <div className="border-t border-stone-200 pt-5 flex items-center justify-between">
        <p className="text-xs text-stone-400">
          {canPublish ? 'Ready to publish whenever you are.' : 'Add a download, link, or connect URL before publishing.'}
        </p>
        <button
          onClick={() => publishMutation.mutate()}
          disabled={!canPublish || publishMutation.isPending || page.status === 'Published'}
          className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-lg text-xs shadow-md transition-colors cursor-pointer whitespace-nowrap"
        >
          {page.status === 'Published' ? 'Published' : publishMutation.isPending ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
};
