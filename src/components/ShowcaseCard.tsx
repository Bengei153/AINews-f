/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShowcasePost } from '../types/api';
import { Wrench, Sparkles } from 'lucide-react';

interface ShowcaseCardProps {
  post: ShowcasePost;
}

export const ShowcaseCard: React.FC<ShowcaseCardProps> = ({ post }) => {
  return (
    <article className="group flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md hover:border-stone-300 transition-all duration-200">
      {post.imageUrl ? (
        <Link to={`/showcase/${post.id}`}>
          <img src={post.imageUrl} alt={post.title} className="w-full h-40 object-cover" />
        </Link>
      ) : (
        <div className="w-full h-40 bg-stone-50 flex items-center justify-center border-b border-stone-100">
          <Sparkles className="w-8 h-8 text-stone-300" />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {post.toolsUsed && (
            <Link
              to={`/showcase?tool=${encodeURIComponent(post.toolsUsed)}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 hover:text-emerald-700 transition-colors"
            >
              <Wrench className="w-3 h-3" />
              {post.toolsUsed}
            </Link>
          )}
          <Link to={`/showcase/${post.id}`} className="block">
            <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-emerald-800 transition-colors leading-tight">
              {post.title}
            </h3>
          </Link>
          <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">{post.description}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500 pt-4 mt-4 border-t border-stone-100 font-medium">
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
              {post.authorName.charAt(0).toUpperCase()}
            </div>
            {post.authorName}
          </span>
        </div>
      </div>
    </article>
  );
};