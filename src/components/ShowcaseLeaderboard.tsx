/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy, Heart, Star, ImageOff } from 'lucide-react';
import { getShowcaseLeaderboard } from '../api/showcase';
import { LeaderboardPeriod } from '../types/api';

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'Week', label: 'This week' },
  { value: 'Month', label: 'This month' },
  { value: 'All', label: 'All time' },
];

export const ShowcaseLeaderboard: React.FC = () => {
  const [period, setPeriod] = useState<LeaderboardPeriod>('Week');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['showcase-leaderboard', period],
    queryFn: () => getShowcaseLeaderboard(period, 5),
  });

  return (
    <section className="listing-controls">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">
          <Trophy className="w-3.5 h-3.5" />
          Community spotlight
        </div>
        <div className="pill-toggle">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`pill-toggle__option ${period === value ? 'pill-toggle__option--active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="leaderboard-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-card animate-pulse" style={{ height: '3.25rem' }} />
          ))}
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="leaderboard-empty">No reactions yet for this period — be the first!</div>
      ) : (
        <div className="leaderboard-list">
          {entries.map((entry, index) => (
            <Link key={entry.id} to={`/showcase/${entry.id}`} className="leaderboard-row">
              <span className={`leaderboard-row__rank ${index < 3 ? 'leaderboard-row__rank--top' : ''}`}>
                #{index + 1}
              </span>
              {entry.imageUrl ? (
                <img src={entry.imageUrl} alt="" className="leaderboard-row__thumb" />
              ) : (
                <div className="leaderboard-row__thumb leaderboard-row__placeholder">
                  <ImageOff className="w-4 h-4" />
                </div>
              )}
              <div className="leaderboard-row__body">
                <div className="leaderboard-row__title">{entry.title}</div>
                <div className="leaderboard-row__author">by {entry.authorName}</div>
              </div>
              {entry.isFeatured && <Star className="w-3.5 h-3.5 leaderboard-row__featured-pin" fill="currentColor" />}
              <span className="leaderboard-row__reactions">
                <Heart className="w-3.5 h-3.5" fill="currentColor" />
                {entry.reactionCount}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
