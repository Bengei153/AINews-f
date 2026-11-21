/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyCreatedPages, deleteCreatedPage, unpublishCreatedPage, MyCreatedPage } from '../api/createdPages';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { PremiumUpsell } from '../components/PremiumUpsell';
import { Plus, Eye, Trash2, ExternalLink, Loader2, Pencil, EyeOff, AlertCircle } from 'lucide-react';

// A member's own projects. Everything they can do to one is a visible button: Edit, View live, Unpublish, Delete.
// Taking a project down or deleting it never needs Premium (a member whose Premium has ended must still be able to
// remove their own work); editing and publishing do, so those stay locked until they renew.
export const MyPagesPage: React.FC = () => {
  const { isPremium, isLoading: isLoadingPremium } = usePremiumStatus();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: pages, isLoading } = useQuery({
    queryKey: ['my-pages'],
    queryFn: getMyCreatedPages,
  });

  const refreshLists = () => {
    queryClient.invalidateQueries({ queryKey: ['my-pages'] });
    queryClient.invalidateQueries({ queryKey: ['created-pages'] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteCreatedPage,
    onSuccess: refreshLists,
    onError: (err: any) => setError(err?.detail || 'Could not delete that project. Please try again.'),
  });

  const unpublishMutation = useMutation({
    mutationFn: unpublishCreatedPage,
    onSuccess: refreshLists,
    onError: (err: any) => setError(err?.detail || 'Could not unpublish that project. Please try again.'),
  });

  const handleDelete = (page: MyCreatedPage) => {
    const warning =
      page.status === 'Published'
        ? `Delete "${page.title}" for good? It will also disappear from the Projects page, and this can't be undone.`
        : `Delete "${page.title}" for good? This can't be undone.`;
    if (window.confirm(warning)) {
      setError(null);
      deleteMutation.mutate(page.id);
    }
  };

  const handleUnpublish = (page: MyCreatedPage) => {
    if (window.confirm(`Take "${page.title}" off the Projects page? Nothing is lost, and you can publish it again any time.`)) {
      setError(null);
      unpublishMutation.mutate(page.id);
    }
  };

  if (isLoadingPremium || isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  const hasPages = !!pages && pages.length > 0;

  // No Premium and nothing to manage: the only thing to offer is Premium.
  if (!isPremium && !hasPages) {
    return <PremiumUpsell context="build a project page" />;
  }

  const busyId = deleteMutation.isPending ? deleteMutation.variables : unpublishMutation.isPending ? unpublishMutation.variables : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-stone-900">My Projects</h1>
        {isPremium && (
          <Link
            to="/create"
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project
          </Link>
        )}
      </div>

      {!isPremium && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
          Your Premium has ended. You can still unpublish or delete your projects here. To edit them or publish new ones,{' '}
          <Link to="/premium" className="font-bold underline">
            renew Premium
          </Link>
          .
        </div>
      )}

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!hasPages ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm text-stone-500">You haven't built a page yet.</p>
          <Link to="/create" className="text-sm font-bold text-emerald-700 underline">Start your first one</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {pages!.map((page) => {
            const busy = busyId === page.id;
            return (
              <div
                key={page.id}
                className={`bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-stone-300 transition-colors ${busy ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {page.coverImageUrl ? (
                    <img src={page.coverImageUrl} alt="" className="w-12 h-12 object-cover rounded-lg border border-stone-200 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-stone-100 border border-stone-200 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isPremium ? (
                        <Link to={`/create/${page.id}`} className="font-bold text-sm text-stone-900 truncate hover:underline">
                          {page.title}
                        </Link>
                      ) : (
                        <span className="font-bold text-sm text-stone-900 truncate">{page.title}</span>
                      )}
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

                <div className="flex items-center gap-1 shrink-0">
                  {busy && <Loader2 className="w-4 h-4 animate-spin text-stone-400" aria-label="Working" />}
                  {isPremium && (
                    <Link
                      to={`/create/${page.id}`}
                      className="p-2 rounded-lg text-stone-600 hover:bg-stone-50 hover:text-emerald-700 transition-colors"
                      title="Edit"
                      aria-label={`Edit ${page.title}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {page.status === 'Published' && (
                    <>
                      <Link
                        to={`/projects/${page.slug}`}
                        target="_blank"
                        className="p-2 rounded-lg text-stone-500 hover:bg-stone-50 hover:text-emerald-700 transition-colors"
                        title="View live"
                        aria-label={`View ${page.title} live`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleUnpublish(page)}
                        disabled={busy}
                        className="p-2 rounded-lg text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-colors cursor-pointer disabled:cursor-default"
                        title="Unpublish (take off the Projects page)"
                        aria-label={`Unpublish ${page.title}`}
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(page)}
                    disabled={busy}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:cursor-default"
                    title="Delete"
                    aria-label={`Delete ${page.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
