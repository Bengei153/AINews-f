/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EarnStoryCard as EarnStoryCardType } from '../types/api';
import { PlayCircle, DollarSign, Clock } from 'lucide-react';

interface EarnStoryCardProps {
  story: EarnStoryCardType;
}

export const EarnStoryCard: React.FC<EarnStoryCardProps> = ({ story }) => {
  // Prefer an admin-uploaded cover; fall back to YouTube's own public thumbnail
  // so a story never has to wait on someone uploading an image to look complete.
  const [coverFailed, setCoverFailed] = useState(false);
  const fallbackThumbnail = story.youTubeVideoId ? `https://img.youtube.com/vi/${story.youTubeVideoId}/hqdefault.jpg` : null;
  const thumbnail = !coverFailed && (story.coverImageUrl || fallbackThumbnail);

  return (
    <article className="editorial-card content-card group">
      <Link to={`/make-money/${story.slug}`} className="content-card__media content-card__media--video">
        {thumbnail && (
          <img src={thumbnail} alt={story.title} onError={() => setCoverFailed(true)} />
        )}
        <div className="content-card__play">
          <PlayCircle className="w-12 h-12" />
        </div>
      </Link>

      <div className="content-card__body">
        <div className="content-card__copy">
          <span className="content-card__eyebrow">{story.category}</span>
          <Link to={`/make-money/${story.slug}`} className="block">
            <h3 className="content-card__title font-serif">
              {story.title}
            </h3>
          </Link>
          <p className="content-card__summary line-clamp-3">{story.whatTheyBuilt}</p>
        </div>

        <div className="content-card__meta flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {story.claimedEarnings && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              {story.claimedEarnings}
            </span>
          )}
          {story.timeToFirstIncome && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {story.timeToFirstIncome}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
