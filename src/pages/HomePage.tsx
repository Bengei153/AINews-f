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
import { Sparkles, Sliders, ArrowRight, Bookmark, Newspaper, HelpCircle } from 'lucide-react';
import { Article } from '../types/api';

export const HomePage: React.FC = () => {
  const { user, bookmarks } = useAuth();

  // 1. Fetch recent articles
  const { data: recentArticles, isLoading: isArticlesLoading } = useQuery({
    queryKey: ['recent-articles'],
    queryFn: () => getArticles({ pageSize: 6, pageNumber: 1 }),
  });

  // 2. Fetch featured tool (spotlight of the day)
  const { data: featuredTools, isLoading: isToolsLoading } = useQuery({
    queryKey: ['featured-tools'],
    queryFn: () => getAiTools(true),
  });

  const featuredTool = featuredTools?.[0];

  // 3. Client-side personalized feed computation based on selected interests
  const personalizedArticles = React.useMemo(() => {
    if (!user || !user.interests || user.interests.length === 0 || !recentArticles?.items) {
      return [];
    }
    
    const chosenInterests = user.interests.map(i => i.toLowerCase());
    
    return recentArticles.items.filter((art: Article) => {
      // Map user interests to relevant categories, pillars, or search strings
      const pillar = art.pillar.toLowerCase();
      const cat = art.categoryName.toLowerCase();
      const summary = art.summary.toLowerCase();
      const title = art.title.toLowerCase();

      return chosenInterests.some(interest => {
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
        // Generic word containment match as a fallback
        return cat.includes(interest) || title.includes(interest) || summary.includes(interest);
      });
    });
  }, [user, recentArticles]);

  return (
    <div className="space-y-12 animate-in fade-in duration-200">
      
      {/* 1. HERO HEADER: Greeting & Onboarding Call-To-Action */}
      <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_40%)]"></div>
        
        <div className="max-w-2xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Intelligence Hub
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none">
            {user ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Learn AI. Use AI. Stay Ahead.'}
          </h1>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl">
            AI Brief is a Clean Architecture-driven platform focused on cutting through the noise. Get direct insights, curated tool indexes, and personalized content.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {user ? (
              user.interests.length === 0 ? (
                <Link
                  to="/settings"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold py-2.5 px-5 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Sliders className="w-4 h-4" />
                  Customize your Interests
                </Link>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-stone-400 mr-1.5 font-bold uppercase tracking-wider">My Feed Filters:</span>
                  {user.interests.map((int) => (
                    <span key={int} className="text-[11px] font-bold bg-white/10 border border-white/10 text-emerald-300 px-2.5 py-1 rounded-md">
                      {int}
                    </span>
                  ))}
                </div>
              )
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold py-2.5 px-5 rounded-lg inline-flex items-center gap-1 transition-colors shadow-md"
                >
                  Get Started for Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/articles"
                  className="text-stone-300 hover:text-white text-xs sm:text-sm font-bold py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  Browse Anonymously
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. THREE-PANEL LAYOUT: Personalized Feed, Spotlight, & Saved Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personalized Feed & Latest Articles */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Personalized Articles (Conditional) */}
          {user && user.interests.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-700" />
                  For You ({user.interests.join(', ')})
                </h2>
                <Link to="/settings" className="text-xs font-bold text-emerald-800 hover:underline">
                  Edit Interests
                </Link>
              </div>

              {isArticlesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3 animate-pulse">
                      <div className="w-24 h-4 bg-stone-200 rounded"></div>
                      <div className="w-full h-6 bg-stone-200 rounded"></div>
                      <div className="w-full h-12 bg-stone-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : personalizedArticles.length === 0 ? (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center space-y-2">
                  <Sliders className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-sm font-bold text-stone-700">No matching updates</p>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    We haven't indexed specific articles for your chosen categories today. Browse all published briefings below!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {personalizedArticles.slice(0, 4).map((art) => (
                    <ArticleCard key={art.id} article={art} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* General Published Feed */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-stone-800" />
                Latest Briefings
              </h2>
              <Link to="/articles" className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1">
                View all articles
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isArticlesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3 animate-pulse">
                    <div className="w-24 h-4 bg-stone-200 rounded"></div>
                    <div className="w-full h-6 bg-stone-200 rounded"></div>
                    <div className="w-full h-12 bg-stone-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : !recentArticles?.items || recentArticles.items.length === 0 ? (
              <p className="text-stone-500 text-sm">No briefings found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentArticles.items.slice(0, 4).map((art) => (
                  <ArticleCard key={art.id} article={art} />
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Spotlight Widget & Bookmarks Preview */}
        <div className="space-y-8">
          
          {/* AI Tool Spotlight widget */}
          <section className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 space-y-4 relative">
            <h2 className="font-serif text-lg font-bold text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              AI Tool Spotlight
            </h2>

            {isToolsLoading ? (
              <div className="bg-white border border-stone-200 rounded-xl p-5 animate-pulse space-y-3">
                <div className="w-24 h-4 bg-stone-200 rounded"></div>
                <div className="w-full h-12 bg-stone-200 rounded"></div>
              </div>
            ) : !featuredTool ? (
              <p className="text-xs text-stone-500">No spotlight tool configured today.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-stone-600 leading-relaxed">
                  Our editors select and verify one tool every single day to showcase exceptional utility and ease-of-use.
                </p>
                <ToolCard tool={featuredTool} />
                <Link to="/tools" className="text-xs font-bold text-emerald-800 hover:underline block text-center">
                  Browse Full AI Directory &rarr;
                </Link>
              </div>
            )}
          </section>

          {/* Quick Saved Bookmarks Sidebar */}
          {user && (
            <section className="border border-stone-200 rounded-2xl p-6 bg-white space-y-4">
              <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-1.5 border-b border-stone-100 pb-2">
                <Bookmark className="w-4 h-4 text-amber-500" />
                Saved Bookmarks
              </h2>

              {bookmarks.length === 0 ? (
                <div className="text-center py-4 space-y-1">
                  <Bookmark className="w-6 h-6 text-stone-300 mx-auto" />
                  <p className="text-xs font-semibold text-stone-700">No bookmarks saved</p>
                  <p className="text-[10px] text-stone-400">
                    Click the star icon on any briefing card to save it for quick reference!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookmarks.slice(0, 4).map((bm) => (
                    <div key={bm.articleId} className="group border-b border-stone-100 last:border-0 pb-3 last:pb-0">
                      <Link
                        to={`/articles/${bm.slug}`}
                        className="font-serif text-sm font-bold text-stone-800 group-hover:text-emerald-700 transition-colors leading-tight block mb-1"
                      >
                        {bm.title}
                      </Link>
                      <p className="text-[11px] text-stone-500 line-clamp-2">{bm.summary}</p>
                    </div>
                  ))}
                  {bookmarks.length > 4 && (
                    <Link to="/bookmarks" className="text-xs font-bold text-stone-600 hover:text-stone-900 block text-center pt-2">
                      View all {bookmarks.length} bookmarks &rarr;
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Curated Pillars Directory Quick Guide */}
          <section className="border border-stone-200 rounded-2xl p-6 bg-white space-y-3">
            <h2 className="font-serif text-sm font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-stone-400" />
              Content Pillars
            </h2>
            <div className="grid grid-cols-1 gap-2.5 pt-1.5">
              <Link to="/articles?pillar=AIForStudents" className="text-xs font-bold text-stone-700 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-lg border border-stone-100 flex items-center justify-between">
                <span>AI for Students</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono">Academic</span>
              </Link>
              <Link to="/articles?pillar=AIForWork" className="text-xs font-bold text-stone-700 hover:text-emerald-700 hover:bg-emerald-50 p-2 rounded-lg border border-stone-100 flex items-center justify-between">
                <span>AI for Work</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono">Professional</span>
              </Link>
              <Link to="/articles?pillar=AINews" className="text-xs font-bold text-stone-700 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg border border-stone-100 flex items-center justify-between">
                <span>AI News</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-mono">Policy</span>
              </Link>
              <Link to="/articles?pillar=AIToolSpotlight" className="text-xs font-bold text-stone-700 hover:text-amber-700 hover:bg-amber-50 p-2 rounded-lg border border-stone-100 flex items-center justify-between">
                <span>Tool Spotlight</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 font-mono">Reviews</span>
              </Link>
              <Link to="/articles?pillar=FutureOfAI" className="text-xs font-bold text-stone-700 hover:text-purple-700 hover:bg-purple-50 p-2 rounded-lg border border-stone-100 flex items-center justify-between">
                <span>Future of AI</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 font-mono">AGI</span>
              </Link>
            </div>
          </section>

        </div>

      </div>

    </div>
  );
};
