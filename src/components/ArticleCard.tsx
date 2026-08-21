/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Article, ArticlePillar } from '../types/api';
import { Bookmark, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../store/authStore';

interface ArticleCardProps {
  article: Article;
  hideMissingImagePlaceholder?: boolean;
}

const PILLAR_STYLES: Record<ArticlePillar, { badge: string; text: string }> = {
  AIForStudents: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    text: 'AI for Students',
  },
  AIForWork: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'AI for Work',
  },
  AINews: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'AI News',
  },
  AIToolSpotlight: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    text: 'Tool Spotlight',
  },
  FutureOfAI: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    text: 'Future of AI',
  },
};

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, hideMissingImagePlaceholder = false }) => {
  const { user, bookmarks, toggleBookmark } = useAuth();

  const isBookmarked = bookmarks.some((b) => b.articleId === article.id);

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Please log in or sign up to bookmark this article.');
      return;
    }
    try {
      await toggleBookmark(article.id);
    } catch (err: any) {
      alert(err.detail || 'Failed to toggle bookmark.');
    }
  };

  const pillarStyle = PILLAR_STYLES[article.pillar] || {
    badge: 'bg-stone-100 text-stone-700 border-stone-200',
    text: article.pillar,
  };

  const coverImageUrl = article.coverImageUrl?.trim();
  const visualClass = `content-card__visual content-card__visual--${article.pillar}`;
  const shouldRenderMedia = Boolean(coverImageUrl) || !hideMissingImagePlaceholder;

  const formattedDate = new Date(article.publishedOn).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article 
      className={`editorial-card content-card group relative ${shouldRenderMedia ? '' : 'content-card--medialess'}`}
      id={`article-card-${article.id}`}
    >
      {shouldRenderMedia && (
        <Link to={`/articles/${article.slug}`} className="content-card__media" aria-label={article.title}>
          {coverImageUrl ? (
            <img src={coverImageUrl} alt={article.title} />
          ) : (
            <div className={visualClass}>
              <Sparkles className="w-7 h-7" />
            </div>
          )}
        </Link>
      )}

      <div className="content-card__header">
        <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${pillarStyle.badge}`}>
          {pillarStyle.text}
        </span>
        
        <button
          onClick={handleBookmarkToggle}
          className={`p-1.5 rounded-full transition-all duration-150 ${
            isBookmarked 
              ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' 
              : 'bg-stone-50 text-stone-400 hover:text-stone-700 hover:bg-stone-100'
          }`}
          title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
          type="button"
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
        </button>
      </div>

      <div className="content-card__body">
        <div className="content-card__copy">
          <Link to={`/articles/${article.slug}`} className="block">
            <h3 className="content-card__title font-serif">
              {article.title}
            </h3>
          </Link>
          <p className="content-card__summary line-clamp-3">
            {article.summary}
          </p>
        </div>

        <div className="content-card__meta">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.readTimeMinutes} min read</span>
          </div>
          <span>{formattedDate}</span>
        </div>
      </div>

    </article>
  );
};
