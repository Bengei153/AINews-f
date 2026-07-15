/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory } from '../../api/categories';
import { getTags, createTag } from '../../api/tags';
import { createAiTool } from '../../api/aiTools';
import { ArticlePillar } from '../../types/api';
import { getAdminDrafts, createArticle, publishArticle, triggerNewsIngestion } from '../../api/articles';
import { sendNewsletterNow } from '../../api/newsletter';
import { ShieldCheck, Layers, Clipboard, Radio, Calendar, Plus, ExternalLink, Sliders, CheckSquare, Sparkles, Loader2, BookOpen, Mail } from 'lucide-react';

const PILLARS: { value: ArticlePillar; label: string }[] = [
  { value: 'AIForStudents', label: 'AI for Students' },
  { value: 'AIForWork', label: 'AI for Work' },
  { value: 'AINews', label: 'AI News' },
  { value: 'AIToolSpotlight', label: 'AI Tool Spotlight' },
  { value: 'FutureOfAI', label: 'Future of AI' },
];

const fieldClass =
  'w-full text-sm px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/50';

const primaryButtonClass =
  'bg-stone-900 hover:bg-stone-800 disabled:opacity-75 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-md transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer';

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'queue' | 'article' | 'tool' | 'taxonomy'>('queue');

  // Success notifications
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotify({ type, message });
    setTimeout(() => setNotify(null), 4000);
  };

  // --- 1. TanStack Queries ---
  const { data: drafts, isLoading: isDraftsLoading } = useQuery({
    queryKey: ['admin-drafts'],
    queryFn: getAdminDrafts,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  // --- 2. Mutations ---
  const publishMutation = useMutation({
    mutationFn: publishArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['recent-articles'] });
      showNotification('success', 'Article draft published successfully!');
    },
    onError: (err: any) => {
      showNotification('error', err.detail || 'Failed to publish draft.');
    },
  });

  const ingestMutation = useMutation({
    mutationFn: triggerNewsIngestion,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-drafts'] });
      if (result.draftsCreated > 0) {
        showNotification('success', `Fetched ${result.itemsFetched} items, created ${result.draftsCreated} new drafts.`);
      } else {
        showNotification('success', `Checked ${result.itemsFetched} items — nothing new (${result.skipped} already seen).`);
      }
    },
    onError: (err: any) => {
      showNotification('error', err.detail || 'Failed to run news ingestion.');
    },
  });

  const sendNewsletterMutation = useMutation({
    mutationFn: () => sendNewsletterNow(5),
    onSuccess: (result) => {
      if (result.recipientCount > 0) {
        showNotification('success', `Sent to ${result.recipientCount} subscribers (${result.articleCount} articles).`);
      } else {
        showNotification('error', result.errors[0] || 'Nothing was sent.');
      }
    },
    onError: (err: any) => {
      showNotification('error', err.detail || 'Failed to send newsletter.');
    },
  });

  // --- 3. Form States & Submissions ---
  // A. New Briefing Draft
  const [artTitle, setArtTitle] = useState('');
  const [artSummary, setArtSummary] = useState('');
  const [artBody, setArtBody] = useState('');
  const [artPillar, setArtPillar] = useState<ArticlePillar>('AINews');
  const [artCategoryId, setArtCategoryId] = useState('');
  const [artSelectedTagIds, setArtSelectedTagIds] = useState<string[]>([]);
  const [artSourceType, setArtSourceType] = useState<'Original' | 'Aggregated' | 'AIGenerated'>('Original');
  const [artSourceName, setArtSourceName] = useState('');
  const [artSourceUrl, setArtSourceUrl] = useState('');
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle || !artSummary || !artBody || !artCategoryId) {
      showNotification('error', 'Please complete all required fields.');
      return;
    }
    setIsCreatingArticle(true);
    try {
      await createArticle({
        title: artTitle,
        summary: artSummary,
        body: artBody,
        pillar: artPillar,
        categoryId: artCategoryId,
        tagIds: artSelectedTagIds,
        sourceType: artSourceType,
        sourceName: artSourceName || null,
        sourceUrl: artSourceUrl || null,
      });

      showNotification('success', 'Draft article created successfully and queued!');
      
      // Reset Briefing Form
      setArtTitle('');
      setArtSummary('');
      setArtBody('');
      setArtSelectedTagIds([]);
      setArtSourceName('');
      setArtSourceUrl('');
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['admin-drafts'] });
      setActiveTab('queue'); // redirect to queue to publish it
    } catch (err: any) {
      showNotification('error', err.detail || 'Failed to create draft article.');
    } finally {
      setIsCreatingArticle(false);
    }
  };

  const handleToggleFormTag = (id: string) => {
    setArtSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // B. New AI Tool
  const [toolName, setToolName] = useState('');
  const [toolSlug, setToolSlug] = useState('');
  const [toolDesc, setToolDesc] = useState('');
  const [toolUrl, setToolUrl] = useState('');
  const [toolPricing, setToolPricing] = useState('');
  const [toolTags, setToolTags] = useState('');
  const [isCreatingTool, setIsCreatingTool] = useState(false);

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName || !toolSlug || !toolDesc || !toolUrl || !toolPricing || !toolTags) {
      showNotification('error', 'Please complete all fields for the tool.');
      return;
    }
    setIsCreatingTool(true);
    try {
      await createAiTool({
        name: toolName,
        slug: toolSlug,
        description: toolDesc,
        websiteUrl: toolUrl,
        pricing: toolPricing,
        tags: toolTags,
        logoUrl: null,
      });
      showNotification('success', `AI Tool '${toolName}' added successfully to the directory!`);
      
      // Reset form
      setToolName('');
      setToolSlug('');
      setToolDesc('');
      setToolUrl('');
      setToolPricing('');
      setToolTags('');
      
      queryClient.invalidateQueries({ queryKey: ['ai-tools'] });
    } catch (err: any) {
      showNotification('error', err.detail || 'Failed to add AI Tool.');
    } finally {
      setIsCreatingTool(false);
    }
  };

  // C. Taxonomy (Category & Tag creation)
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catPillar, setCatPillar] = useState<ArticlePillar>('AINews');
  const [catDesc, setCatDesc] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug || !catDesc) {
      showNotification('error', 'Please complete all fields for the category.');
      return;
    }
    setIsCreatingCat(true);
    try {
      await createCategory({
        name: catName,
        slug: catSlug,
        pillar: catPillar,
        description: catDesc,
      });
      showNotification('success', `Category '${catName}' added successfully!`);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (err: any) {
      showNotification('error', err.detail || 'Failed to create category.');
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName || !tagSlug) {
      showNotification('error', 'Please complete all fields for the tag.');
      return;
    }
    setIsCreatingTag(true);
    try {
      await createTag({ name: tagName, slug: tagSlug });
      showNotification('success', `Tag #${tagName} created successfully!`);
      setTagName('');
      setTagSlug('');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    } catch (err: any) {
      showNotification('error', err.detail || 'Failed to create tag.');
    } finally {
      setIsCreatingTag(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2 leading-tight">
            <ShieldCheck className="w-8 h-8 text-emerald-800 shrink-0" />
            Curator Admin Center
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Build draft digests, approve queues, configure taxonomy nodes, and list catalog resources.
          </p>
        </div>

        {/* Global Notifications Alert Banner */}
        {notify && (
          <div
            className={`w-full sm:w-auto self-start sm:self-center text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm border ${
              notify.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {notify.message}
          </div>
        )}
      </div>

      {/* Tabs navigation panel */}
      <div className="flex border border-stone-200 bg-white rounded-xl p-1 gap-1 overflow-x-auto shadow-sm" role="tablist" aria-label="Admin sections">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'queue'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-500 hover:text-stone-950 hover:bg-stone-50'
          }`}
          id="admin-tab-queue"
          type="button"
          role="tab"
          aria-selected={activeTab === 'queue'}
        >
          AI Queue ({drafts?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('article')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'article'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-500 hover:text-stone-950 hover:bg-stone-50'
          }`}
          id="admin-tab-briefing"
          type="button"
          role="tab"
          aria-selected={activeTab === 'article'}
        >
          Compose Briefing
        </button>
        <button
          onClick={() => setActiveTab('tool')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'tool'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-500 hover:text-stone-950 hover:bg-stone-50'
          }`}
          id="admin-tab-tool"
          type="button"
          role="tab"
          aria-selected={activeTab === 'tool'}
        >
          Spotlight Tool
        </button>
        <button
          onClick={() => setActiveTab('taxonomy')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'taxonomy'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-500 hover:text-stone-950 hover:bg-stone-50'
          }`}
          id="admin-tab-taxonomy"
          type="button"
          role="tab"
          aria-selected={activeTab === 'taxonomy'}
        >
          Taxonomy Node
        </button>
      </div>

      {/* TAB 1: AI QUEUE / DRAFT LISTINGS */}
      {activeTab === 'queue' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-400">
              <Layers className="w-4 h-4" />
              Unpublished Draft Digest Review Queue
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => ingestMutation.mutate()}
                disabled={ingestMutation.isPending}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-70 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm cursor-pointer transition-colors whitespace-nowrap"
              >
                {ingestMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {ingestMutation.isPending ? 'Fetching...' : 'Fetch new articles now'}
              </button>
              <button
                onClick={() => sendNewsletterMutation.mutate()}
                disabled={sendNewsletterMutation.isPending}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm cursor-pointer transition-colors whitespace-nowrap"
              >
                {sendNewsletterMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                {sendNewsletterMutation.isPending ? 'Sending...' : 'Send newsletter now'}
              </button>
            </div>
          </div>

          {isDraftsLoading ? (
            <div className="flex flex-col items-center py-12 gap-3 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs">Loading queue items...</p>
            </div>
          ) : !drafts || drafts.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 text-center max-w-md mx-auto space-y-3 shadow-sm">
              <CheckSquare className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-stone-800">Curation Queue is clear!</h3>
              <p className="text-sm text-stone-500">
                All created briefing digests are fully published. Select the <strong className="font-bold">Compose Briefing</strong> tab above to create a new one.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-stone-300 transition-colors"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Draft Queue
                      </span>
                      <span className="text-xs font-semibold text-stone-500">
                        {PILLARS.find((p) => p.value === draft.pillar)?.label || draft.pillar}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">{draft.title}</h3>
                    <p className="text-xs text-stone-600 line-clamp-2">{draft.summary}</p>
                    {draft.sourceName && (
                      <p className="text-[10px] text-stone-400 font-medium">Source: {draft.sourceName}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center w-full md:w-auto">
                    <button
                      onClick={() => publishMutation.mutate(draft.id)}
                      disabled={publishMutation.isPending}
                      className="w-full md:w-auto bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm cursor-pointer transition-colors whitespace-nowrap"
                      type="button"
                    >
                      Approve & Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: COMPOSE BRIEFING FORM */}
      {activeTab === 'article' && (
        <section className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="font-serif text-xl font-bold text-stone-800 flex items-center gap-1.5">
              <Clipboard className="w-5 h-5 text-emerald-800" />
              Draft New Digest
            </h2>
          </div>

          <form onSubmit={handleCreateArticle} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Pillar Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Pillar Category *</label>
                <select
                  value={artPillar}
                  onChange={(e) => setArtPillar(e.target.value as ArticlePillar)}
                  className={fieldClass}
                  required
                >
                  {PILLARS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Category Entity *</label>
                <select
                  value={artCategoryId}
                  onChange={(e) => setArtCategoryId(e.target.value)}
                  className={fieldClass}
                  required
                >
                  <option value="">Select Category Node</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Curation Type *</label>
                <select
                  value={artSourceType}
                  onChange={(e) => setArtSourceType(e.target.value as any)}
                  className={fieldClass}
                  required
                >
                  <option value="Original">Original Briefing</option>
                  <option value="Aggregated">Aggregated Summary</option>
                  <option value="AIGenerated">AI Generated Draft</option>
                </select>
              </div>

            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 block">Briefing Title *</label>
              <input
                type="text"
                placeholder="e.g. GPT-6 architecture breakthroughs and multi-modal speeds"
                value={artTitle}
                onChange={(e) => setArtTitle(e.target.value)}
                className={fieldClass}
                required
              />
            </div>

            {/* Summary */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 block">Sub-Summary / Deck Description *</label>
              <textarea
                placeholder="A concise, 1-2 sentence description summarizing the core insights. Shown on preview cards."
                value={artSummary}
                onChange={(e) => setArtSummary(e.target.value)}
                className={`${fieldClass} h-20`}
                required
              />
            </div>

            {/* Body (Markdown content) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 block">Detailed Content body (supports Markdown) *</label>
              <p className="text-[10px] text-stone-400">Use standard headings (##), bullet points (-), or blockquotes (&gt;) for pristine desktop rendering.</p>
              <textarea
                placeholder="# Detailed Briefing Header&#10;&#10;Explain the technology concept deeply..."
                value={artBody}
                onChange={(e) => setArtBody(e.target.value)}
                className="w-full text-sm font-mono p-4 border border-stone-200 rounded-lg h-48 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/50"
                required
              />
            </div>

            {/* Tags checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-600 block">Taxonomy Tags selection</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {tags?.map((t) => {
                  const isChecked = artSelectedTagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToggleFormTag(t.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                        isChecked
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      #{t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source Details (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-100 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Original Source Publisher Name</label>
                <input
                  type="text"
                  placeholder="e.g. OpenAI Research"
                  value={artSourceName}
                  onChange={(e) => setArtSourceName(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Original Source URL Link</label>
                <input
                  type="url"
                  placeholder="https://openai.com/research/..."
                  value={artSourceUrl}
                  onChange={(e) => setArtSourceUrl(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            {/* Submit btn */}
            <div className="flex justify-end pt-4 border-t border-stone-100">
              <button
                type="submit"
                disabled={isCreatingArticle}
                className={`${primaryButtonClass} w-full sm:w-auto`}
                id="create-article-submit-btn"
              >
                {isCreatingArticle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving draft queue...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create & Queue Draft</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </section>
      )}

      {/* TAB 3: COMPOSE AI SPOTLIGHT TOOL */}
      {activeTab === 'tool' && (
        <section className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6 max-w-2xl">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="font-serif text-xl font-bold text-stone-800 flex items-center gap-1.5">
              <Radio className="w-5 h-5 text-emerald-800" />
              Spotlight New AI Tool
            </h2>
          </div>

          <form onSubmit={handleCreateTool} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Tool Name *</label>
                <input
                  type="text"
                  placeholder="e.g. ChatGPT Pro"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">URL Slug *</label>
                <input
                  type="text"
                  placeholder="e.g. chatgpt-pro"
                  value={toolSlug}
                  onChange={(e) => setToolSlug(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 block">Tool Description *</label>
              <textarea
                placeholder="Briefly state key functionalities, developer, and main benefits..."
                value={toolDesc}
                onChange={(e) => setToolDesc(e.target.value)}
                className={`${fieldClass} h-24`}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Website URL Link *</label>
                <input
                  type="url"
                  placeholder="https://chatgpt.com"
                  value={toolUrl}
                  onChange={(e) => setToolUrl(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Pricing details *</label>
                <input
                  type="text"
                  placeholder="e.g. Free / $20mo"
                  value={toolPricing}
                  onChange={(e) => setToolPricing(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 block">Comma separated tag words *</label>
              <input
                type="text"
                placeholder="e.g. coding,writing,productivity"
                value={toolTags}
                onChange={(e) => setToolTags(e.target.value)}
                className={fieldClass}
                required
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-100">
              <button
                type="submit"
                disabled={isCreatingTool}
                className={`${primaryButtonClass} w-full sm:w-auto`}
                id="create-tool-submit-btn"
              >
                {isCreatingTool ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Spotlighting...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Spotlight Tool</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </section>
      )}

      {/* TAB 4: COMPOSE TAXONOMY (CATEGORY & TAG FORM) */}
      {activeTab === 'taxonomy' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          
          {/* New Category Box */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
            <h2 className="font-serif text-lg font-bold text-stone-800 border-b border-stone-100 pb-2">
              Create Category Node
            </h2>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Cognitive Models"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">URL Slug *</label>
                <input
                  type="text"
                  placeholder="e.g. cognitive-models"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Primary Content Pillar *</label>
                <select
                  value={catPillar}
                  onChange={(e) => setCatPillar(e.target.value as ArticlePillar)}
                  className={fieldClass}
                  required
                >
                  {PILLARS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Category Description *</label>
                <textarea
                  placeholder="Provide a 1-sentence synopsis of what topics sit in this node..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className={`${fieldClass} h-20`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingCat}
                className={`${primaryButtonClass} w-full`}
                id="create-category-submit-btn"
              >
                {isCreatingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Add Category Node</span>
              </button>
            </form>
          </div>

          {/* New Tag Box */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 h-fit">
            <h2 className="font-serif text-lg font-bold text-stone-800 border-b border-stone-100 pb-2">
              Create Taxonomy Tag
            </h2>

            <form onSubmit={handleCreateTag} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">Tag Name *</label>
                <input
                  type="text"
                  placeholder="e.g. LLM Reasoning"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">URL Slug *</label>
                <input
                  type="text"
                  placeholder="e.g. llm-reasoning"
                  value={tagSlug}
                  onChange={(e) => setTagSlug(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingTag}
                className={`${primaryButtonClass} w-full`}
                id="create-tag-submit-btn"
              >
                {isCreatingTag ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Add Taxonomy Tag</span>
              </button>
            </form>
          </div>

        </section>
      )}

    </div>
  );
};
