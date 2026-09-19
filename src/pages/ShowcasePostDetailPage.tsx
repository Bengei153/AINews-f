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
import { ArrowLeft, Wrench, AlertCircle, Trash2, ShieldCheck, Link2 } from 'lucide-react';
import { useAuth } from '../store/authStore';
import { SHARED_CONTENT_PATH } from '../components/ShowcaseCard';

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
      <div className="empty-state empty-state--large">
        <AlertCircle className="w-12 h-12" />
        <p>Project not found</p>
        <Link to="/showcase" className="text-link">Back to Showcase</Link>
      </div>
    );
  }

  const canDelete = user && (user.id === post.authorId || user.role === 'Admin');

  const mainContent = (
    <>
      {post.imageUrl && (
        <img src={post.imageUrl} alt={post.title} className="w-full h-64 object-cover rounded-2xl border border-stone-200" />
      )}

      <div className="space-y-4 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
            <div className="comment-item__avatar">
              {post.authorName.charAt(0).toUpperCase()}
            </div>
            {post.authorName}
          </span>
          {post.toolsUsed && (
            <>
              <div className="w-1 h-1 rounded-full bg-stone-300"></div>
              <Link to={`/showcase?tool=${encodeURIComponent(post.toolsUsed)}`} className="text-link">
                <Wrench className="w-3.5 h-3.5" />
                {post.toolsUsed}
              </Link>
            </>
          )}
        </div>
        <h1 className="editorial-heading editorial-heading--page font-serif" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.8rem)' }}>
          {post.title}
        </h1>
        <p className="editorial-lede">{post.description}</p>
        {post.sharedContentType && post.sharedContentTitle && (
          (() => {
            const pathSegment = SHARED_CONTENT_PATH[post.sharedContentType];
            const chipContent = (
              <>
                <Link2 className="w-3.5 h-3.5" />
                Sharing: {post.sharedContentTitle}
              </>
            );
            return pathSegment && post.sharedContentSlug ? (
              <Link to={`/${pathSegment}/${post.sharedContentSlug}`} className="shared-content-chip">
                {chipContent}
              </Link>
            ) : (
              <span className="shared-content-chip">{chipContent}</span>
            );
          })()
        )}
      </div>

      <ShowcaseReactionBar showcasePostId={post.id} />

      <ShowcaseCommentSection showcasePostId={post.id} />
    </>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      <Link to="/showcase" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Showcase
      </Link>

      {canDelete ? (
        <div className="content-layout">
          <div className="content-layout__main">{mainContent}</div>
          <aside className="content-layout__aside">
            <section className="sidebar-panel">
              <h2 className="font-serif">
                <ShieldCheck className="w-4 h-4" />
                {user?.role === 'Admin' && user.id !== post.authorId ? 'Admin' : 'Your Post'}
              </h2>
              <button
                onClick={handleDeletePost}
                disabled={deleteMutation.isPending}
                className="btn-danger w-full"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete this post'}</span>
              </button>
            </section>
          </aside>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-8">{mainContent}</div>
      )}
    </div>
  );
};