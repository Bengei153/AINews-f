/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAiTools } from '../api/aiTools';
import { ToolCard } from '../components/ToolCard';
import { Award, Search, Sparkles, AlertCircle } from 'lucide-react';

export const ToolsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch full directory of AI tools
  const { data: tools, isLoading } = useQuery({
    queryKey: ['ai-tools'],
    queryFn: () => getAiTools(false), // Fetch all
  });

  // Client-side search matching against name, tags, and description
  const filteredTools = React.useMemo(() => {
    if (!tools) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tools;

    return tools.filter((tool) => {
      const name = tool.name.toLowerCase();
      const desc = tool.description.toLowerCase();
      const tags = tool.tags.toLowerCase();
      return name.includes(q) || desc.includes(q) || tags.includes(q);
    });
  }, [tools, searchQuery]);

  // Featured and regular split for visual emphasis
  const { featuredTool, standardTools } = React.useMemo(() => {
    if (!filteredTools) return { featuredTool: undefined, standardTools: [] };
    const featured = filteredTools.find((t) => t.isFeaturedToday);
    const standard = filteredTools.filter((t) => !t.isFeaturedToday);
    return { featuredTool: featured, standardTools: standard };
  }, [filteredTools]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Page Header */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-emerald-800" />
          AI Directory Spotlight
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Explore vetted artificial intelligence tools curated for students, developers, and creators.
        </p>
      </div>

      {/* 2. Interactive Search Panel */}
      <section className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by tool name, tags (e.g. coding), or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
            id="tool-search-input"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
        </div>
      </section>

      {/* 3. Catalog Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 animate-pulse">
              <div className="w-1/2 h-6 bg-stone-200 rounded"></div>
              <div className="w-full h-16 bg-stone-200 rounded"></div>
              <div className="w-1/3 h-4 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <AlertCircle className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">No matching tools found</h3>
          <p className="text-sm text-stone-500">
            We couldn't find any curated resources that fit your search query: <span className="font-mono font-bold text-stone-700">"{searchQuery}"</span>.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Highlight Featured Spotlight first if it matches and search isn't very narrow */}
          {featuredTool && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold tracking-wider uppercase text-emerald-800 flex items-center gap-1">
                <Award className="w-4 h-4" />
                Featured Tool of the Day
              </h2>
              <div className="max-w-2xl">
                <ToolCard tool={featuredTool} />
              </div>
            </section>
          )}

          {/* Directory Grid */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold tracking-wider uppercase text-stone-400">
              Curated Catalog ({standardTools.length} items)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {standardTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>

        </div>
      )}

    </div>
  );
};
