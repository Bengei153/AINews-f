/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Hammer, MessageCircle, Flame, Zap, Trophy, Heart, Users, Award } from 'lucide-react';
import { Badge } from '../types/api';

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, Hammer, MessageCircle, Flame, Zap, Trophy, Heart, Users,
};

interface BadgeGridProps {
  badges: Badge[];
  emptyMessage?: string;
}

/** Renders a grid of badge cards — earned ones full-color, locked ones dimmed. Used on both the "My Badges" profile panel (earned + locked) and a public author's badge list (earned only). */
export const BadgeGrid: React.FC<BadgeGridProps> = ({ badges, emptyMessage = 'No badges yet.' }) => {
  if (badges.length === 0) {
    return <p className="text-xs text-stone-400">{emptyMessage}</p>;
  }

  return (
    <div className="badge-grid">
      {badges.map((badge) => {
        const Icon = ICON_MAP[badge.icon] ?? Award;
        return (
          <div
            key={badge.code}
            className={`badge-card ${badge.earned ? '' : 'badge-card--locked'}`}
            title={badge.description}
          >
            <div className="badge-card__icon">
              <Icon className="w-5 h-5" />
            </div>
            <span className="badge-card__name">{badge.name}</span>
            <span className="badge-card__description">{badge.description}</span>
            {badge.earned && badge.earnedOn && (
              <span className="badge-card__earned-on">Earned {new Date(badge.earnedOn).toLocaleDateString()}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
