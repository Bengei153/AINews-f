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
    <article className="editorial-card content-card group">
      {post.imageUrl ? (
        <Link to={`/showcase/${post.id}`} className="content-card__media">
          <img src={post.imageUrl} alt={post.title} />
        </Link>
      ) : (
        <div className="content-card__media">
          <div className="content-card__visual content-card__visual--showcase">
            <Sparkles className="w-7 h-7" />
          </div>
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
        </div>

        <div className="content-card__meta">
          <span className="content-card__author">
            <span>
              {post.authorName.charAt(0).toUpperCase()}
            </span>
            {post.authorName}
          </span>
        </div>
      </div>
    </article>
  );
};
