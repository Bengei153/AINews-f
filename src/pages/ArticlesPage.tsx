/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getArticles } from '../api/articles';
import { getCategories } from '../api/categories';
import { getTags } from '../api/tags';
import { ArticleCard } from '../components/ArticleCard';
import { ArticlePillar } from '../types/api';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

const PILLARS: { value: ArticlePillar; label: string }[] = [
  { value: 'AIForStudents', label: 'AI for Students' },
  { value: 'AIForWork', label: 'AI for Work' },
  { value: 'AINews', label: 'AI News' },
  { value: 'AIToolSpotlight', label: 'AI Tool Spotlight' },
  { value: 'FutureOfAI', label: 'Future of AI' },
];

export const ArticlesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State linked with URL Search Params for bookmarks and reload resilience
  const pillar = (searchParams.get('pillar') as ArticlePillar) || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;
  const tagId = searchParams.get('tagId') || undefined;
  const searchInput = searchParams.get('search') || '';
  const pageNumber = parseInt(searchParams.get('page') || '1', 10);

  // Local state for fast input typing experience
  const [searchQuery, setSearchQuery] = useState(searchInput);

  // Update input field if searchParam changes (e.g. going back)
  useEffect(() => {
    setSearchQuery(searchInput);
  }, [searchInput]);

  // Fetch Categories & Tags for filter selection lists
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  // Fetch paginated, filtered articles list
  const { data: articlesResult, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['articles', pillar, categoryId, tagId, searchInput, pageNumber],
    queryFn: () =>
      getArticles({
        pillar,
        categoryId,
        tagId,
        search: searchInput || undefined,
        pageNumber,
        pageSize: 6, // 6 items per page for tidy desktop layout
      }),
    placeholderData: (previousData) => previousData, // keep prior data while fetching next page
  });

  const updateFilters = (newFilters: Record<string, string | undefined>) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newFilters, page: '1' }; // reset page on filter change
    
    // Clear undefined or empty properties
    Object.keys(merged).forEach((key) => {
      if (!merged[key]) {
        delete merged[key];
      }
    });

    setSearchParams(merged);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchQuery });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (articlesResult && newPage > articlesResult.totalPages)) return;
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...current, page: String(newPage) });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-emerald-800" />
            Curated Briefings Directory
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Browse published digests of technical breakthroughs, reviews, and workflows.
          </p>
        </div>

        {(pillar || categoryId || tagId || searchInput) && (
          <button
            onClick={handleResetFilters}
            className="self-start sm:self-center text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100/60 px-3 py-1.5 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear All Filters
          </button>
        )}
      </div>

      {/* 2. Filters Grid panel */}
      <section className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">
          <Filter className="w-3.5 h-3.5" />
          Refine intelligence search
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Keyword Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search title, summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
              id="search-input"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <button type="submit" className="hidden">Search</button>
          </div>

          {/* Pillar Filter Select */}
          <div>
            <select
              value={pillar || ''}
              onChange={(e) => updateFilters({ pillar: e.target.value || undefined })}
              className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50 text-stone-700"
              id="pillar-select"
            >
              <option value="">All Pillars</option>
              {PILLARS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter Select */}
          <div>
            <select
              value={categoryId || ''}
              onChange={(e) => updateFilters({ categoryId: e.target.value || undefined })}
              className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50 text-stone-700"
              id="category-select"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Filter Select */}
          <div>
            <select
              value={tagId || ''}
              onChange={(e) => updateFilters({ tagId: e.target.value || undefined })}
              className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50 text-stone-700"
              id="tag-select"
            >
              <option value="">All Tags</option>
              {tags?.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.name}
                </option>
              ))}
            </select>
          </div>

        </form>
      </section>

      {/* 3. Article List Grid / Loading states */}
      {isLoading && !articlesResult ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 animate-pulse">
              <div className="w-24 h-4 bg-stone-200 rounded"></div>
              <div className="w-full h-8 bg-stone-200 rounded"></div>
              <div className="w-full h-24 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : !articlesResult?.items || articlesResult.items.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">No matching briefings found</h3>
          <p className="text-sm text-stone-500">
            We couldn't locate any published digests matching your current combination of keywords or filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg"
          >
            View All Briefings
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Main Grid list */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${isPlaceholderData ? 'opacity-60' : 'opacity-100'}`}>
            {articlesResult.items.map((art) => (
              <ArticleCard key={art.id} article={art} />
            ))}
          </div>

          {/* 4. Pagination Navigation footer */}
          {articlesResult.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 pt-6">
              <span className="text-xs font-medium text-stone-500">
                Page {articlesResult.pageNumber} of {articlesResult.totalPages} (Total {articlesResult.totalCount} items)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                  className="p-1.5 border border-stone-200 rounded-md bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  title="Previous page"
                  id="prev-page-btn"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePageChange(pageNumber + 1)}
                  disabled={pageNumber >= articlesResult.totalPages}
                  className="p-1.5 border border-stone-200 rounded-md bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  title="Next page"
                  id="next-page-btn"
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
