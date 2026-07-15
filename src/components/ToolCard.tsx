/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AITool } from '../types/api';
import { ExternalLink, Star, Award, DollarSign } from 'lucide-react';

interface ToolCardProps {
  tool: AITool;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const tagsList = tool.tags.split(',').map((tag) => tag.trim()).filter(Boolean);

  return (
    <div
      className={`relative flex flex-col bg-white border rounded-xl p-5 overflow-hidden transition-all duration-200 ${
        tool.isFeaturedToday
          ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
          : 'border-stone-200 hover:shadow-md hover:border-stone-300'
      }`}
      id={`tool-card-${tool.id}`}
    >
      
      {/* Featured Badge */}
      {tool.isFeaturedToday && (
        <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm">
          <Award className="w-3.5 h-3.5" />
          Featured Spotlight
        </div>
      )}

      {/* Title & Description */}
      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-emerald-800 transition-colors leading-tight flex items-center gap-1.5">
              {tool.name}
            </h3>
            
            {/* Rating Stars */}
            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold mt-1">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>{tool.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed">
          {tool.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tagsList.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Pricing & Outbound Link */}
      <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-500">
        <div className="flex items-center gap-1 text-stone-700 bg-stone-50 border border-stone-200 py-1 px-2 rounded-md">
          <DollarSign className="w-3.5 h-3.5 text-stone-400" />
          <span>{tool.pricing}</span>
        </div>

        <a
          href={tool.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold hover:underline transition-colors py-1 px-2"
        >
          <span>Visit Website</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
};
