/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { getEarnStoryBySlug, deleteEarnStory } from '../api/earnStories';
import { getAiTools } from '../api/aiTools';
import { useAuth } from '../store/authStore';
import { ArrowLeft, ExternalLink, AlertCircle, AlertTriangle, Trash2, DollarSign, Clock, Wallet } from 'lucide-react';

export const EarnStoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: story, isLoading, isError } = useQuery({
    queryKey: ['earn-story', slug],
    queryFn: () => getEarnStoryBySlug(slug!),
    enabled: !!slug,
  });

  // Used only to cross-link "Tools Used" tags to the directory when a name
  // matches — never blocks rendering the story if this hasn't loaded yet.
  const { data: aiTools } = useQuery({
    queryKey: ['ai-tools'],
    queryFn: () => getAiTools(false),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEarnStory,
    onSuccess: () => navigate('/make-money'),
    onError: (err: any) => alert(err?.detail || 'Failed to delete story.'),
  });

  const handleDelete = () => {
    if (!story) return;
    if (window.confirm(`Delete "${story.title}"? This can't be undone.`)) {
      deleteMutation.mutate(story.id);
    }
  };

  const toolsUsed = React.useMemo(() => {
    if (!story) return [];
    return story.toolsUsedText.split(',').map((t) => t.trim()).filter(Boolean);
  }, [story]);

  const findMatchingTool = (toolName: string) => {
    if (!aiTools) return undefined;
    const normalized = toolName.toLowerCase();
    return aiTools.find((t) => t.name.toLowerCase() === normalized);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !story) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-stone-300 mx-auto" />
        <h3 className="font-serif text-lg font-bold text-stone-800">Story not found</h3>
        <Link to="/make-money" className="text-xs font-bold text-emerald-700 underline">Back to Make Money with AI</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      <Link to="/make-money" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Make Money with AI
      </Link>

      <div className="aspect-video w-full rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 shadow-sm">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${story.youTubeVideoId}`}
          title={story.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="space-y-4 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            {story.category}
          </span>
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{story.channelName}</span>
        </div>
        <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight leading-tight">{story.title}</h1>
        <p className="text-sm text-stone-600">{story.whatTheyBuilt}</p>
        <a
          href={story.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-emerald-700 transition-colors"
        >
          Watch on YouTube
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Stat row — kept visually distinct from the summary below since these are quick facts, not narrative */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            <Wallet className="w-3.5 h-3.5" />
            Startup Cost
          </div>
          <p className="text-sm font-bold text-stone-800">{story.startupCost || 'Not mentioned'}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            <Clock className="w-3.5 h-3.5" />
            Time to First Income
          </div>
          <p className="text-sm font-bold text-stone-800">{story.timeToFirstIncome || 'Not mentioned'}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            <DollarSign className="w-3.5 h-3.5" />
            Claimed Earnings
          </div>
          <p className="text-sm font-bold text-stone-800">{story.claimedEarnings || 'Not mentioned'}</p>
        </div>
      </div>

      {toolsUsed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Tools used</span>
          {toolsUsed.map((toolName) => {
            const match = findMatchingTool(toolName);
            return match ? (
              <Link
                key={toolName}
                to={`/tools#tool-card-${match.id}`}
                className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                {toolName}
              </Link>
            ) : (
              <span key={toolName} className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                {toolName}
              </span>
            );
          })}
        </div>
      )}

      {/* Render Markdown Body safely using react-markdown and pristine Tailwind classes */}
      <article className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-sm prose-p:leading-relaxed prose-p:text-stone-700 prose-li:text-sm prose-li:text-stone-700 prose-blockquote:border-emerald-600 prose-blockquote:bg-emerald-50/20 prose-blockquote:text-stone-600 prose-blockquote:font-medium prose-blockquote:text-xs prose-blockquote:p-4 prose-blockquote:rounded-r-lg space-y-5">
        <ReactMarkdown>{story.detailedSummary}</ReactMarkdown>
      </article>

      {story.caveats && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Before You Try This
          </h3>
          <p className="text-sm text-stone-700 leading-relaxed">{story.caveats}</p>
        </div>
      )}

      <p className="text-xs text-stone-400 italic">
        This story is a summary of one person's claims in their own video. AI Brief has not independently verified any figures shown here.
      </p>

      {user?.role === 'Admin' && (
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">Admin</h3>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete this story'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
