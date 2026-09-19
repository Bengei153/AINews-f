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

export type CoursePricingType = 'Free' | 'Paid';

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

// Discovered by AI (web search) rather than authored on the platform —
// external courses the site links out to, never hosted in-app. Same shape
// covers the paged list and the single-course detail endpoint.
export interface Course {
  id: string;
  title: string;
  slug: string;
  provider: string;
  courseCategoryId: string;
  courseCategoryName: string;
  topic: string;
  description: string;
  thumbnailUrl: string | null;
  externalUrl: string;
  pricingType: CoursePricingType;
  price: string | null;
  publishedOn: string | null;
}

// --- AI provider settings (admin) ---

export type AiProvider = 'Anthropic' | 'Gemini' | 'OpenAI' | 'Kimi';
export type AiTask = 'ArticleWriting' | 'VideoReview';

export interface AiTaskModelConfig {
  task: AiTask;
  provider: AiProvider;
  model: string | null;
  isDefault: boolean;
}

export interface ArticleWritingTemplate {
  promptTemplate: string;
  isDefault: boolean;
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

// Which content type a share (into Showcase, or sent to a follower) points
// at — mirrors the backend's Domain.Enums.SharedContentType exactly.
export type SharedContentType = 'Article' | 'Video' | 'Tutorial' | 'Course';

// Stage 6 — Student Showcase. The backend returns the same shape for both
// the paged list and the single-post detail endpoint, so one type covers
// both (unlike Article/Tutorial, which have separate Summary/Detail DTOs).
export interface ShowcasePost {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  imageUrl: string | null;
  toolsUsed: string | null;
  isFeatured: boolean;
  reactionCount: number;
  created: string;
  sharedContentType: SharedContentType | null;
  sharedContentId: string | null;
  sharedContentTitle: string | null;
  sharedContentSlug: string | null;
  sharedContentThumbnailUrl: string | null;
}

// Reaction counts + current user's reaction, identical shape to
// ArticleReactions — kept as its own type so showcase and article call
// sites can diverge independently later without a shared-type refactor.
export interface ShowcaseReactions {
  counts: Record<ReactionType, number>;
  currentUserReaction: ReactionType | null;
}

// --- Notifications ---

// Only one value exists today (the "send to a follower" content share),
// but the backend deliberately typed it as an enum with room to grow —
// see Domain.Enums.NotificationType — so this mirrors that rather than
// hardcoding a boolean/string here.
export type NotificationType = 'ContentShared';

export interface Notification {
  id: string;
  actorUserId: string;
  actorName: string;
  type: NotificationType;
  contentType: SharedContentType | null;
  contentId: string | null;
  contentTitle: string | null;
  contentSlug: string | null;
  contentThumbnailUrl: string | null;
  message: string | null;
  isRead: boolean;
  created: string;
}

// --- Follows ---

export interface FollowStatus {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
}

// A person who follows the current user — used by the "send to a
// follower" recipient picker (GetMyFollowersQuery on the backend).
export interface FollowerDto {
  userId: string;
  fullName: string;
}

// --- Badges/achievements ---

export type BadgeCode =
  | 'FirstShowcasePost'
  | 'FiveShowcasePosts'
  | 'TenComments'
  | 'SevenDayStreak'
  | 'ThirtyDayStreak'
  | 'HundredXp'
  | 'FiveHundredXp'
  | 'ThousandXp'
  | 'FiftyReactionsReceived'
  | 'TenFollowers';

export interface Badge {
  code: BadgeCode;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  earned: boolean;
  earnedOn: string | null;
}

// --- Showcase leaderboard ---

export type LeaderboardPeriod = 'Week' | 'Month' | 'All';

export interface ShowcaseLeaderboardEntry {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  imageUrl: string | null;
  reactionCount: number;
  isFeatured: boolean;
  created: string;
}