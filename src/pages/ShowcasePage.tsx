/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { getShowcasePosts } from '../api/showcase';
import { ShowcaseCard } from '../components/ShowcaseCard';
import { useAuth } from '../store/authStore';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Sparkles, Plus } from 'lucide-react';

export const ShowcasePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const toolNameParam = searchParams.get('tool') || '';
  const searchInput = searchParams.get('search') || '';
  const pageNumber = parseInt(searchParams.get('page') || '1', 10);

  const [searchQuery, setSearchQuery] = useState(searchInput);
  const [toolQuery, setToolQuery] = useState(toolNameParam);

  useEffect(() => {
    setSearchQuery(searchInput);
  }, [searchInput]);

  useEffect(() => {
    setToolQuery(toolNameParam);
  }, [toolNameParam]);

  const { data: postsResult, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['showcase-posts', toolNameParam, searchInput, pageNumber],
    queryFn: () =>
      getShowcasePosts({
        toolName: toolNameParam || undefined,
        search: searchInput || undefined,
        pageNumber,
        pageSize: 9,
      }),
    placeholderData: (previousData) => previousData,
  });

  const updateFilters = (newFilters: Record<string, string | undefined>) => {
    const current = Object.fromEntries(searchParams.entries());
    const combined: Record<string, string | undefined> = { ...current, ...newFilters, page: '1' };
    const merged: Record<string, string> = {};
    Object.entries(combined).forEach(([key, value]) => {
      if (value) merged[key] = value;
    });
    setSearchParams(merged);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchQuery, tool: toolQuery });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setToolQuery('');
    setSearchParams({});
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (postsResult && newPage > postsResult.totalPages)) return;
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...current, page: String(newPage) });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-emerald-800" />
            Student Showcase
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Projects the community built with AI — see what's possible, and share your own.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {(searchInput || toolNameParam) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100/60 px-3 py-1.5 rounded-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
          {user ? (
            <Link
              to="/showcase/new"
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Share your project
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Sign in to share
            </Link>
          )}
        </div>
      </div>

      <section className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">
          <Filter className="w-3.5 h-3.5" />
          Find a project
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tool used — e.g. Claude, Midjourney"
              value={toolQuery}
              onChange={(e) => setToolQuery(e.target.value)}
              className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
            />
            <Sparkles className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <button type="submit" className="hidden">Search</button>
          </div>
        </form>
      </section>

      {isLoading && !postsResult ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 animate-pulse">
              <div className="w-24 h-4 bg-stone-200 rounded"></div>
              <div className="w-full h-8 bg-stone-200 rounded"></div>
              <div className="w-full h-24 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : !postsResult?.items || postsResult.items.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <Sparkles className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">No projects yet</h3>
          <p className="text-sm text-stone-500">
            Be the first to share what you've built with AI.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${isPlaceholderData ? 'opacity-60' : 'opacity-100'}`}>
            {postsResult.items.map((p) => (
              <ShowcaseCard key={p.id} post={p} />
            ))}
          </div>

          {postsResult.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 pt-6">
              <span className="text-xs font-medium text-stone-500">
                Page {postsResult.pageNumber} of {postsResult.totalPages} (Total {postsResult.totalCount} items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                  className="p-1.5 border border-stone-200 rounded-md bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePageChange(pageNumber + 1)}
                  disabled={pageNumber >= postsResult.totalPages}
                  className="p-1.5 border border-stone-200 rounded-md bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};