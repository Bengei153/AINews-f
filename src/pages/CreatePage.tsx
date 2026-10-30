/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPageDraft,
  getCreatedPageForEdit,
  updateCreatedPage,
  publishCreatedPage,
  MarkChatResponse,
  OwnedCreatedPage,
} from '../api/createdPages';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { PremiumUpsell } from '../components/PremiumUpsell';
import { MarkChatPanel } from '../components/MarkChatPanel';
import { PageWizardForm } from '../components/PageWizardForm';
import { CreatedPagePreview } from '../components/CreatedPagePreview';
import {
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  FileEdit,
  Loader2,
  MessageSquare,
  Monitor,
  Smartphone,
  Sparkles,
} from 'lucide-react';

type PageSnapshot = MarkChatResponse['page'];

export const CreatePage: React.FC = () => {
  const { pageId } = useParams<{ pageId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isPremium, isLoading: isLoadingPremium } = usePremiumStatus();

  // The id of a page Mark created during THIS session. The URL changes from /create/new to
  // /create/<id> after Mark's first reply, and remembering the id lets the workspace keep the
  // same instance (and so the same conversation) across that change instead of starting over.
  const [createdId, setCreatedId] = useState<string | null>(null);

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

  if (!pageId) return <StudioStart />;

  const isFresh = pageId === 'new';
  const initialPrompt = (location.state as { prompt?: string } | null)?.prompt;

  return (
    <StudioWorkspace
      key={isFresh || pageId === createdId ? 'session' : pageId}
      pageId={isFresh ? null : pageId}
      initialPrompt={isFresh ? initialPrompt : undefined}
      onPromptConsumed={() => navigate(location.pathname, { replace: true, state: null })}
      onCreated={(id) => {
        setCreatedId(id);
        navigate(`/create/${id}`, { replace: true });
      }}
    />
  );
};

// --- Start screen ----------------------------------------------------------

const STARTER_IDEAS = [
  'A web app I built that helps students…',
  'A Python script that automates…',
  'A Chrome extension that…',
  'A free template pack for…',
];

const StudioStart: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (t: string) => createPageDraft(t),
    onSuccess: (id) => navigate(`/create/${id}`),
  });

  const startChat = () => navigate('/create/new', { state: prompt.trim() ? { prompt: prompt.trim() } : null });

  return (
    <div className="studio-start">
      <span className="section-kicker">
        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
        Project builder
      </span>
      <h1 className="editorial-heading editorial-heading--page font-serif">
        What did you <em>build</em>?
      </h1>
      <p className="editorial-lede">
        Describe it in your own words. Mark turns it into a finished project page, and you watch it come together live.
      </p>

      <form
        className="studio-start__composer"
        onSubmit={(e) => {
          e.preventDefault();
          startChat();
        }}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              startChat();
            }
          }}
          rows={4}
          placeholder="e.g. I built a study planner that turns a syllabus into a weekly schedule. It's a web app at…"
          aria-label="Describe your project"
          autoFocus
        />
        <div className="studio-start__bar">
          <div className="studio-start__ideas">
            {STARTER_IDEAS.map((idea) => (
              <button key={idea} type="button" onClick={() => setPrompt(idea)}>
                {idea}
              </button>
            ))}
          </div>
          <button type="submit" className="btn-primary" disabled={!prompt.trim()}>
            Start building <ArrowUp className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </form>

      <div className="studio-start__alt">
        <button type="button" className="bench-link" onClick={() => navigate('/create/new')}>
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" /> Just open the chat
        </button>
        <button type="button" className="bench-link" onClick={() => setShowForm((v) => !v)} aria-expanded={showForm}>
          <FileEdit className="w-3.5 h-3.5" aria-hidden="true" /> Prefer a form? Start with a title
        </button>
        <Link to="/my-pages" className="bench-link">
          ← My pages
        </Link>
      </div>

      {showForm && (
        <form
          className="studio-start__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) createMutation.mutate(title.trim());
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
            aria-label="Project title"
            maxLength={150}
          />
          <button type="submit" className="btn-secondary btn-secondary--small" disabled={!title.trim() || createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : 'Start'}
          </button>
        </form>
      )}
    </div>
  );
};

// --- Workspace -------------------------------------------------------------

interface StudioWorkspaceProps {
  /** Null while it is still a brand-new conversation with no page behind it. */
  pageId: string | null;
  initialPrompt?: string;
  onPromptConsumed: () => void;
  onCreated: (pageId: string) => void;
}

const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({ pageId, initialPrompt, onPromptConsumed, onCreated }) => {
  const queryClient = useQueryClient();
  const [stageTab, setStageTab] = useState<'preview' | 'details'>('preview');
  const [mobileView, setMobileView] = useState<'chat' | 'preview' | 'details'>('chat');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [notice, setNotice] = useState<string | null>(null);

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['owned-page', pageId],
    queryFn: () => getCreatedPageForEdit(pageId as string),
    enabled: !!pageId,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateCreatedPage>[1]) => updateCreatedPage(pageId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owned-page', pageId] });
      setNotice('Saved');
      window.setTimeout(() => setNotice(null), 2500);
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishCreatedPage(pageId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owned-page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['my-pages'] });
    },
  });

  // Mark's replies carry a full snapshot already, so it goes straight into the query cache rather
  // than being refetched — the preview and the Details form reflect the change at once.
  const handleMarkUpdate = (newId: string, snapshot: PageSnapshot) => {
    queryClient.setQueryData<OwnedCreatedPage>(['owned-page', newId], (prev) => ({
      status: 'Draft',
      slug: '',
      viewCount: 0,
      ...(prev ?? {}),
      ...snapshot,
    }));

    if (!pageId) {
      // First reply: the page now exists. Fetch the server's copy (it knows the slug and status),
      // then move the URL onto the real id so the session can be resumed or bookmarked.
      queryClient.invalidateQueries({ queryKey: ['owned-page', newId] });
      onCreated(newId);
    }
  };

  const showStage = (tab: 'preview' | 'details') => {
    setStageTab(tab);
    setMobileView(tab);
  };

  const snapshot: PageSnapshot | null = page
    ? {
        id: page.id,
        title: page.title,
        shortDescription: page.shortDescription,
        detailedDescription: page.detailedDescription,
        category: page.category,
        toolsUsedText: page.toolsUsedText,
        deliveryMode: page.deliveryMode,
        deliveryUrl: page.deliveryUrl,
        coverImageUrl: page.coverImageUrl,
      }
    : null;

  if (pageId && isError) {
    return (
      <div className="studio-start">
        <h1 className="editorial-heading font-serif">That page couldn’t be opened</h1>
        <p className="editorial-lede">It may have been deleted, or it belongs to another account.</p>
        <div className="studio-start__alt">
          <Link to="/my-pages" className="bench-link">← My pages</Link>
        </div>
      </div>
    );
  }

  const canPublish = !!page && page.deliveryUrl.trim().length > 0;
  const isPublished = page?.status === 'Published';

  return (
    <div className="studio" data-view={mobileView}>
      <header className="studio__bar">
        <Link to="/my-pages" className="studio__back" aria-label="Back to my pages">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>My pages</span>
        </Link>
        <h1 className="studio__title">{page?.title || 'New project'}</h1>

        <div className="studio__bar-actions">
          {notice && (
            <span className="studio__saved" role="status">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {notice}
            </span>
          )}
          {page && (
            <span className={`studio__status ${isPublished ? 'is-live' : ''}`}>{page.status}</span>
          )}
          {isPublished && page && (
            <Link to={`/projects/${page.slug}`} target="_blank" className="bench-link">
              View live <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          )}
          {page && !canPublish && !isPublished && <span className="studio__hint">Add a link to publish</span>}
          <button
            type="button"
            className="btn-primary btn-primary--small"
            onClick={() => publishMutation.mutate()}
            disabled={!canPublish || publishMutation.isPending || isPublished}
          >
            {isPublished ? 'Published' : publishMutation.isPending ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </header>

      <div className="studio__panes" role="tablist" aria-label="Workspace">
        {(['chat', 'preview', 'details'] as const).map((view) => (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={mobileView === view}
            className={mobileView === view ? 'is-active' : ''}
            onClick={() => (view === 'chat' ? setMobileView('chat') : showStage(view))}
          >
            {view === 'chat' ? 'Chat' : view === 'preview' ? 'Preview' : 'Details'}
          </button>
        ))}
      </div>

      <div className="studio__body">
        <section className="studio__chat" aria-label="Chat with Mark">
          <div className="studio__panel-head">
            <span className="studio__mark" aria-hidden="true">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong>Mark</strong>
              <small>Your project-page assistant</small>
            </div>
          </div>
          {/* Existing pages wait for their data first, so Mark can report exactly what each reply changed. */}
          {pageId && isLoading ? (
            <div className="studio__loading" role="status">
              <div className="bench-spinner" aria-hidden="true" />
            </div>
          ) : (
            <MarkChatPanel
              pageId={pageId}
              pageSnapshot={snapshot}
              onPageUpdated={handleMarkUpdate}
              initialPrompt={initialPrompt}
              onPromptConsumed={onPromptConsumed}
            />
          )}
        </section>

        <section className="studio__stage" aria-label="Page preview and details">
          <div className="studio__panel-head studio__panel-head--tabs">
            <div className="studio__tabs" role="tablist" aria-label="Stage">
              <button type="button" role="tab" aria-selected={stageTab === 'preview'} className={stageTab === 'preview' ? 'is-active' : ''} onClick={() => showStage('preview')}>
                Preview
              </button>
              <button type="button" role="tab" aria-selected={stageTab === 'details'} className={stageTab === 'details' ? 'is-active' : ''} onClick={() => showStage('details')}>
                Details
              </button>
            </div>
            {stageTab === 'preview' && (
              <div className="studio__devices" role="group" aria-label="Preview size">
                <button type="button" aria-pressed={device === 'desktop'} className={device === 'desktop' ? 'is-active' : ''} onClick={() => setDevice('desktop')} title="Desktop">
                  <Monitor className="w-4 h-4" aria-hidden="true" />
                </button>
                <button type="button" aria-pressed={device === 'mobile'} className={device === 'mobile' ? 'is-active' : ''} onClick={() => setDevice('mobile')} title="Phone">
                  <Smartphone className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <div className="studio__stage-body">
            {stageTab === 'preview' ? (
              <CreatedPagePreview page={page ?? null} device={device} />
            ) : page ? (
              <div className="studio__details">
                <PageWizardForm page={page} isSaving={saveMutation.isPending} onSave={(payload) => saveMutation.mutate(payload)} />
              </div>
            ) : (
              <div className="studio-preview__empty">
                <FileEdit className="w-8 h-8" aria-hidden="true" />
                <h3 className="font-serif">Details unlock after your first message</h3>
                <p>Tell Mark about your project and the form fills itself in, ready for you to fine-tune.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
