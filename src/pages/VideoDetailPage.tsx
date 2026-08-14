/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getVideoBySlug, incrementVideoView, deleteVideo } from '../api/videos';
import { ArrowLeft, Eye, ExternalLink, AlertCircle, Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '../store/authStore';

export const VideoDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: video, isLoading, isError } = useQuery({
    queryKey: ['video', slug],
    queryFn: () => getVideoBySlug(slug!),
    enabled: !!slug,
  });

  React.useEffect(() => {
    if (!video) return;
    const key = `viewed-video:${video.slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    incrementVideoView(video.slug).catch(() => {});
  }, [video?.slug]);

  const deleteMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      navigate('/videos');
    },
    onError: (err: any) => {
      alert(err?.detail || 'Failed to delete video.');
    },
  });

  const handleDeleteVideo = () => {
    if (!video) return;
    if (window.confirm(`Delete "${video.title}"? This can't be undone.`)) {
      deleteMutation.mutate(video.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !video) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-stone-300 mx-auto" />
        <h3 className="font-serif text-lg font-bold text-stone-800">Video not found</h3>
        <Link to="/videos" className="text-xs font-bold text-emerald-700 underline">Back to Videos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      <Link to="/videos" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Videos
      </Link>

      <div className="aspect-video w-full rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 shadow-sm">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${video.youTubeVideoId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="space-y-4 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{video.channelName}</span>
          <div className="w-1 h-1 rounded-full bg-stone-300"></div>
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {video.viewCount.toLocaleString()} views
          </span>
        </div>
        <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight leading-tight">{video.title}</h1>
        <a
          href={video.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-emerald-700 transition-colors"
        >
          Watch on YouTube
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          AI Quick Review
        </h3>
        <p className="text-sm text-stone-700 leading-relaxed">{video.aiReview}</p>
      </div>

      {user?.role === 'Admin' && (
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">Admin</h3>
          <button
            onClick={handleDeleteVideo}
            disabled={deleteMutation.isPending}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete this video'}</span>
          </button>
        </div>
      )}
    </div>
  );
};