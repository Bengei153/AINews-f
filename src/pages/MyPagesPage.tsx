/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyCreatedPages, deleteCreatedPage } from '../api/createdPages';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { PremiumUpsell } from '../components/PremiumUpsell';
import { Plus, Eye, Trash2, ExternalLink, Loader2 } from 'lucide-react';

export const MyPagesPage: React.FC = () => {
  const { isPremium, isLoading: isLoadingPremium } = usePremiumStatus();
  const queryClient = useQueryClient();

  const { data: pages, isLoading } = useQuery({
    queryKey: ['my-pages'],
    queryFn: getMyCreatedPages,
    enabled: isPremium,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCreatedPage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-pages'] }),
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This can't be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoadingPremium) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isPremium) {
    return <PremiumUpsell context="build a project page" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-stone-900">My Pages</h1>
        <Link
          to="/create"
          className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
        </div>
      ) : !pages || pages.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm text-stone-500">You haven't built a page yet.</p>
          <Link to="/create" className="text-sm font-bold text-emerald-700 underline">Start your first one</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-stone-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {page.coverImageUrl ? (
                  <img src={page.coverImageUrl} alt="" className="w-12 h-12 object-cover rounded-lg border border-stone-200 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-stone-100 border border-stone-200 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/create/${page.id}`} className="font-bold text-sm text-stone-900 truncate hover:underline">
                      {page.title}
                    </Link>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                        page.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {page.status}
                    </span>
                  </div>
                  {page.status === 'Published' && (
                    <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                      <Eye className="w-3 h-3" />
                      {page.viewCount} view{page.viewCount === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {page.status === 'Published' && (
                  <Link
                    to={`/projects/${page.slug}`}
                    target="_blank"
                    className="p-2 rounded-lg text-stone-500 hover:bg-stone-50 hover:text-emerald-700 transition-colors"
                    title="View live"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                <button
                  onClick={() => handleDelete(page.id, page.title)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
