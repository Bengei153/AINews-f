/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAiTools } from '../api/aiTools';
import { getTutorials } from '../api/tutorials';
import { ToolCard } from '../components/ToolCard';
import { TutorialCard } from '../components/TutorialCard';
import { AlertCircle, ArrowRight, Award, GraduationCap, Search, ShieldCheck, Sparkles, Zap } from 'lucide-react';

const GOAL_FILTERS = [
  { label: 'Explore all', facet: '' },
  { label: 'Write & brainstorm', facet: 'Generative AI' },
  { label: 'Study & research', facet: 'Research' },
  { label: 'Create visuals', facet: 'Creative' },
  { label: 'Work with data', facet: 'Analysis' },
  { label: 'Build & automate', facet: 'DevOps' },
];

export const ToolsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFacet, setActiveFacet] = useState('');
  const activeGoalLabel = GOAL_FILTERS.find((goal) => goal.facet === activeFacet)?.label ?? 'your search';

  const { data: tools, isLoading } = useQuery({
    queryKey: ['ai-tools'],
    queryFn: () => getAiTools(false),
  });

  const { data: tutorialsResult, isLoading: areGuidesLoading } = useQuery({
    queryKey: ['tool-guides'],
    queryFn: () => getTutorials({ pageNumber: 1, pageSize: 3 }),
  });

  const filteredTools = React.useMemo(() => {
    if (!tools) return [];
    const q = searchQuery.toLowerCase().trim();
    const facet = activeFacet.toLowerCase();

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
            Start with your goal
          </div>
          <h1 className="editorial-heading editorial-heading--page font-serif">
            Find an AI tool for what you want to <em>do.</em>
          </h1>
          <p className="editorial-lede">
            Explore approachable tools for writing, learning, creating, organizing, and building. No technical background required.
          </p>
          <div className="hero-stats hero-stats--inline">
          <div>
            <strong>Choose a goal</strong>
            <span>Start with what you need</span>
          </div>
          <div>
            <strong>Try one tool</strong>
            <span>Learn as you go</span>
            </div>
          </div>
        </div>
        <div className="directory-hero__proof">
          <div>
            <ShieldCheck className="w-5 h-5" />
            <span>
              <strong>Clear starting points</strong>
              Pick a tool based on the outcome you want, not unfamiliar jargon.
            </span>
          </div>
          <div>
            <Zap className="w-5 h-5" />
            <span>
              <strong>Practical choices</strong>
              Each listing helps you understand what a tool is useful for.
            </span>
          </div>
        </div>
      </section>

      <section className="directory-controls">
        <div className="search-shell">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search a goal, task, or tool name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="tool-search-input"
          />
        </div>
        <div className="facet-row" role="list" aria-label="What do you want help with?">
          {GOAL_FILTERS.map(({ label, facet }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveFacet(facet)}
              className={activeFacet === facet ? 'facet-chip facet-chip--active' : 'facet-chip'}
            >
              {label}
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
            We could not find any curated resources for <strong>{searchQuery || activeGoalLabel}</strong>.
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveFacet('');
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

      <section className="content-section">
        <div className="section-heading-row">
          <div>
            <h2 className="font-serif">
              <GraduationCap className="w-5 h-5" />
              Practical guides
            </h2>
            <p className="muted-copy">Simple walkthroughs that help you get useful results from a tool.</p>
          </div>
        </div>

        {areGuidesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton-card skeleton-card--tall animate-pulse" />
            ))}
          </div>
        ) : !tutorialsResult?.items?.length ? (
          <div className="empty-state">
            <GraduationCap className="w-8 h-8" />
            <p>Guides are coming soon</p>
            <span>In the meantime, pick a tool above and explore what it can help you make.</span>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorialsResult.items.map((tutorial) => (
              <TutorialCard key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>

          {tutorialsResult.totalPages > 1 && (
            <div className="flex justify-center pt-6">
              <Link to="/guides" className="btn-secondary">
                View all guides
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
          </>
        )}
      </section>

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
