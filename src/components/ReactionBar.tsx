/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThumbsUp, Heart, Lightbulb, Sparkles } from 'lucide-react';
import { getReactions, setReaction } from '../api/reactions';
import { ReactionType } from '../types/api';
import { useAuth } from '../store/authStore';

const REACTION_CONFIG: { type: ReactionType; label: string; icon: React.ElementType }[] = [
  { type: 'Like', label: 'Like', icon: ThumbsUp },
  { type: 'Love', label: 'Love', icon: Heart },
  { type: 'Insightful', label: 'Insightful', icon: Lightbulb },
  { type: 'MindBlown', label: 'Mind blown', icon: Sparkles },
];

export const ReactionBar: React.FC<{ articleId: string }> = ({ articleId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['reactions', articleId],
    queryFn: () => getReactions(articleId),
    enabled: !!articleId,
  });

  const mutation = useMutation({
    mutationFn: (reactionType: ReactionType) => setReaction(articleId, reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', articleId] });
    },
  });

  const handleClick = (reactionType: ReactionType) => {
    if (!user) {
      alert('Please sign in to react to articles.');
      return;
    }
    mutation.mutate(reactionType);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {REACTION_CONFIG.map(({ type, label, icon: Icon }) => {
        const count = data?.counts?.[type] ?? 0;
        const isActive = data?.currentUserReaction === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => handleClick(type)}
            disabled={mutation.isPending}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60 ${
              isActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count > 0 && <span className="text-stone-400">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};