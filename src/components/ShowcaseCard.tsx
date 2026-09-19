/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShowcasePost, SharedContentType } from '../types/api';
import { Wrench, Sparkles, Star, Heart, Link2 } from 'lucide-react';

// Courses have no in-app detail page (CourseCard links straight to
// ExternalUrl, which isn't part of this snapshot), so a shared course
// renders as plain text rather than a dead link.
export const SHARED_CONTENT_PATH: Record<SharedContentType, string | null> = {
  Article: 'articles',
  Video: 'videos',
  Tutorial: 'tutorials',
  Course: null,
};

interface ShowcaseCardProps {
  post: ShowcasePost;
}

export const ShowcaseCard: React.FC<ShowcaseCardProps> = ({ post }) => {
  return (
    <article className="editorial-card content-card group">
      {post.imageUrl ? (
        <Link to={`/showcase/${post.id}`} className="content-card__media">
          <img src={post.imageUrl} alt={post.title} />
          {post.isFeatured && (
            <span className="content-card__featured-pin">
              <Star className="w-3 h-3" fill="currentColor" />
              Staff pick
            </span>
          )}
        </Link>
      ) : (
        <div className="content-card__media">
          <div className="content-card__visual content-card__visual--showcase">
            <Sparkles className="w-7 h-7" />
          </div>
          {post.isFeatured && (
            <span className="content-card__featured-pin">
              <Star className="w-3 h-3" fill="currentColor" />
              Staff pick
            </span>
          )}
        </div>
      )}

      <div className="content-card__body">
        <div className="content-card__copy">
          {post.toolsUsed && (
            <Link
              to={`/showcase?tool=${encodeURIComponent(post.toolsUsed)}`}
              onClick={(e) => e.stopPropagation()}
              className="content-card__eyebrow content-card__eyebrow--link"
            >
              <Wrench className="w-3 h-3" />
              {post.toolsUsed}
            </Link>
          )}
          <Link to={`/showcase/${post.id}`} className="block">
            <h3 className="content-card__title font-serif">
              {post.title}
            </h3>
          </Link>
          <p className="content-card__summary line-clamp-3">{post.description}</p>
          {post.sharedContentType && post.sharedContentTitle && (
            (() => {
              const pathSegment = SHARED_CONTENT_PATH[post.sharedContentType];
              const chipContent = (
                <>
                  <Link2 className="w-3 h-3" />
                  {post.sharedContentTitle}
                </>
              );
              return pathSegment && post.sharedContentSlug ? (
                <Link
                  to={`/${pathSegment}/${post.sharedContentSlug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shared-content-chip"
                >
                  {chipContent}
                </Link>
              ) : (
                <span className="shared-content-chip">{chipContent}</span>
              );
            })()
          )}
        </div>

        <div className="content-card__meta">
          <span className="content-card__author">
            <span>
              {post.authorName.charAt(0).toUpperCase()}
            </span>
            {post.authorName}
          </span>
          {post.reactionCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <Heart className="w-3.5 h-3.5" fill="currentColor" />
              {post.reactionCount}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
