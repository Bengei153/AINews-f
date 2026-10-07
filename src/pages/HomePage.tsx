/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DiscoveryHero } from '../components/DiscoveryHero';
import { DiscoveryPaths } from '../components/DiscoveryPaths';
import { LearningProgress } from '../components/LearningProgress';
import { ContentState } from '../components/ContentState';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../store/authStore';
import { getArticles } from '../api/articles';
import { getAiTools } from '../api/aiTools';
import { getCourses } from '../api/courses';
import { ArticleCard } from '../components/ArticleCard';
import { ToolCard } from '../components/ToolCard';
import { CourseCard } from '../components/CourseCard';
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

  const { data: recentArticles, isLoading: isArticlesLoading, isError: articlesError, refetch: retryArticles } = useQuery({
    queryKey: ['recent-articles'],
    queryFn: () => getArticles({ pageSize: 6, pageNumber: 1 }),
  });

  const { data: featuredTools, isLoading: isToolsLoading, isError: toolsError, refetch: retryTools } = useQuery({
    queryKey: ['featured-tools'],
    queryFn: () => getAiTools(true),
  });

  const { data: featuredCourses, isLoading: isCoursesLoading, isError: coursesError, refetch: retryCourses } = useQuery({
    queryKey: ['home-courses'],
    queryFn: () => getCourses({ pageSize: 3 }),
  });

  const featuredTool = featuredTools?.[0];

  const personalizedArticles = React.useMemo(() => {
    if (!user || !user.interests || (user.interests ?? []).length === 0 || !recentArticles?.items) {
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
    <div className="home-page discovery-home">
      <DiscoveryHero article={visibleRecentArticles[0]} />
      <LearningProgress />
      <DiscoveryPaths />

      <div className="content-layout">
        <div className="content-layout__main">
          {user && (user.interests ?? []).length > 0 && (
            <section className="content-section">
              <div className="section-heading-row">
                <h2 className="font-serif">
                  <Sliders className="w-5 h-5" />
                  Picked for your interests
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
              ) : articlesError ? (
                <ContentState error title="Your feed couldn’t load" description="Please check your connection and try again." retry={() => void retryArticles()} />
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
              <ContentState error={articlesError} retry={() => void retryArticles()} title={articlesError ? "We couldn’t load the latest briefings" : "A new perspective is on its way"} description={articlesError ? "Please check your connection and try again." : "Explore a practical guide while new briefings arrive."} to="/guides" action="Explore guides" />
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

          <section className="content-section">
            <div className="section-heading-row">
              <h2 className="font-serif">
                <GraduationCap className="w-5 h-5" />
                Go deeper, at your own pace
              </h2>
              <Link to="/courses" className="text-link text-link--muted">
                View all courses
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isCoursesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton-card animate-pulse">
                    <div className="w-24 h-4 bg-stone-200 rounded"></div>
                    <div className="w-full h-6 bg-stone-200 rounded"></div>
                    <div className="w-full h-12 bg-stone-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : !featuredCourses?.items || featuredCourses.items.length === 0 ? (
              <ContentState error={coursesError} retry={() => void retryCourses()} title={coursesError ? "Learning resources couldn’t load" : "More learning is on its way"} description="You can still explore step-by-step guides and hands-on projects." to="/guides" action="Find a guide" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuredCourses.items.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="content-layout__aside">
          <section className="spotlight-panel">
            <h2 className="font-serif">
              <Sparkles className="w-4 h-4" />
              Worth a closer look
            </h2>

            {isToolsLoading ? (
              <div className="skeleton-card animate-pulse">
                <div className="w-24 h-4 bg-stone-200 rounded"></div>
                <div className="w-full h-12 bg-stone-200 rounded"></div>
              </div>
            ) : !featuredTool ? (
              <ContentState error={toolsError} retry={() => void retryTools()} title={toolsError ? "The spotlight couldn’t load" : "Discover your next useful tool"} description="Explore the directory and find something that fits your goals." to="/tools" action="Browse tools" />
            ) : (
              <div className="space-y-4">
                <p className="sidebar-copy">
                  A featured tool to help turn everyday curiosity into something useful.
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
                  <span>Tap the bookmark icon on any briefing card to save it for quick reference.</span>
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
            Explore approachable ideas, learn at your own pace, and see what people like you are making with AI.
          </p>
        </div>
        <div className="dark-cta-panel__links">
          <Link to="/guides" className="btn-light">
            <PlayCircle className="w-4 h-4" />
            Start with a guide
          </Link>
          <Link to="/showcase" className="btn-ghost">
            See what people are making
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
