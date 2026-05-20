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
  orbitIds?: string[];
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

export interface PollOptionPublic {
  id: string;
  text: string;
  voteCount: number;
  percent: number;
}

export interface PollPublic {
  options: PollOptionPublic[];
  endsAt: string;
  totalVotes: number;
  votedOptionId?: string | null;
  ended: boolean;
}

export interface PostPublic {
  id: string;
  content: string;
  mediaUrls: string[];
  author: UserPublic;
  orbit?: OrbitPublic;
  liveBroadcastId?: string | null;
  replyToId?: string;
  repostOfId?: string;
  hashtags: string[];
  poll?: PollPublic;
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

export interface NotificationPostStats {
  likeCount: number;
  replyCount: number;
  repostCount: number;
  viewCount: number;
}

export interface NotificationPostPreview {
  id: string;
  content: string;
  mediaUrl: string | null;
  replyToId: string | null;
  threadRootId?: string;
  replyToUsername?: string | null;
  stats?: NotificationPostStats;
  likedByMe?: boolean;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  postId: string | null;
  isRead: boolean;
  actor: UserPublic | null;
  createdAt: string;
  postPreview?: NotificationPostPreview | null;
}

export interface TrendingTag {
  tag: string;
  count: number;
}

export interface SearchResult {
  query: string;
  users: UserPublic[];
  posts: PostPublic[];
  orbits: OrbitPublic[];
}

export interface ConversationItem {
  id: string;
  participant: UserPublic | null;
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  mediaUrls: string[];
  isRead: boolean;
  createdAt: string;
}

export interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  method: string;
  local?: boolean;
  cloudinary?: boolean;
  idrive?: boolean;
  storage?: "cloudinary" | "idrive" | "local";
  fields?: Record<string, string>;
}

export interface GifItem {
  id: string;
  url: string;
  previewUrl: string;
  width: string;
  height: string;
}
