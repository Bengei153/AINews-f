/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AITool } from '../types/api';
import { ExternalLink, Star, Award, DollarSign, Sparkles } from 'lucide-react';

interface ToolCardProps {
  tool: AITool;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const tagsList = tool.tags.split(',').map((tag) => tag.trim()).filter(Boolean);

  return (
    <div
      className={`tool-card editorial-card ${tool.isFeaturedToday ? 'tool-card--featured' : ''}`}
      id={`tool-card-${tool.id}`}
    >
      {tool.isFeaturedToday && (
        <div className="tool-card__spotlight">
          <Award className="w-3.5 h-3.5" />
          Spotlight
        </div>
      )}

      <div className="tool-card__body">
        <div className="tool-card__header">
          <div className="tool-card__identity">
            {tool.logoUrl && (
              <img
                src={tool.logoUrl}
                alt={`${tool.name} logo`}
                className="tool-card__logo"
              />
            )}
            {!tool.logoUrl && (
              <div className="tool-card__logo tool-card__logo--fallback" aria-hidden="true">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="tool-card__title font-serif">
                {tool.name}
              </h3>

              <div className="tool-card__rating">
                <Star className="w-3.5 h-3.5" />
                <span>{tool.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="tool-card__description">
          {tool.description}
        </p>

        <div className="tool-card__tags">
          {tagsList.map((tag) => (
            <span
              key={tag}
              className="tool-card__tag"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="tool-card__footer">
        <div className="tool-card__price">
          <DollarSign className="w-3.5 h-3.5" />
          <span>{tool.pricing}</span>
        </div>

        <a
          href={tool.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tool-card__link"
        >
          <span>Visit</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
};
