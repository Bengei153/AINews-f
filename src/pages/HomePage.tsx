/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../store/authStore';
import { getArticles } from '../api/articles';
import { getAiTools } from '../api/aiTools';
import { ArticleCard } from '../components/ArticleCard';
import { ToolCard } from '../components/ToolCard';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  GraduationCap,
  HelpCircle,
  Newspaper,
  PlayCircle,
  ShieldCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Article } from '../types/api';

export const HomePage: React.FC = () => {
  const { user, bookmarks } = useAuth();

  const { data: recentArticles, isLoading: isArticlesLoading } = useQuery({
    queryKey: ['recent-articles'],
    queryFn: () => getArticles({ pageSize: 6, pageNumber: 1 }),
  });

  const { data: featuredTools, isLoading: isToolsLoading } = useQuery({
    queryKey: ['featured-tools'],
    queryFn: () => getAiTools(true),
  });

  const featuredTool = featuredTools?.[0];

  const personalizedArticles = React.useMemo(() => {
    if (!user || !user.interests || user.interests.length === 0 || !recentArticles?.items) {
      return [];
    }

    const chosenInterests = user.interests.map((i) => i.toLowerCase());

    return recentArticles.items.filter((art: Article) => {
      const pillar = art.pillar.toLowerCase();
      const cat = art.categoryName.toLowerCase();
      const summary = art.summary.toLowerCase();
      const title = art.title.toLowerCase();

      return chosenInterests.some((interest) => {
        if (interest === 'programming' && (pillar.includes('work') || title.includes('code') || title.includes('cursor') || summary.includes('dev'))) {
          return true;
        }
        if (interest === 'research' && (pillar.includes('future') || title.includes('gpt-6') || summary.includes('model'))) {
          return true;
        }
        if (interest === 'writing' && (summary.includes('write') || title.includes('writer') || summary.includes('copy'))) {
          return true;
        }
        if (interest === 'design' && (summary.includes('design') || summary.includes('image') || title.includes('v0') || title.includes('art'))) {
          return true;
        }
        if (interest === 'business' && (pillar.includes('work') || summary.includes('workflow') || summary.includes('operation'))) {
          return true;
        }
        if (interest === 'education' && (pillar.includes('student') || summary.includes('study') || summary.includes('tutor'))) {
          return true;
        }
        if (interest === 'productivity' && (summary.includes('productivity') || summary.includes('workflow') || summary.includes('automate'))) {
          return true;
        }
        return cat.includes(interest) || title.includes(interest) || summary.includes(interest);
      });
    });
  }, [user, recentArticles]);

  const visiblePersonalizedArticles = personalizedArticles.slice(0, 4);
  const visibleRecentArticles = recentArticles?.items?.slice(0, 4) ?? [];
  const hidePersonalizedImagePlaceholders =
    visiblePersonalizedArticles.length > 0 && visiblePersonalizedArticles.every((art) => !art.coverImageUrl?.trim());
  const hideRecentImagePlaceholders =
    visibleRecentArticles.length > 0 && visibleRecentArticles.every((art) => !art.coverImageUrl?.trim());

  return (
    <div className="home-page animate-in fade-in duration-200">
      <section className="homepage-hero">
        <div className="homepage-hero__copy">
          <div className="section-kicker">
            <Sparkles className="w-3.5 h-3.5" />
            Curated intelligence hub
          </div>

          <h1 className="editorial-heading editorial-heading--hero font-serif">
            {user ? (
              <>
                Welcome back, <em>{user.fullName.split(' ')[0]}</em>.
              </>
            ) : (
              <>
                Deciphering the <em>AI Frontier.</em>
              </>
            )}
          </h1>

          <p className="editorial-lede">
            Your curated gateway to vetted artificial intelligence tools, research-grade insights, and practical tutorials designed for the modern creator.
          </p>

          <div className="hero-actions">
            {user ? (
              user.interests.length === 0 ? (
                <Link to="/settings" className="btn-primary">
                  <Sliders className="w-4 h-4" />
                  Customize your Interests
                </Link>
              ) : (
                <div className="interest-strip">
                  <span>My feed filters:</span>
                  {user.interests.map((interest) => (
                    <strong key={interest}>{interest}</strong>
                  ))}
                </div>
              )
            ) : (
              <>
                <Link to="/register" className="btn-primary">
                  Explore AI Directory
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/articles" className="btn-secondary">
                  Read Latest Briefs
                </Link>
              </>
            )}
          </div>

          <div className="hero-stats">
            <div>
              <strong>500+</strong>
              <span>Vetted resources</span>
            </div>
            <div>
              <strong>48</strong>
              <span>Weekly briefs</span>
            </div>
            <div>
              <strong>12k</strong>
              <span>Active minds</span>
            </div>
          </div>
        </div>

        <div className="homepage-hero__visual" aria-hidden="true">
          <div className="hero-research-card">
            <div className="hero-research-card__image"></div>
            <div className="hero-research-card__caption">
              <span>Featured Brief</span>
              <strong>The Rise of Multi-Modal Agents</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-section editorial-section--center">
        <div className="section-kicker">Core Philosophy</div>
        <h2 className="editorial-heading font-serif">Curated, Not Just Collected.</h2>
        <p className="section-copy">
          Every resource in AI Brief is structured for discovery, practical value, and long-term reference.
        </p>

        <div className="feature-grid">
          <Link to="/tools" className="feature-card">
            <BookOpen className="w-5 h-5" />
            <span>Resources</span>
            <strong>Academic-Tech Directory</strong>
            <p>Access a high-fidelity catalog of models and tools.</p>
          </Link>
          <Link to="/articles" className="feature-card">
            <Newspaper className="w-5 h-5" />
            <span>Intelligence</span>
            <strong>Model Deep-Dives</strong>
            <p>Technical breakdowns of architectures, costs, and benchmarks.</p>
          </Link>
          <Link to="/tutorials" className="feature-card">
            <GraduationCap className="w-5 h-5" />
            <span>Automation</span>
            <strong>Workflow Recipes</strong>
            <p>Step-by-step guides for turning frontier tools into output.</p>
          </Link>
        </div>
      </section>

      <div className="content-layout">
        <div className="content-layout__main">
          {user && user.interests.length > 0 && (
            <section className="content-section">
              <div className="section-heading-row">
                <h2 className="font-serif">
                  <Sliders className="w-5 h-5" />
                  For You ({user.interests.join(', ')})
                </h2>
                <Link to="/settings" className="text-link">
                  Edit Interests
                </Link>
              </div>

              {isArticlesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="skeleton-card animate-pulse">
                      <div className="w-24 h-4 bg-stone-200 rounded"></div>
                      <div className="w-full h-6 bg-stone-200 rounded"></div>
                      <div className="w-full h-12 bg-stone-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : visiblePersonalizedArticles.length === 0 ? (
                <div className="empty-state">
                  <Sliders className="w-8 h-8" />
                  <p>No matching updates</p>
                  <span>We have not indexed specific articles for your chosen categories today. Browse all published briefings below.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visiblePersonalizedArticles.map((art) => (
                    <ArticleCard
                      key={art.id}
                      article={art}
                      hideMissingImagePlaceholder={hidePersonalizedImagePlaceholders}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="content-section">
            <div className="section-heading-row">
              <h2 className="font-serif">
                <Newspaper className="w-5 h-5" />
                Latest Briefings
              </h2>
              <Link to="/articles" className="text-link text-link--muted">
                View all articles
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isArticlesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton-card animate-pulse">
                    <div className="w-24 h-4 bg-stone-200 rounded"></div>
                    <div className="w-full h-6 bg-stone-200 rounded"></div>
                    <div className="w-full h-12 bg-stone-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : visibleRecentArticles.length === 0 ? (
              <p className="muted-copy">No briefings found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleRecentArticles.map((art) => (
                  <ArticleCard
                    key={art.id}
                    article={art}
                    hideMissingImagePlaceholder={hideRecentImagePlaceholders}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="content-layout__aside">
          <section className="spotlight-panel">
            <h2 className="font-serif">
              <Sparkles className="w-4 h-4" />
              AI Tool Spotlight
            </h2>

            {isToolsLoading ? (
              <div className="skeleton-card animate-pulse">
                <div className="w-24 h-4 bg-stone-200 rounded"></div>
                <div className="w-full h-12 bg-stone-200 rounded"></div>
              </div>
            ) : !featuredTool ? (
              <p>No spotlight tool configured today.</p>
            ) : (
              <div className="space-y-4">
                <p className="sidebar-copy">
                  Our editors select and verify one tool every day to showcase exceptional utility and ease-of-use.
                </p>
                <ToolCard tool={featuredTool} />
                <Link to="/tools" className="text-link text-link--center">
                  Browse Full AI Directory
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </section>

          {user && (
            <section className="sidebar-panel">
              <h2 className="font-serif">
                <Bookmark className="w-4 h-4" />
                Saved Bookmarks
              </h2>

              {bookmarks.length === 0 ? (
                <div className="empty-state empty-state--compact">
                  <Bookmark className="w-6 h-6" />
                  <p>No bookmarks saved</p>
                  <span>Click the star icon on any briefing card to save it for quick reference.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookmarks.slice(0, 4).map((bm) => (
                    <div key={bm.articleId} className="sidebar-item">
                      <Link to={`/articles/${bm.slug}`} className="sidebar-link font-serif">
                        {bm.title}
                      </Link>
                      <p>{bm.summary}</p>
                    </div>
                  ))}
                  {bookmarks.length > 4 && (
                    <Link to="/bookmarks" className="text-link text-link--center pt-2">
                      View all {bookmarks.length} bookmarks
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="sidebar-panel">
            <h2 className="font-serif">
              <HelpCircle className="w-4 h-4" />
              Content Pillars
            </h2>
            <div className="pillar-list">
              <Link to="/articles?pillar=AIForStudents">
                <span>AI for Students</span>
                <strong>Academic</strong>
              </Link>
              <Link to="/articles?pillar=AIForWork">
                <span>AI for Work</span>
                <strong>Professional</strong>
              </Link>
              <Link to="/articles?pillar=AINews">
                <span>AI News</span>
                <strong>Policy</strong>
              </Link>
              <Link to="/articles?pillar=AIToolSpotlight">
                <span>Tool Spotlight</span>
                <strong>Reviews</strong>
              </Link>
              <Link to="/articles?pillar=FutureOfAI">
                <span>Future of AI</span>
                <strong>AGI</strong>
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <section className="dark-cta-panel">
        <div>
          <div className="section-kicker section-kicker--dark">
            <ShieldCheck className="w-3.5 h-3.5" />
            Join the community
          </div>
          <h2 className="font-serif">
            Stay ahead on the <em>Frontier.</em>
          </h2>
          <p>
            Join 12,500+ developers, students, and creators receiving weekly digests of curated tools and technical breakthroughs.
          </p>
        </div>
        <div className="dark-cta-panel__links">
          <Link to="/tutorials" className="btn-light">
            <PlayCircle className="w-4 h-4" />
            Start Learning
          </Link>
          <Link to="/showcase" className="btn-ghost">
            View Showcase
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
