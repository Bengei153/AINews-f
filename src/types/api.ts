/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'User' | 'Admin';

export type ArticlePillar = 'AIForStudents' | 'AIForWork' | 'AINews' | 'AIToolSpotlight' | 'FutureOfAI';

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  pillar: ArticlePillar;
  categoryName: string;
  readTimeMinutes: number;
  publishedOn: string;
  coverImageUrl?: string | null;
  viewCount?: number;
}

export interface ArticleDetail extends Article {
  body: string;
  sourceName: string | null;
  sourceUrl: string | null;
  tags: string[];
}

export type ReactionType = 'Like' | 'Love' | 'Insightful' | 'MindBlown';

export interface ArticleReactions {
  counts: Record<ReactionType, number>;
  currentUserReaction: ReactionType | null;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  imageUrl: string | null;
  created: string;
}

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Tutorial {
  id: string;
  title: string;
  slug: string;
  summary: string;
  toolName: string;
  difficultyLevel: DifficultyLevel;
  coverImageUrl?: string | null;
  publishedOn: string | null;
  viewCount: number;
}

export interface TutorialDetail extends Tutorial {
  body: string;
}

export interface GameProfile {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  youTubeVideoId: string;
  thumbnailUrl: string;
  channelName: string;
  aiReview: string;
  publishedOn: string | null;
  viewCount: number;
}

export interface VideoDetail extends Video {
  sourceUrl: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  pillar: ArticlePillar;
  description: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface AITool {
  id: string;
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  pricing: string;
  rating: number;
  tags: string; // comma-separated
  isFeaturedToday: boolean;
  logoUrl?: string | null;
}

export interface Interest {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  interests: string[]; // List of interest names (e.g., ["Programming", "Research"])
}

export interface AuthResponse {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresOn: string;
}

export interface BookmarkItem {
  articleId: string;
  title: string;
  slug: string;
  summary: string;
  savedOn: string;
}

export interface ApiError {
  status: number;
  title: string;
  detail: string;
  errors?: Record<string, string[]>;
}
