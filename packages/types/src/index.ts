export type UserRole = "user" | "admin";

export type NotificationType =
  | "like"
  | "reply"
  | "repost"
  | "follow"
  | "mention"
  | "orbit_invite";

export interface UserPublic {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  location?: string;
  website?: string;
  verified: boolean;
  isPrivate: boolean;
  onboarded: boolean;
  stats: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
  };
  createdAt: string;
}

export interface OrbitPublic {
  id: string;
  slug: string;
  name: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  stats: {
    memberCount: number;
    postCount: number;
  };
}

export interface PostPublic {
  id: string;
  content: string;
  mediaUrls: string[];
  author: UserPublic;
  orbit?: OrbitPublic;
  replyToId?: string;
  repostOfId?: string;
  hashtags: string[];
  stats: {
    likeCount: number;
    replyCount: number;
    repostCount: number;
    bookmarkCount: number;
    viewCount: number;
  };
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserPublic;
  tokens: AuthTokens;
}
