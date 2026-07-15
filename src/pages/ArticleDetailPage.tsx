/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { getArticleBySlug } from '../api/articles';
import { useAuth } from '../store/authStore';
import { Clock, Bookmark, ArrowLeft, ExternalLink, Globe, BookOpen, AlertCircle } from 'lucide-react';
import { ArticlePillar } from '../types/api';

const PILLAR_LABELS: Record<ArticlePillar, string> = {
  AIForStudents: 'AI for Students',
  AIForWork: 'AI for Work',
  AINews: 'AI News',
  AIToolSpotlight: 'AI Tool Spotlight',
  FutureOfAI: 'Future of AI',
};

export const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, bookmarks, toggleBookmark } = useAuth();

  // Fetch article detailed data using TanStack Query
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticleBySlug(slug || ''),
    enabled: !!slug,
    retry: 1,
  });

  const isBookmarked = article ? bookmarks.some((b) => b.articleId === article.id) : false;

  const handleBookmarkToggle = async () => {
    if (!user) {
      alert('Please sign in to bookmark articles.');
      return;
    }
    if (!article) return;
    try {
      await toggleBookmark(article.id);
    } catch (err: any) {
      alert(err.detail || 'Failed to toggle bookmark.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-4 w-20 bg-stone-200 rounded"></div>
        <div className="h-10 w-3/4 bg-stone-200 rounded"></div>
        <div className="h-4 w-1/3 bg-stone-200 rounded"></div>
        <hr className="border-stone-200" />
        <div className="space-y-4">
          <div className="h-4 w-full bg-stone-200 rounded"></div>
          <div className="h-4 w-full bg-stone-200 rounded"></div>
          <div className="h-4 w-5/6 bg-stone-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Handle article not found
  if (error || !article) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="font-serif text-xl font-bold text-stone-900">Briefing Not Found</h2>
        <p className="text-sm text-stone-500">
          The requested article could not be loaded. It may have been deleted, un-published, or your connection broke.
        </p>
        <button
          onClick={() => navigate('/articles')}
          className="text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const formattedDate = new Date(article.publishedOn).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200" id={`article-detail-${article.id}`}>
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors bg-white hover:bg-stone-100 border border-stone-200 rounded-lg px-3 py-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      {/* Main Core Layout: Sidebar + Main Reading Column */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="space-y-4">
            
            {/* Pillar Badge */}
            <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
              {PILLAR_LABELS[article.pillar] || article.pillar}
            </span>

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-stone-900 tracking-tight leading-tight">
              {article.title}
            </h1>

            {/* Summary */}
            <p className="text-base text-stone-600 font-medium italic border-l-4 border-emerald-600 pl-4 py-1 leading-relaxed">
              {article.summary}
            </p>

            {/* Sub-header details */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 font-semibold pt-2 border-b border-stone-200 pb-4">
              <span>Published {formattedDate}</span>
              <div className="w-1 h-1 rounded-full bg-stone-300"></div>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTimeMinutes} min read
              </span>
              {article.categoryName && (
                <>
                  <div className="w-1 h-1 rounded-full bg-stone-300"></div>
                  <span>Category: {article.categoryName}</span>
                </>
              )}
            </div>

          </div>

          {/* Render Markdown Body safely using react-markdown and pristine Tailwind classes */}
          <article className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-sm prose-p:leading-relaxed prose-p:text-stone-700 prose-blockquote:border-emerald-600 prose-blockquote:bg-emerald-50/20 prose-blockquote:text-stone-600 prose-blockquote:font-medium prose-blockquote:text-xs prose-blockquote:p-4 prose-blockquote:rounded-r-lg space-y-5">
            <ReactMarkdown>{article.body}</ReactMarkdown>
          </article>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Action Widget */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Save Reading</h3>
            
            <button
              onClick={handleBookmarkToggle}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
                isBookmarked
                  ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-600 hover:shadow-sm'
              }`}
              id="bookmark-detail-btn"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-700' : ''}`} />
              <span>{isBookmarked ? 'Bookmarked' : 'Bookmark Briefing'}</span>
            </button>
            
            {!user && (
              <p className="text-[10px] text-stone-500 text-center">
                Please <Link to="/login" className="text-emerald-700 hover:underline font-bold">sign in</Link> to toggle bookmarks.
              </p>
            )}
          </div>

          {/* Sources Metadata Widget */}
          {(article.sourceName || article.sourceUrl) && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                Original Source
              </h3>
              <div>
                <p className="text-sm font-bold text-stone-800 leading-tight">
                  {article.sourceName || 'Curated Feed'}
                </p>
                {article.sourceUrl && (
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1 mt-1 hover:underline"
                  >
                    <span>Read original release</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Tags list widget */}
          {article.tags && article.tags.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Related Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/articles?tagId=${tag}`}
                    className="text-[11px] font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors px-2.5 py-1 rounded-md"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
