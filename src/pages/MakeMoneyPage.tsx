/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEarnStories } from '../api/earnStories';
import { EarnStoryCard } from '../components/EarnStoryCard';
import { AlertCircle, Banknote, Search } from 'lucide-react';

export const MakeMoneyPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const { data: stories, isLoading } = useQuery({
    queryKey: ['earn-stories'],
    queryFn: () => getEarnStories(),
  });

  // Categories come from an AI's own judgment per video, not a fixed list —
  // so the filter chips are built from whatever categories are actually in
  // use right now, instead of a hardcoded set that could drift out of sync.
  const categories = React.useMemo(() => {
    if (!stories) return [];
    return Array.from(new Set(stories.map((s) => s.category))).sort();
  }, [stories]);

  const filteredStories = React.useMemo(() => {
    if (!stories) return [];
    const q = searchQuery.toLowerCase().trim();

    return stories.filter((story) => {
      const matchesCategory = !activeCategory || story.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      const haystack = `${story.title} ${story.whatTheyBuilt} ${story.toolsUsedText} ${story.channelName}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [stories, searchQuery, activeCategory]);

  return (
    <div className="listing-page animate-in fade-in duration-200">
      <div className="listing-header">
        <div className="space-y-3">
          <div className="section-kicker">
            <Banknote className="w-3.5 h-3.5" />
            Make Money with AI
          </div>
          <h1 className="editorial-heading editorial-heading--page font-serif">
            Real stories of what people <em>built</em> with AI.
          </h1>
          <p className="editorial-lede">
            Sourced from real YouTube videos, with a detailed AI-written breakdown of what each person actually did.
            Earnings shown are the creator's own claims, not verified figures — read the "Our Take" section on each
            story for an honest, skeptical read before you try anything yourself.
          </p>
        </div>
      </div>

      <section className="listing-controls">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">
          <Search className="w-3.5 h-3.5" />
          Find a story
        </div>

        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search stories, tools, or channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
        </div>

        {categories.length > 0 && (
          <div className="facet-row" role="list" aria-label="Filter by category">
            <button
              type="button"
              onClick={() => setActiveCategory('')}
              className={activeCategory === '' ? 'facet-chip facet-chip--active' : 'facet-chip'}
            >
              All stories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={activeCategory === category ? 'facet-chip facet-chip--active' : 'facet-chip'}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 animate-pulse">
              <div className="w-full h-32 bg-stone-200 rounded"></div>
              <div className="w-full h-6 bg-stone-200 rounded"></div>
              <div className="w-full h-16 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <AlertCircle className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">
            {stories && stories.length > 0 ? 'No matching stories found' : 'No stories published yet'}
          </h3>
          <p className="text-sm text-stone-500">
            {stories && stories.length > 0
              ? 'Try a different search term or category.'
              : "Check back soon - this section is just getting started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <EarnStoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
};
