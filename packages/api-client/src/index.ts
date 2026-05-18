import type {
  AuthResponse,
  ConversationItem,
  MessageItem,
  OrbitPublic,
  PaginatedResponse,
  PostPublic,
  GifItem,
  PresignResponse,
  UserPublic,
} from "@orbly/types";

export type { AuthResponse, OrbitPublic, PaginatedResponse, PostPublic, UserPublic };

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, getAccessToken, onUnauthorized } = options;
  const root = baseUrl.replace(/\/$/, "");

  async function request<T>(
    path: string,
    init: RequestInit & { auth?: boolean } = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (init.auth !== false) {
      const token = getAccessToken?.();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    const res = await fetch(`${root}${path}`, { ...init, headers });
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const body = (await res.json()) as { detail?: string };
        msg = typeof body.detail === "string" ? body.detail : msg;
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, msg);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    auth: {
      register: (body: {
        username: string;
        displayName: string;
        email: string;
        password: string;
      }) =>
        request<AuthResponse>("/v1/auth/register", {
          method: "POST",
          body: JSON.stringify(body),
          auth: false,
        }),
      login: (body: { email: string; password: string }) =>
        request<AuthResponse>("/v1/auth/login", {
          method: "POST",
          body: JSON.stringify(body),
          auth: false,
        }),
      refresh: (refreshToken: string) =>
        request<AuthResponse>("/v1/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
          auth: false,
        }),
      me: () => request<{ user: UserPublic }>("/v1/auth/me"),
      usernameAvailable: (username: string) =>
        request<{ available: boolean }>(
          `/v1/auth/username-available?username=${encodeURIComponent(username)}`,
          { auth: false },
        ),
      onboarding: (body: Record<string, unknown>) =>
        request<{ user: UserPublic }>("/v1/auth/onboarding", {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      oauth: (body: {
        provider: "google" | "apple";
        email?: string;
        displayName?: string;
        idToken?: string;
        avatarUrl?: string;
        oauthId?: string;
      }) =>
        request<AuthResponse>("/v1/auth/oauth", {
          method: "POST",
          body: JSON.stringify(body),
          auth: false,
        }),
    },
    media: {
      presign: (filename: string, contentType: string, folder = "media") =>
        request<PresignResponse>("/v1/media/presign", {
          method: "POST",
          body: JSON.stringify({ filename, contentType, folder }),
        }),
      gifs: (q = "", limit = 20) =>
        request<{ data: GifItem[] }>(
          `/v1/media/gifs?q=${encodeURIComponent(q)}&limit=${limit}`,
        ),
    },
    users: {
      get: (username: string) =>
        request<{ user: UserPublic; isFollowing: boolean; isSelf: boolean }>(
          `/v1/users/${encodeURIComponent(username)}`,
        ),
      posts: (username: string, cursor?: string) =>
        request<PaginatedResponse<PostPublic>>(
          `/v1/users/${encodeURIComponent(username)}/posts${cursor ? `?cursor=${cursor}` : ""}`,
        ),
      follow: (userId: string) =>
        request<{ following: boolean }>(`/v1/users/${userId}/follow`, { method: "POST" }),
      unfollow: (userId: string) =>
        request<{ following: boolean }>(`/v1/users/${userId}/follow`, { method: "DELETE" }),
      updateMe: (body: Record<string, unknown>) =>
        request<{ user: UserPublic }>("/v1/users/me", {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
    },
    posts: {
      create: (body: {
        content: string;
        mediaUrls?: string[];
        replyToId?: string;
        orbitId?: string;
        poll?: { options: string[]; durationHours?: number };
      }) =>
        request<{ post: PostPublic }>("/v1/posts/", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      get: (id: string) => request<{ post: PostPublic }>(`/v1/posts/${id}`),
      delete: (id: string) =>
        request<{ success: boolean }>(`/v1/posts/${id}`, { method: "DELETE" }),
      like: (id: string) =>
        request<{ liked: boolean }>(`/v1/posts/${id}/like`, { method: "POST" }),
      unlike: (id: string) =>
        request<{ liked: boolean }>(`/v1/posts/${id}/like`, { method: "DELETE" }),
      repost: (id: string, content?: string) =>
        request<{ post: PostPublic }>(`/v1/posts/${id}/repost`, {
          method: "POST",
          body: JSON.stringify({ content }),
        }),
      replies: (id: string) =>
        request<PaginatedResponse<PostPublic>>(`/v1/posts/${id}/replies`),
      view: (id: string) =>
        request<{ success: boolean }>(`/v1/posts/${id}/view`, { method: "POST", auth: false }),
      votePoll: (id: string, optionId: string) =>
        request<{ post: PostPublic }>(`/v1/posts/${id}/poll/vote`, {
          method: "POST",
          body: JSON.stringify({ optionId }),
        }),
    },
    feed: {
      following: (cursor?: string) =>
        request<PaginatedResponse<PostPublic>>(
          `/v1/feed/following${cursor ? `?cursor=${cursor}` : ""}`,
        ),
      forYou: (cursor?: string) =>
        request<PaginatedResponse<PostPublic>>(
          `/v1/feed/for-you${cursor ? `?cursor=${cursor}` : ""}`,
        ),
      trending: () =>
        request<{ data: { tag: string; count: number }[] }>("/v1/feed/trending", {
          auth: false,
        }),
      hashtag: (tag: string) =>
        request<PaginatedResponse<PostPublic>>(`/v1/feed/hashtag/${encodeURIComponent(tag)}`, {
          auth: false,
        }),
    },
    orbits: {
      list: (q?: string) =>
        request<{ data: OrbitPublic[] }>(
          `/v1/orbits${q ? `?q=${encodeURIComponent(q)}` : ""}`,
          { auth: false },
        ),
      get: (slug: string) =>
        request<{ orbit: OrbitPublic; isMember: boolean }>(`/v1/orbits/${slug}`),
      join: (slug: string) =>
        request<{ joined: boolean }>(`/v1/orbits/${slug}/join`, { method: "POST" }),
      leave: (slug: string) =>
        request<{ joined: boolean }>(`/v1/orbits/${slug}/join`, { method: "DELETE" }),
      posts: (slug: string, cursor?: string) =>
        request<PaginatedResponse<PostPublic>>(
          `/v1/orbits/${slug}/posts${cursor ? `?cursor=${cursor}` : ""}`,
        ),
    },
    notifications: {
      list: (cursor?: string) =>
        request<{
          data: Array<{
            id: string;
            type: string;
            postId: string | null;
            isRead: boolean;
            actor: UserPublic | null;
            createdAt: string;
          }>;
          unreadCount: number;
          nextCursor: string | null;
          hasMore: boolean;
        }>(`/v1/notifications/${cursor ? `?cursor=${cursor}` : ""}`),
      readAll: () =>
        request<{ success: boolean }>("/v1/notifications/read-all", { method: "PATCH" }),
    },
    bookmarks: {
      list: (cursor?: string) =>
        request<PaginatedResponse<PostPublic>>(
          `/v1/bookmarks/${cursor ? `?cursor=${cursor}` : ""}`,
        ),
      add: (postId: string) =>
        request<unknown>(`/v1/bookmarks/${postId}`, { method: "POST" }),
      remove: (postId: string) =>
        request<unknown>(`/v1/bookmarks/${postId}`, { method: "DELETE" }),
    },
    conversations: {
      list: () => request<{ data: ConversationItem[] }>("/v1/conversations/"),
      create: (participantId: string) =>
        request<{ conversationId: string }>("/v1/conversations/", {
          method: "POST",
          body: JSON.stringify({ participantId }),
        }),
      delete: (id: string) =>
        request<{ success: boolean }>(`/v1/conversations/${id}`, { method: "DELETE" }),
      messages: (id: string, before?: string) =>
        request<{ data: MessageItem[] }>(
          `/v1/conversations/${id}/messages${before ? `?before=${before}` : ""}`,
        ),
      send: (id: string, content: string, mediaUrls?: string[]) =>
        request<{ message: MessageItem }>(`/v1/conversations/${id}/messages`, {
          method: "POST",
          body: JSON.stringify({ content, mediaUrls }),
        }),
    },
    search: {
      query: (q: string, type = "all") =>
        request<{
          query: string;
          users: UserPublic[];
          posts: PostPublic[];
          orbits: OrbitPublic[];
        }>(`/v1/search/?q=${encodeURIComponent(q)}&type=${type}`, { auth: false }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
