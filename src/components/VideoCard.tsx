/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../types/api';
import { Eye, PlayCircle } from 'lucide-react';

interface VideoCardProps {
  video: Video;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  return (
    <article className="editorial-card content-card group">
      <Link to={`/videos/${video.slug}`} className="content-card__media content-card__media--video">
        {video.thumbnailUrl && (
          <img src={video.thumbnailUrl} alt={video.title} />
        )}
        <div className="content-card__play">
          <PlayCircle className="w-12 h-12" />
        </div>
      </Link>

      <div className="content-card__body">
        <div className="content-card__copy">
          <span className="content-card__eyebrow">{video.channelName}</span>
          <Link to={`/videos/${video.slug}`} className="block">
            <h3 className="content-card__title font-serif">
              {video.title}
            </h3>
          </Link>
          <p className="content-card__summary line-clamp-3">{video.aiReview}</p>
        </div>

        <div className="content-card__meta">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {video.viewCount.toLocaleString()} views
          </span>
        </div>
      </div>
    </article>
  );
};
