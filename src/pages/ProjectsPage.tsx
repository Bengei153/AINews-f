/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCreatedPages } from '../api/createdPages';
import { CreatedPageCard } from '../components/CreatedPageCard';
import { Hammer, AlertCircle, Sparkles } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('');

  const { data: pages, isLoading } = useQuery({
    queryKey: ['created-pages'],
    queryFn: () => getCreatedPages(),
  });

  const categories = React.useMemo(() => {
    if (!pages) return [];
    return Array.from(new Set(pages.map((p) => p.category))).sort();
  }, [pages]);

  const filteredPages = React.useMemo(() => {
    if (!pages) return [];
    return activeCategory ? pages.filter((p) => p.category === activeCategory) : pages;
  }, [pages, activeCategory]);

  return (
    <div className="listing-page animate-in fade-in duration-200">
      <div className="listing-header">
        <div className="space-y-3">
          <div className="section-kicker">
            <Hammer className="w-3.5 h-3.5" />
            Projects
          </div>
          <h1 className="editorial-heading editorial-heading--page font-serif">What people built with AI.</h1>
          <p className="editorial-lede">
            Real things members made — download them, open the link, or connect your own backend to try them live.
          </p>
        </div>
        <Link
          to="/create"
          className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Build your own
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="facet-row" role="list" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setActiveCategory('')}
            className={activeCategory === '' ? 'facet-chip facet-chip--active' : 'facet-chip'}
          >
            All projects
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
      ) : filteredPages.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <AlertCircle className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">
            {pages && pages.length > 0 ? 'No projects in this category yet' : 'No projects published yet'}
          </h3>
          <p className="text-sm text-stone-500">Be the first to show off what you built.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map((page) => (
            <CreatedPageCard key={page.id} page={page} />
          ))}
        </div>
      )}
    </div>
  );
};
