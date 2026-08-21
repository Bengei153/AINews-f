/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAiTools } from '../api/aiTools';
import { ToolCard } from '../components/ToolCard';
import { AlertCircle, ArrowRight, Award, Search, ShieldCheck, Sparkles, Zap } from 'lucide-react';

const FACETS = ['All', 'Generative AI', 'Analysis', 'DevOps', 'Creative', 'Research', 'Infrastructure'];

export const ToolsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFacet, setActiveFacet] = useState('All');

  const { data: tools, isLoading } = useQuery({
    queryKey: ['ai-tools'],
    queryFn: () => getAiTools(false),
  });

  const filteredTools = React.useMemo(() => {
    if (!tools) return [];
    const q = searchQuery.toLowerCase().trim();
    const facet = activeFacet === 'All' ? '' : activeFacet.toLowerCase();

    return tools.filter((tool) => {
      const name = tool.name.toLowerCase();
      const desc = tool.description.toLowerCase();
      const tags = tool.tags.toLowerCase();
      const matchesSearch = !q || name.includes(q) || desc.includes(q) || tags.includes(q);
      const matchesFacet = !facet || name.includes(facet) || desc.includes(facet) || tags.includes(facet);
      return matchesSearch && matchesFacet;
    });
  }, [tools, searchQuery, activeFacet]);

  const { featuredTool, standardTools } = React.useMemo(() => {
    if (!filteredTools) return { featuredTool: undefined, standardTools: [] };
    const featured = filteredTools.find((t) => t.isFeaturedToday);
    const standard = filteredTools.filter((t) => !t.isFeaturedToday);
    return { featuredTool: featured, standardTools: standard };
  }, [filteredTools]);

  return (
    <div className="directory-page animate-in fade-in duration-200">
      <section className="directory-hero">
        <div>
          <div className="section-kicker">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Intelligence
          </div>
          <h1 className="editorial-heading editorial-heading--page font-serif">
            AI Directory <em>Spotlight</em>
          </h1>
          <p className="editorial-lede">
            Discover a vetted database of artificial intelligence tools built for students, developers, creators, and technical teams.
          </p>
          <div className="hero-stats hero-stats--inline">
            <div>
              <strong>120+</strong>
              <span>Verified tools</span>
            </div>
            <div>
              <strong>1.4k</strong>
              <span>Weekly submissions</span>
            </div>
          </div>
        </div>
        <div className="directory-hero__proof">
          <div>
            <ShieldCheck className="w-5 h-5" />
            <span>
              <strong>Vetted Accuracy</strong>
              Every entry is checked for practical utility.
            </span>
          </div>
          <div>
            <Zap className="w-5 h-5" />
            <span>
              <strong>Real-time Updates</strong>
              Pricing and model changes are reviewed frequently.
            </span>
          </div>
        </div>
      </section>

      <section className="directory-controls">
        <div className="search-shell">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search by tool name, capability, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="tool-search-input"
          />
        </div>
        <div className="facet-row" role="list" aria-label="Tool categories">
          {FACETS.map((facet) => (
            <button
              key={facet}
              type="button"
              onClick={() => setActiveFacet(facet)}
              className={activeFacet === facet ? 'facet-chip facet-chip--active' : 'facet-chip'}
            >
              {facet}
            </button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card skeleton-card--tall animate-pulse">
              <div className="w-1/2 h-6 bg-stone-200 rounded"></div>
              <div className="w-full h-16 bg-stone-200 rounded"></div>
              <div className="w-1/3 h-4 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="empty-state empty-state--large">
          <AlertCircle className="w-12 h-12" />
          <p>No matching tools found</p>
          <span>
            We could not find any curated resources for <strong>{searchQuery || activeFacet}</strong>.
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveFacet('All');
            }}
            className="btn-secondary"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="directory-results">
          {featuredTool && (
            <section className="content-section">
              <div className="section-heading-row">
                <h2 className="font-serif">
                  <Award className="w-5 h-5" />
                  Featured Tool of the Day
                </h2>
              </div>
              <div className="featured-tool-wrap">
                <ToolCard tool={featuredTool} />
              </div>
            </section>
          )}

          <section className="content-section">
            <div className="section-heading-row">
              <h2 className="font-serif">Curated Catalog</h2>
              <span className="result-count">{standardTools.length} items</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {standardTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        </div>
      )}

      <section className="metric-band">
        <div>
          <span>Editorial Trust</span>
          <strong>100%</strong>
          <p>Every tool undergoes a testing cycle before listing.</p>
        </div>
        <div>
          <span>Global Reach</span>
          <strong>25+</strong>
          <p>Coverage gathered from research hubs worldwide.</p>
        </div>
        <div>
          <span>Freshness Index</span>
          <strong>Daily</strong>
          <p>Catalog entries are reviewed for pricing and model shifts.</p>
        </div>
        <div>
          <span>Model Variance</span>
          <strong>LLM+</strong>
          <p>Includes language, diffusion, and symbolic reasoning systems.</p>
        </div>
      </section>

      <section className="dark-cta-panel dark-cta-panel--center">
        <h2 className="font-serif">
          Stay Informed on the <em>Frontier</em>
        </h2>
        <p>Join developers receiving our weekly digest of curated tools, benchmark reports, and deployment strategies.</p>
        <a href="#tool-search-input" className="btn-light">
          Search the Directory
          <ArrowRight className="w-4 h-4" />
        </a>
      </section>
    </div>
  );
};
