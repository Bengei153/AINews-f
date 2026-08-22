/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trash2, Loader2, MessageCircle } from 'lucide-react';
import { getShowcaseComments, createShowcaseComment, deleteShowcaseComment } from '../api/showcase';
import { ImageUploadWidget } from './ImageUploadWidget';
import { useAuth } from '../store/authStore';

export const ShowcaseCommentSection: React.FC<{ showcasePostId: string }> = ({ showcasePostId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['showcase-comments', showcasePostId],
    queryFn: () => getShowcaseComments(showcasePostId),
    enabled: !!showcasePostId,
  });

  const createMutation = useMutation({
    mutationFn: () => createShowcaseComment(showcasePostId, body, imageUrl),
    onSuccess: () => {
      setBody('');
      setImageUrl(null);
      queryClient.invalidateQueries({ queryKey: ['showcase-comments', showcasePostId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShowcaseComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showcase-comments', showcasePostId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-6" id="comments">
      <h3 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-emerald-800" />
        Discussion {comments && comments.length > 0 && <span className="text-stone-400 text-base font-sans">({comments.length})</span>}
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What do you think?"
            className="form-field"
            style={{ height: '5rem' }}
            maxLength={2000}
          />
          <ImageUploadWidget folder="Comments" currentUrl={imageUrl} onUploaded={(url) => setImageUrl(url || null)} />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending || !body.trim()}
              className="btn-secondary btn-secondary--small"
            >
              {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-lg px-4 py-3">
          <Link to="/login" className="text-emerald-700 underline font-bold">Sign in</Link> to join the discussion.
        </p>
      )}

      {isLoading ? (
        <p className="text-xs text-stone-400">Loading comments...</p>
      ) : !comments || comments.length === 0 ? (
        <p className="text-xs text-stone-400">No comments yet — be the first to say something.</p>
      ) : (
        <div className="comment-thread">
          {comments.map((comment) => {
            const canDelete = user && (user.id === comment.authorId || user.role === 'Admin');
            return (
              <div key={comment.id} className="comment-item">
                <div className="comment-item__header">
                  <div className="comment-item__author">
                    <div className="comment-item__avatar">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                    <span>{comment.authorName}</span>
                    <span className="comment-item__date">
                      {new Date(comment.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => deleteMutation.mutate(comment.id)}
                      disabled={deleteMutation.isPending}
                      className="comment-item__delete"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="comment-item__body">{comment.body}</p>
                {comment.imageUrl && (
                  <img src={comment.imageUrl} alt="Comment attachment" className="comment-item__image" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};