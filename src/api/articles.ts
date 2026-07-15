/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, simulateNetworkDelay } from './client';
import { Article, ArticleDetail, PaginatedResult, ArticlePillar } from '../types/api';
import { MockDatabase } from './mockDb';

export interface GetArticlesParams {
  pillar?: ArticlePillar;
  categoryId?: string;
  tagId?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const getArticles = async (params: GetArticlesParams = {}): Promise<PaginatedResult<Article>> => {
  const {
    pillar,
    categoryId,
    tagId,
    search,
    pageNumber = 1,
    pageSize = 20,
  } = params;

  if (isDemoMode()) {
    await simulateNetworkDelay();
    let articles = MockDatabase.getArticles();
    
    // Public endpoint only returns published ones
    articles = articles.filter((a) => a.published);

    // Filter by Pillar
    if (pillar) {
      articles = articles.filter((a) => a.pillar === pillar);
    }

    // Filter by Category
    if (categoryId) {
      const categories = MockDatabase.getCategories();
      const targetCategory = categories.find((c) => c.id === categoryId);
      if (targetCategory) {
        articles = articles.filter((a) => a.categoryName === targetCategory.name);
      }
    }

    // Filter by Tag
    if (tagId) {
      const tags = MockDatabase.getTags();
      const targetTag = tags.find((t) => t.id === tagId);
      if (targetTag) {
        articles = articles.filter((a) => a.tags.includes(targetTag.slug));
      }
    }

    // Search query match title or summary
    if (search) {
      const q = search.toLowerCase();
      articles = articles.filter(
        (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
      );
    }

    // Calculate pagination
    const totalCount = articles.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIdx = (pageNumber - 1) * pageSize;
    const paginatedItems = articles.slice(startIdx, startIdx + pageSize).map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      summary: a.summary,
      pillar: a.pillar,
      categoryName: a.categoryName,
      readTimeMinutes: a.readTimeMinutes,
      publishedOn: a.publishedOn,
    }));

    return {
      items: paginatedItems,
      pageNumber,
      totalPages,
      totalCount,
    };
  }

  const response = await apiClient.get<PaginatedResult<Article>>('/articles', { params });
  return response.data;
};

export const getArticleBySlug = async (slug: string): Promise<ArticleDetail> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const articles = MockDatabase.getArticles();
    const article = articles.find((a) => a.slug === slug);
    if (!article) {
      throw {
        status: 404,
        title: 'Not Found',
        detail: `Article with slug '${slug}' was not found.`,
      };
    }
    return article;
  }

  const response = await apiClient.get<ArticleDetail>(`/articles/${slug}`);
  return response.data;
};

export interface CreateArticlePayload {
  title: string;
  summary: string;
  body: string;
  pillar: ArticlePillar;
  categoryId: string;
  tagIds: string[];
  sourceType: 'Original' | 'Aggregated' | 'AIGenerated';
  sourceUrl?: string | null;
  sourceName?: string | null;
}

export const createArticle = async (payload: CreateArticlePayload): Promise<string> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const articles = MockDatabase.getArticles();
    const categories = MockDatabase.getCategories();
    const tags = MockDatabase.getTags();

    const category = categories.find((c) => c.id === payload.categoryId);
    const categoryName = category ? category.name : 'Uncategorized';

    const selectedTags = tags.filter((t) => payload.tagIds.includes(t.id)).map((t) => t.slug);

    const slug = payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const newArticleId = `art-${articles.length + 1}`;
    
    const newArticle: ArticleDetail & { published: boolean } = {
      id: newArticleId,
      title: payload.title,
      slug,
      summary: payload.summary,
      body: payload.body,
      pillar: payload.pillar,
      categoryName,
      readTimeMinutes: Math.max(1, Math.round(payload.body.split(/\s+/).length / 200)),
      publishedOn: new Date().toISOString(),
      sourceName: payload.sourceName || null,
      sourceUrl: payload.sourceUrl || null,
      tags: selectedTags,
      published: false, // Starts as draft / review state
    };

    articles.unshift(newArticle); // Draft queue gets first
    MockDatabase.saveArticles(articles);

    return newArticleId;
  }

  const response = await apiClient.post<string>('/articles', payload);
  return response.data;
};

export const publishArticle = async (articleId: string): Promise<void> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const articles = MockDatabase.getArticles();
    const article = articles.find((a) => a.id === articleId);
    if (!article) {
      throw {
        status: 404,
        title: 'Not Found',
        detail: `Article to publish was not found.`,
      };
    }
    article.published = true;
    article.publishedOn = new Date().toISOString(); // refresh publish date
    MockDatabase.saveArticles(articles);
    return;
  }

  await apiClient.post(`/articles/${articleId}/publish`);
};

// Custom helper: get drafts for Admin view (not exposed in the backend, but helpful for admin UI curation)
export const getAdminDrafts = async (): Promise<ArticleDetail[]> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const articles = MockDatabase.getArticles();
    return articles.filter((a) => !a.published);
  }

  const response = await apiClient.get<ArticleDetail[]>('/articles/drafts');
  return response.data;
};

export const triggerNewsIngestion = async (): Promise<{ itemsFetched: number; draftsCreated: number; skipped: number; errors: string[] }> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    return { itemsFetched: 0, draftsCreated: 0, skipped: 0, errors: ['News ingestion is not simulated in demo mode.'] };
  }

  const response = await apiClient.post('/articles/ingest-news');
  return response.data;
};
