/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserCheck } from 'lucide-react';
import { getFollowStatus, followUser, unfollowUser } from '../api/follows';
import { useAuth } from '../store/authStore';

interface FollowButtonProps {
  /** The user being followed — typically a Showcase post's authorId. */
  userId: string;
  showCounts?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ userId, showCounts = true }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['follow-status', userId],
    queryFn: () => getFollowStatus(userId),
    enabled: !!userId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });

  const followMutation = useMutation({ mutationFn: () => followUser(userId), onSuccess: invalidate });
  const unfollowMutation = useMutation({ mutationFn: () => unfollowUser(userId), onSuccess: invalidate });

  // No follow button for your own posts, or while signed out — counts (if
  // requested) still render either way.
  if (!user || user.id === userId) {
    if (!showCounts || !data) return null;
    return (
      <span className="follow-counts">
        <span><strong>{data.followerCount}</strong> followers</span>
        <span><strong>{data.followingCount}</strong> following</span>
      </span>
    );
  }

  const isPending = followMutation.isPending || unfollowMutation.isPending;
  const isFollowing = data?.isFollowing ?? false;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => (isFollowing ? unfollowMutation.mutate() : followMutation.mutate())}
        className={`follow-button ${isFollowing ? 'follow-button--following' : ''}`}
      >
        {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
        {isFollowing ? 'Following' : 'Follow'}
      </button>
      {showCounts && data && (
        <span className="follow-counts">
          <span><strong>{data.followerCount}</strong> followers</span>
        </span>
      )}
    </div>
  );
};
