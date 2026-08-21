/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Trophy, Zap } from 'lucide-react';
import { getMyGameProfile, pingDailyActivity } from '../api/gamification';
import { useAuth } from '../store/authStore';

type StreakBadgeVariant = 'inline' | 'compact' | 'panel';

interface StreakBadgeProps {
  variant?: StreakBadgeVariant;
}

const pingedActivityUsers = new Set<string>();

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

export const StreakBadge: React.FC<StreakBadgeProps> = ({ variant = 'inline' }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: profile } = useQuery({
    queryKey: ['game-profile', userId],
    queryFn: getMyGameProfile,
    enabled: !!user,
  });

  const { data: justAwarded = null } = useQuery<number | null>({
    queryKey: ['game-profile-award', userId],
    queryFn: async () => null,
    enabled: false,
    initialData: null,
  });

  // Ping once per user per app session. The backend is still idempotent per UTC day.
  useEffect(() => {
    if (!userId || pingedActivityUsers.has(userId)) return;

    pingedActivityUsers.add(userId);
    pingDailyActivity()
      .then((result) => {
        queryClient.setQueryData(['game-profile', userId], {
          totalXp: result.totalXp,
          currentStreak: result.currentStreak,
          longestStreak: result.longestStreak,
          lastActivityDate: null,
        });
        if (result.xpAwardedToday) {
          const gained = result.streakBonusAwarded ? 30 : 5; // daily (5) + weekly bonus (25) if both fired
          queryClient.setQueryData(['game-profile-award', userId], gained);
          setTimeout(() => queryClient.setQueryData(['game-profile-award', userId], null), 4000);
        }
      })
      .catch(() => {
        pingedActivityUsers.delete(userId);
        // Non-critical. A failed ping just means the badge shows slightly stale numbers.
      });
  }, [queryClient, userId]);

  if (!user || !profile) return null;

  const totalXp = variant === 'compact' ? formatCompactNumber(profile.totalXp) : profile.totalXp.toLocaleString();
  const badgeTitle = `${profile.currentStreak}-day streak, ${profile.longestStreak}-day best streak, ${profile.totalXp.toLocaleString()} XP`;

  if (variant === 'panel') {
    return (
      <section className="streak-panel" title={badgeTitle} aria-label={badgeTitle}>
        <div className="streak-panel__heading">
          <span>
            <Zap className="w-3.5 h-3.5" />
            Daily progress
          </span>
          {justAwarded && <strong>+{justAwarded} XP today</strong>}
        </div>

        <div className="streak-panel__metrics">
          <div className="streak-panel__metric streak-panel__metric--streak">
            <Flame className="w-4 h-4" />
            <span>Streak</span>
            <strong>{profile.currentStreak}d</strong>
          </div>
          <div className="streak-panel__metric streak-panel__metric--best">
            <Trophy className="w-4 h-4" />
            <span>Best</span>
            <strong>{profile.longestStreak}d</strong>
          </div>
          <div className="streak-panel__metric streak-panel__metric--xp">
            <Zap className="w-4 h-4" />
            <span>XP</span>
            <strong>{profile.totalXp.toLocaleString()}</strong>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className={`streak-badge streak-badge--${variant}`} title={badgeTitle} aria-label={badgeTitle}>
      <div className="streak-chip streak-chip--streak">
        <Flame className="w-3.5 h-3.5" />
        <strong>{profile.currentStreak}</strong>
        <span>day</span>
      </div>
      <div className="streak-chip streak-chip--xp">
        <Zap className="w-3.5 h-3.5" />
        <strong>{totalXp}</strong>
        <span>XP</span>
        {justAwarded && (
          <span className="streak-award animate-pulse">
            +{justAwarded}
          </span>
        )}
      </div>
    </div>
  );
};
