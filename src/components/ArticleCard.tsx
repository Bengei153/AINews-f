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

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
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

  const formattedDate = new Date(article.publishedOn).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article 
      className="group flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md hover:border-stone-300 transition-all duration-200 relative"
      id={`article-card-${article.id}`}
    >
      
      {/* Pillar Badge & Bookmarking Action */}
      <div className="p-4 pb-0 flex items-center justify-between">
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
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
        </button>
      </div>

      {/* Title & Summary */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <Link to={`/articles/${article.slug}`} className="block">
            <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-emerald-800 transition-colors leading-tight">
              {article.title}
            </h3>
          </Link>
          <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">
            {article.summary}
          </p>
        </div>

        {/* Read Time & Published Date */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-4 mt-4 border-t border-stone-100 font-medium">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{article.readTimeMinutes} min read</span>
          </div>
          <span>{formattedDate}</span>
        </div>
      </div>

    </article>
  );
};
