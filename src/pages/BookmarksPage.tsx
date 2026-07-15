/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { ArticleCard } from '../components/ArticleCard';
import { Bookmark, Sparkles, BookOpen, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { Article } from '../types/api';

export const BookmarksPage: React.FC = () => {
  const { user, bookmarks, toggleBookmark } = useAuth();

  const handleRemoveBookmark = async (e: React.MouseEvent, articleId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleBookmark(articleId);
    } catch (err: any) {
      alert(err.detail || 'Failed to remove bookmark.');
    }
  };

  // Convert BookmarkItem shape back into standard public Article model so we can feed it to standard ArticleCard
  const mappedArticles = React.useMemo(() => {
    return bookmarks.map((bm) => ({
      id: bm.articleId,
      title: bm.title,
      slug: bm.slug,
      summary: bm.summary,
      pillar: 'AIForWork', // Mock fallback
      categoryName: 'Saved Reference',
      readTimeMinutes: 4,
      publishedOn: bm.savedOn,
    })) as Article[];
  }, [bookmarks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          <Bookmark className="w-8 h-8 text-amber-500 fill-amber-500" />
          My Saved Briefings
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Access your personal workspace bookmarks, synced across your active session.
        </p>
      </div>

      {/* Bookmarks list */}
      {bookmarks.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <Bookmark className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">Your bookmark collection is empty</h3>
          <p className="text-sm text-stone-500 leading-relaxed">
            When browsing the briefings list, click the star bookmark icon in the top right of any card to pin it here.
          </p>
          <Link
            to="/articles"
            className="text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5"
          >
            <span>Browse briefings directory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mappedArticles.map((art) => (
            <div key={art.id} className="relative group">
              
              {/* Overlay standard ArticleCard wrapper */}
              <ArticleCard article={art} />
              
              {/* Optional Quick Remove Action Badge */}
              <button
                onClick={(e) => handleRemoveBookmark(e, art.id)}
                className="absolute top-12 right-4 p-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Remove Bookmark"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
