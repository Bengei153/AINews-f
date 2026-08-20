/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getShowcasePost, deleteShowcasePost } from '../api/showcase';
import { ShowcaseReactionBar } from '../components/ShowcaseReactionBar';
import { ShowcaseCommentSection } from '../components/ShowcaseCommentSection';
import { ArrowLeft, Wrench, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../store/authStore';

export const ShowcasePostDetailPage: React.FC = () => {
  const { showcasePostId } = useParams<{ showcasePostId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['showcase-post', showcasePostId],
    queryFn: () => getShowcasePost(showcasePostId!),
    enabled: !!showcasePostId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShowcasePost,
    onSuccess: () => {
      navigate('/showcase');
    },
    onError: (err: any) => {
      alert(err?.detail || 'Failed to delete post.');
    },
  });

  const handleDeletePost = () => {
    if (!post) return;
    if (window.confirm(`Delete "${post.title}"? This can't be undone.`)) {
      deleteMutation.mutate(post.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-stone-300 mx-auto" />
        <h3 className="font-serif text-lg font-bold text-stone-800">Project not found</h3>
        <Link to="/showcase" className="text-xs font-bold text-emerald-700 underline">Back to Showcase</Link>
      </div>
    );
  }

  const canDelete = user && (user.id === post.authorId || user.role === 'Admin');

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      <Link to="/showcase" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Showcase
      </Link>

      {post.imageUrl && (
        <img src={post.imageUrl} alt={post.title} className="w-full h-64 object-cover rounded-2xl border border-stone-200" />
      )}

      <div className="space-y-4 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
              {post.authorName.charAt(0).toUpperCase()}
            </div>
            {post.authorName}
          </span>
          {post.toolsUsed && (
            <>
              <div className="w-1 h-1 rounded-full bg-stone-300"></div>
              <Link
                to={`/showcase?tool=${encodeURIComponent(post.toolsUsed)}`}
                className="text-xs font-bold text-stone-500 hover:text-emerald-700 flex items-center gap-1 transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                {post.toolsUsed}
              </Link>
            </>
          )}
        </div>
        <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight leading-tight">{post.title}</h1>
        <p className="text-base text-stone-600 leading-relaxed whitespace-pre-wrap">{post.description}</p>
      </div>

      <ShowcaseReactionBar showcasePostId={post.id} />

      {canDelete && (
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">
            {user?.role === 'Admin' && user.id !== post.authorId ? 'Admin' : 'Your Post'}
          </h3>
          <button
            onClick={handleDeletePost}
            disabled={deleteMutation.isPending}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete this post'}</span>
          </button>
        </div>
      )}

      <ShowcaseCommentSection showcasePostId={post.id} />
    </div>
  );
};