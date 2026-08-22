/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThumbsUp, Heart, Lightbulb, Sparkles } from 'lucide-react';
import { getShowcaseReactions, setShowcaseReaction } from '../api/showcase';
import { ReactionType } from '../types/api';
import { useAuth } from '../store/authStore';

const REACTION_CONFIG: { type: ReactionType; label: string; icon: React.ElementType }[] = [
  { type: 'Like', label: 'Like', icon: ThumbsUp },
  { type: 'Love', label: 'Love', icon: Heart },
  { type: 'Insightful', label: 'Insightful', icon: Lightbulb },
  { type: 'MindBlown', label: 'Mind blown', icon: Sparkles },
];

export const ShowcaseReactionBar: React.FC<{ showcasePostId: string }> = ({ showcasePostId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['showcase-reactions', showcasePostId],
    queryFn: () => getShowcaseReactions(showcasePostId),
    enabled: !!showcasePostId,
  });

  const mutation = useMutation({
    mutationFn: (reactionType: ReactionType) => setShowcaseReaction(showcasePostId, reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showcase-reactions', showcasePostId] });
    },
  });

  const handleClick = (reactionType: ReactionType) => {
    if (!user) {
      alert('Please sign in to react to showcase posts.');
      return;
    }
    mutation.mutate(reactionType);
  };

  return (
    <div className="reaction-bar">
      {REACTION_CONFIG.map(({ type, label, icon: Icon }) => {
        const count = data?.counts?.[type] ?? 0;
        const isActive = data?.currentUserReaction === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => handleClick(type)}
            disabled={mutation.isPending}
            className={isActive ? 'reaction-chip reaction-chip--active' : 'reaction-chip'}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count > 0 && <span className="reaction-chip__count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};