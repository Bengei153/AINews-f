/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Zap } from 'lucide-react';
import { getMyGameProfile, pingDailyActivity } from '../api/gamification';
import { useAuth } from '../store/authStore';

export const StreakBadge: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [justAwarded, setJustAwarded] = useState<number | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['game-profile'],
    queryFn: getMyGameProfile,
    enabled: !!user,
  });

  // Ping once per mount (effectively once per session/app-load) — the
  // backend itself is idempotent per UTC day, so this is safe even if the
  // component remounts (e.g. navigating away and back).
  useEffect(() => {
    if (!user) return;
    pingDailyActivity()
      .then((result) => {
        queryClient.setQueryData(['game-profile'], {
          totalXp: result.totalXp,
          currentStreak: result.currentStreak,
          longestStreak: result.longestStreak,
          lastActivityDate: null,
        });
        if (result.xpAwardedToday) {
          const gained = result.streakBonusAwarded ? 30 : 5; // daily (5) + weekly bonus (25) if both fired
          setJustAwarded(gained);
          setTimeout(() => setJustAwarded(null), 4000);
        }
      })
      .catch(() => {
        // Non-critical — a failed ping just means the badge shows slightly
        // stale numbers until the next page load.
      });
  }, [user?.id]);

  if (!user || !profile) return null;

  return (
    <div className="flex items-center gap-2 text-xs font-bold" title={`${profile.longestStreak}-day best streak`}>
      <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
        <Flame className="w-3.5 h-3.5" />
        {profile.currentStreak}
      </div>
      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full relative">
        <Zap className="w-3.5 h-3.5" />
        {profile.totalXp.toLocaleString()}
        {justAwarded && (
          <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
            +{justAwarded}
          </span>
        )}
      </div>
    </div>
  );
};