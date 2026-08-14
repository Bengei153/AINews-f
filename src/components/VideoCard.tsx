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
    <article className="group flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md hover:border-stone-300 transition-all duration-200">
      <Link to={`/videos/${video.slug}`} className="relative block aspect-video bg-stone-900 overflow-hidden">
        {video.thumbnailUrl && (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900/20 group-hover:bg-stone-900/40 transition-colors">
          <PlayCircle className="w-12 h-12 text-white opacity-90" />
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{video.channelName}</span>
          <Link to={`/videos/${video.slug}`} className="block">
            <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-emerald-800 transition-colors leading-tight">
              {video.title}
            </h3>
          </Link>
          <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">{video.aiReview}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500 pt-4 mt-4 border-t border-stone-100 font-medium">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-stone-400" />
            {video.viewCount.toLocaleString()} views
          </span>
        </div>
      </div>
    </article>
  );
};