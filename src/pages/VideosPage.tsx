/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getVideos } from '../api/videos';
import { VideoCard } from '../components/VideoCard';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';

export const VideosPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchInput = searchParams.get('search') || '';
  const pageNumber = parseInt(searchParams.get('page') || '1', 10);

  const [searchQuery, setSearchQuery] = useState(searchInput);

  useEffect(() => {
    setSearchQuery(searchInput);
  }, [searchInput]);

  const { data: videosResult, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['videos', searchInput, pageNumber],
    queryFn: () =>
      getVideos({
        search: searchInput || undefined,
        pageNumber,
        pageSize: 6,
      }),
    placeholderData: (previousData) => previousData,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (videosResult && newPage > videosResult.totalPages)) return;
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...current, page: String(newPage) });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <PlayCircle className="w-8 h-8 text-emerald-800" />
            Videos
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            The latest AI videos worth watching, with a quick AI-written review before you press play.
          </p>
        </div>

        {searchInput && (
          <button
            onClick={handleResetFilters}
            className="self-start sm:self-center text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100/60 px-3 py-1.5 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear Search
          </button>
        )}
      </div>

      <section className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">
          <Filter className="w-3.5 h-3.5" />
          Find a video
        </div>

        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <input
            type="text"
            placeholder="Search videos or channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <button type="submit" className="hidden">Search</button>
        </form>
      </section>

      {isLoading && !videosResult ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 animate-pulse">
              <div className="w-full h-32 bg-stone-200 rounded"></div>
              <div className="w-full h-6 bg-stone-200 rounded"></div>
              <div className="w-full h-16 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : !videosResult?.items || videosResult.items.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <PlayCircle className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">No videos yet</h3>
          <p className="text-sm text-stone-500">
            Check back soon — this section is just getting started.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${isPlaceholderData ? 'opacity-60' : 'opacity-100'}`}>
            {videosResult.items.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>

          {videosResult.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 pt-6">
              <span className="text-xs font-medium text-stone-500">
                Page {videosResult.pageNumber} of {videosResult.totalPages} (Total {videosResult.totalCount} items)
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
                  disabled={pageNumber >= videosResult.totalPages}
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