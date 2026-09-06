/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getCourses } from '../api/courses';
import { getCourseCategories } from '../api/courseCategories';
import { CourseCard } from '../components/courseCard';
import { LearningNavTabs } from '../components/LearningNavTabs';
import { CoursePricingType } from '../types/api';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';

export const CoursesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryId = searchParams.get('category') || '';
  const pricingType = (searchParams.get('pricing') as CoursePricingType) || undefined;
  const searchInput = searchParams.get('search') || '';
  const pageNumber = parseInt(searchParams.get('page') || '1', 10);

  const [searchQuery, setSearchQuery] = useState(searchInput);

  useEffect(() => {
    setSearchQuery(searchInput);
  }, [searchInput]);

  const { data: categories } = useQuery({
    queryKey: ['course-categories'],
    queryFn: getCourseCategories,
  });

  const { data: coursesResult, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['courses', categoryId, pricingType, searchInput, pageNumber],
    queryFn: () =>
      getCourses({
        courseCategoryId: categoryId || undefined,
        pricingType,
        search: searchInput || undefined,
        pageNumber,
        pageSize: 9,
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
    updateFilters({ search: searchQuery });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ category: e.target.value || undefined });
  };

  const handlePricingFilter = (value: CoursePricingType | undefined) => {
    updateFilters({ pricing: value });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (coursesResult && newPage > coursesResult.totalPages)) return;
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...current, page: String(newPage) });
  };

  const activeCategoryName = categories?.find((c) => c.id === categoryId)?.name;

  return (
    <div className="listing-page animate-in fade-in duration-200">
      <div className="listing-header">
        <div className="space-y-3">
          <LearningNavTabs />
          <div className="section-kicker">
            <GraduationCap className="w-3.5 h-3.5" />
            {activeCategoryName ? activeCategoryName : 'Course Directory'}
          </div>
          <h1 className="editorial-heading editorial-heading--page font-serif">
            Full <em>courses</em>, organized by what you want to build.
          </h1>
          <p className="editorial-lede">
            AI-discovered courses from across the web — YouTube, Coursera, Udemy, and more — sorted into categories with free and paid options clearly marked.
          </p>
        </div>

        {(categoryId || pricingType || searchInput) && (
          <button
            onClick={handleResetFilters}
            className="self-start sm:self-center text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100/60 px-3 py-1.5 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>

      <section className="listing-controls">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">
          <Filter className="w-3.5 h-3.5" />
          Find a course
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <select
            value={categoryId}
            onChange={handleCategoryChange}
            className="text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50 font-semibold"
          >
            <option value="">All categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <div className="facet-row">
            <button
              type="button"
              onClick={() => handlePricingFilter(undefined)}
              className={!pricingType ? 'facet-chip facet-chip--active' : 'facet-chip'}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handlePricingFilter('Free')}
              className={pricingType === 'Free' ? 'facet-chip facet-chip--active' : 'facet-chip'}
            >
              Free
            </button>
            <button
              type="button"
              onClick={() => handlePricingFilter('Paid')}
              className={pricingType === 'Paid' ? 'facet-chip facet-chip--active' : 'facet-chip'}
            >
              Paid
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <input
            type="text"
            placeholder="Search courses by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <button type="submit" className="hidden">Search</button>
        </form>
      </section>

      {isLoading && !coursesResult ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card skeleton-card--tall animate-pulse">
              <div className="w-24 h-4 bg-stone-200 rounded"></div>
              <div className="w-full h-8 bg-stone-200 rounded"></div>
              <div className="w-full h-24 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : !coursesResult?.items || coursesResult.items.length === 0 ? (
        <div className="empty-state empty-state--large">
          <GraduationCap className="w-12 h-12" />
          <p>No courses yet</p>
          <span>Check back soon — this section is just getting started.</span>
        </div>
      ) : (
        <div className="space-y-8">
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${isPlaceholderData ? 'opacity-60' : 'opacity-100'}`}>
            {coursesResult.items.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>

          {coursesResult.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 pt-6">
              <span className="result-count">
                Page {coursesResult.pageNumber} of {coursesResult.totalPages} (Total {coursesResult.totalCount} items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                  className="icon-button"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePageChange(pageNumber + 1)}
                  disabled={pageNumber >= coursesResult.totalPages}
                  className="icon-button"
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