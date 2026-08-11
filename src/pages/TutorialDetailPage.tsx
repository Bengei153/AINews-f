/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { getTutorialBySlug, incrementTutorialView, deleteTutorial } from '../api/tutorials';
import { ArrowLeft, Eye, GraduationCap, AlertCircle, Trash2 } from 'lucide-react';
import { DifficultyLevel } from '../types/api';
import { useAuth } from '../store/authStore';

const DIFFICULTY_STYLES: Record<DifficultyLevel, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const TutorialDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: tutorial, isLoading, isError } = useQuery({
    queryKey: ['tutorial', slug],
    queryFn: () => getTutorialBySlug(slug!),
    enabled: !!slug,
  });

  React.useEffect(() => {
    if (!tutorial) return;
    const key = `viewed-tutorial:${tutorial.slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    incrementTutorialView(tutorial.slug).catch(() => {});
  }, [tutorial?.slug]);

  const deleteMutation = useMutation({
    mutationFn: deleteTutorial,
    onSuccess: () => {
      navigate('/tutorials');
    },
    onError: (err: any) => {
      alert(err?.detail || 'Failed to delete tutorial.');
    },
  });

  const handleDeleteTutorial = () => {
    if (!tutorial) return;
    if (window.confirm(`Delete "${tutorial.title}"? This can't be undone.`)) {
      deleteMutation.mutate(tutorial.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !tutorial) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-stone-300 mx-auto" />
        <h3 className="font-serif text-lg font-bold text-stone-800">Tutorial not found</h3>
        <Link to="/tutorials" className="text-xs font-bold text-emerald-700 underline">Back to Tutorials</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      <Link to="/tutorials" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Tutorials
      </Link>

      {tutorial.coverImageUrl && (
        <img src={tutorial.coverImageUrl} alt={tutorial.title} className="w-full h-64 object-cover rounded-2xl border border-stone-200" />
      )}

      <div className="space-y-4 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${DIFFICULTY_STYLES[tutorial.difficultyLevel]}`}>
            {tutorial.difficultyLevel}
          </span>
          <Link
            to={`/tutorials?tool=${encodeURIComponent(tutorial.toolName)}`}
            className="text-xs font-bold text-stone-500 hover:text-emerald-700 flex items-center gap-1 transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            {tutorial.toolName}
          </Link>
          <div className="w-1 h-1 rounded-full bg-stone-300"></div>
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {tutorial.viewCount.toLocaleString()} views
          </span>
        </div>
        <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight leading-tight">{tutorial.title}</h1>
        <p className="text-base text-stone-600 leading-relaxed">{tutorial.summary}</p>
      </div>

      <article className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-sm prose-p:leading-relaxed prose-p:text-stone-700 space-y-5">
        <ReactMarkdown>{tutorial.body}</ReactMarkdown>
      </article>

      {user?.role === 'Admin' && (
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">Admin</h3>
          <button
            onClick={handleDeleteTutorial}
            disabled={deleteMutation.isPending}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete this tutorial'}</span>
          </button>
        </div>
      )}
    </div>
  );
};