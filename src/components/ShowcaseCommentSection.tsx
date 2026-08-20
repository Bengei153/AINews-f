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
        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What do you think?"
            className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/50"
            maxLength={2000}
          />
          <ImageUploadWidget folder="Comments" currentUrl={imageUrl} onUploaded={(url) => setImageUrl(url || null)} />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending || !body.trim()}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
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
        <div className="space-y-4">
          {comments.map((comment) => {
            const canDelete = user && (user.id === comment.authorId || user.role === 'Admin');
            return (
              <div key={comment.id} className="bg-white border border-stone-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-stone-800">{comment.authorName}</span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(comment.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => deleteMutation.mutate(comment.id)}
                      disabled={deleteMutation.isPending}
                      className="text-stone-300 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
                {comment.imageUrl && (
                  <img src={comment.imageUrl} alt="Comment attachment" className="max-w-xs rounded-lg border border-stone-200" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};