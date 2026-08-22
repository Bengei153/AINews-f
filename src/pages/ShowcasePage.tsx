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
    <div className="listing-page animate-in fade-in duration-200">
      <div className="listing-header">
        <div>
          <div className="section-kicker">
            <Sparkles className="w-3.5 h-3.5" />
            Community Projects
          </div>
          <h1 className="editorial-heading editorial-heading--page font-serif">
            Student <em>Showcase</em>
          </h1>
          <p className="editorial-lede">
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
            <Link to="/showcase/new" className="btn-primary btn-primary--small">
              <Plus className="w-3.5 h-3.5" />
              Share your project
            </Link>
          ) : (
            <Link to="/login" className="btn-secondary btn-secondary--small">
              Sign in to share
            </Link>
          )}
        </div>
      </div>

      <section className="listing-controls">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">
          <Filter className="w-3.5 h-3.5" />
          Find a project
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="search-shell">
            <Sparkles className="w-4 h-4" />
            <input
              type="text"
              placeholder="Tool used — e.g. Claude, Midjourney"
              value={toolQuery}
              onChange={(e) => setToolQuery(e.target.value)}
            />
          </div>

          <div className="search-shell">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="hidden">Search</button>
          </div>
        </form>
      </section>

      {isLoading && !postsResult ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card skeleton-card--tall animate-pulse">
              <div className="w-24 h-4 bg-stone-200 rounded"></div>
              <div className="w-full h-8 bg-stone-200 rounded"></div>
              <div className="w-full h-24 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : !postsResult?.items || postsResult.items.length === 0 ? (
        <div className="empty-state empty-state--large">
          <Sparkles className="w-12 h-12" />
          <p>No projects yet</p>
          <span>Be the first to share what you've built with AI.</span>
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
              <span className="result-count">
                Page {postsResult.pageNumber} of {postsResult.totalPages} (Total {postsResult.totalCount} items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                  className="icon-button"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePageChange(pageNumber + 1)}
                  disabled={pageNumber >= postsResult.totalPages}
                  className="icon-button"
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