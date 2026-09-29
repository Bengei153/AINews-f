/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AITool } from '../types/api';
import { ExternalLink, Star, Award, DollarSign, Sparkles } from 'lucide-react';

interface ToolCardProps {
  tool: AITool;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const tagsList = tool.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  // A logo URL can go stale (image host change, deleted upload); fall back to the
  // sparkle placeholder instead of showing a broken-image icon.
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(tool.logoUrl) && !logoFailed;

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
            {showLogo && (
              <img
                src={tool.logoUrl ?? undefined}
                alt={`${tool.name} logo`}
                className="tool-card__logo"
                onError={() => setLogoFailed(true)}
              />
            )}
            {!showLogo && (
              <div className="tool-card__logo tool-card__logo--fallback" aria-hidden="true">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="tool-card__title font-serif">
                {tool.name}
              </h3>

              {/* Newly discovered tools start unrated (0). Showing "0.0" stars would read as a bad review. */}
              {tool.rating > 0 && (
                <div className="tool-card__rating">
                  <Star className="w-3.5 h-3.5" />
                  <span>{tool.rating.toFixed(1)}</span>
                </div>
              )}
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
