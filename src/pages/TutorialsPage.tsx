/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getTutorials } from '../api/tutorials';
import { TutorialCard } from '../components/TutorialCard';
import { DifficultyLevel } from '../types/api';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';

const DIFFICULTIES: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

export const TutorialsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const difficultyLevel = (searchParams.get('difficulty') as DifficultyLevel) || undefined;
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

  const { data: tutorialsResult, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['tutorials', difficultyLevel, toolNameParam, searchInput, pageNumber],
    queryFn: () =>
      getTutorials({
        difficultyLevel,
        toolName: toolNameParam || undefined,
        search: searchInput || undefined,
        pageNumber,
        pageSize: 6,
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
    if (newPage < 1 || (tutorialsResult && newPage > tutorialsResult.totalPages)) return;
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...current, page: String(newPage) });
  };

  return (
    <div className="listing-page animate-in fade-in duration-200">
      <div className="listing-header">
        <div>
          <div className="section-kicker">
            <GraduationCap className="w-3.5 h-3.5" />
            Academic Learning Center
          </div>
          <h1 className="editorial-heading editorial-heading--page font-serif">
            Master the <em>Intelligence</em> economy.
          </h1>
          <p className="editorial-lede">
            Structured guides on how to actually use AI tools, from foundations to advanced deployment strategies.
          </p>
        </div>

        {(difficultyLevel || searchInput || toolNameParam) && (
          <button
            onClick={handleResetFilters}
            className="self-start sm:self-center text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100/60 px-3 py-1.5 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear All Filters
          </button>
        )}
      </div>

      <section className="listing-controls">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">
          <Filter className="w-3.5 h-3.5" />
          Find a tutorial
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tool name - e.g. ChatGPT-5"
              value={toolQuery}
              onChange={(e) => setToolQuery(e.target.value)}
              className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
            />
            <GraduationCap className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <button type="submit" className="hidden">Search</button>
          </div>

          <div>
            <select
              value={difficultyLevel || ''}
              onChange={(e) => updateFilters({ difficulty: e.target.value || undefined, tool: toolQuery, search: searchQuery })}
              className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50 text-stone-700"
            >
              <option value="">Any Difficulty</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </form>
      </section>

      {isLoading && !tutorialsResult ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 animate-pulse">
              <div className="w-24 h-4 bg-stone-200 rounded"></div>
              <div className="w-full h-8 bg-stone-200 rounded"></div>
              <div className="w-full h-24 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : !tutorialsResult?.items || tutorialsResult.items.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <GraduationCap className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">No tutorials yet</h3>
          <p className="text-sm text-stone-500">
            Check back soon - this section is just getting started.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${isPlaceholderData ? 'opacity-60' : 'opacity-100'}`}>
            {tutorialsResult.items.map((t) => (
              <TutorialCard key={t.id} tutorial={t} />
            ))}
          </div>

          {tutorialsResult.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 pt-6">
              <span className="text-xs font-medium text-stone-500">
                Page {tutorialsResult.pageNumber} of {tutorialsResult.totalPages} (Total {tutorialsResult.totalCount} items)
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
                  disabled={pageNumber >= tutorialsResult.totalPages}
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
