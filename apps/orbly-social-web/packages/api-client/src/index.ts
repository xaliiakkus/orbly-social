import type {
  AuthResponse,
  ConversationItem,
  MessageItem,
  NotificationItem,
  OrbitPublic,
  PaginatedResponse,
  PostPublic,
  GifItem,
  PresignResponse,
  UserPublic,
} from "@orbly/types";

import { RpcError, type RpcCaller } from "./rpc";

function isRpcConnectionError(error: unknown): boolean {
  return error instanceof RpcError && error.status === 0;
}

export type {
  AuthResponse,
  OrbitPublic,
  PaginatedResponse,
  PostPublic,
  UserPublic,
};
export { RpcError, socketRpc, type RpcCaller, type SocketLike } from "./rpc";

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  /** İstek öncesi access token yenile (süresi dolmuş JWT → 401 önleme). */
  prepareAuth?: () => Promise<void>;
  onTokensRefreshed?: (payload: AuthResponse) => void;
  onUnauthorized?: () => void;
  /** Socket RPC for all mutations (POST/PUT/PATCH/DELETE). */
  rpc: RpcCaller;
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

function isUnauthorized(error: unknown): boolean {
  return (
    (error instanceof ApiError && error.status === 401) ||
    (error instanceof RpcError && error.status === 401)
  );
}

export function createApiClient(options: ApiClientOptions) {
  const {
    baseUrl,
    getAccessToken,
    getRefreshToken,
    prepareAuth,
    onTokensRefreshed,
    onUnauthorized,
    rpc,
  } = options;
  const root = baseUrl.replace(/\/$/, "");

  let refreshInFlight: Promise<AuthResponse | null> | null = null;

  async function refreshAuthHttp(refreshToken: string): Promise<AuthResponse> {
    try {
      return await rpc<AuthResponse>("auth.refresh", { refreshToken });
    } catch (e) {
      if (!isRpcConnectionError(e) && !isUnauthorized(e)) throw e;
      return request<AuthResponse>("/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        auth: false,
        skipRefresh: true,
      });
    }
  }

  async function tryRefreshTokens(): Promise<AuthResponse | null> {
    const refreshToken = getRefreshToken?.();
    if (!refreshToken) return null;
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        try {
          const payload = await refreshAuthHttp(refreshToken);
          onTokensRefreshed?.(payload);
          return payload;
        } catch {
          return null;
        } finally {
          refreshInFlight = null;
        }
      })();
    }
    return refreshInFlight;
  }

  function failUnauthorized(): never {
    onUnauthorized?.();
    throw new ApiError(401, "Unauthorized");
  }

  async function callRpc<T>(
    action: string,
    data?: Record<string, unknown>,
  ): Promise<T> {
    if (prepareAuth) await prepareAuth();
    try {
      return await rpc<T>(action, data);
    } catch (e) {
      if (!isUnauthorized(e)) throw e;
      const refreshed = await tryRefreshTokens();
      if (!refreshed) failUnauthorized();
      try {
        return await rpc<T>(action, data);
      } catch (retryErr) {
        if (isUnauthorized(retryErr)) failUnauthorized();
        throw retryErr;
      }
    }
  }

  async function request<T>(
    path: string,
    init: RequestInit & { auth?: boolean; skipRefresh?: boolean } = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (init.auth !== false) {
      if (prepareAuth) await prepareAuth();
      const token = getAccessToken?.();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    let res = await fetch(`${root}${path}`, { ...init, headers, redirect: "manual" });
    if (res.status === 307 || res.status === 308) {
      const location = res.headers.get("Location");
      if (location) {
        const nextUrl = location.startsWith("http") ? location : `${root}${location}`;
        res = await fetch(nextUrl, { ...init, headers });
      }
    }
    if (
      res.status === 401 &&
      init.auth !== false &&
      !init.skipRefresh
    ) {
      const refreshed = await tryRefreshTokens();
      if (refreshed) {
        headers.set(
          "Authorization",
          `Bearer ${refreshed.tokens.accessToken}`,
        );
        res = await fetch(`${root}${path}`, { ...init, headers });
      }
      if (res.status === 401) failUnauthorized();
    }
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const body = (await res.json()) as {
          detail?: string | Array<{ msg?: string }>;
        };
        if (typeof body.detail === "string") {
          msg = body.detail;
        } else if (Array.isArray(body.detail) && body.detail[0]?.msg) {
          msg = body.detail[0].msg;
        }
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
      }) => callRpc<AuthResponse>("auth.register", body),
      login: async (body: { email: string; password: string }) => {
        try {
          return await rpc<AuthResponse>("auth.login", body);
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<AuthResponse>("/v1/auth/login", {
            method: "POST",
            body: JSON.stringify(body),
            auth: false,
            skipRefresh: true,
          });
        }
      },
      refresh: (refreshToken: string) => refreshAuthHttp(refreshToken),
      me: () => request<{ user: UserPublic }>("/v1/auth/me"),
      usernameAvailable: (username: string) =>
        request<{ available: boolean }>(
          `/v1/auth/username-available?username=${encodeURIComponent(username)}`,
          { auth: false },
        ),
      onboarding: async (body: Record<string, unknown>) => {
        try {
          return await callRpc<{ user: UserPublic }>("auth.onboarding", body);
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<{ user: UserPublic }>("/v1/auth/onboarding", {
            method: "PATCH",
            body: JSON.stringify(body),
          });
        }
      },
      oauth: async (body: {
        provider: "google" | "apple";
        email?: string;
        displayName?: string;
        idToken?: string;
        avatarUrl?: string;
        oauthId?: string;
      }) => {
        try {
          return await rpc<AuthResponse>("auth.oauth", body);
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<AuthResponse>("/v1/auth/oauth", {
            method: "POST",
            body: JSON.stringify(body),
            auth: false,
          });
        }
      },
      forgotPassword: async (body: { email: string; username: string }) => {
        try {
          return await rpc<{ ok: boolean; message: string }>(
            "auth.forgotPassword",
            body,
          );
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<{ ok: boolean; message: string }>(
            "/v1/auth/forgot-password",
            {
              method: "POST",
              body: JSON.stringify(body),
              auth: false,
              skipRefresh: true,
            },
          );
        }
      },
      resetPassword: async (body: {
        token: string;
        password: string;
        confirmPassword: string;
      }) => {
        try {
          return await rpc<{ ok: boolean; message: string }>(
            "auth.resetPassword",
            body,
          );
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<{ ok: boolean; message: string }>(
            "/v1/auth/reset-password",
            {
              method: "POST",
              body: JSON.stringify(body),
              auth: false,
              skipRefresh: true,
            },
          );
        }
      },
    },
    media: {
      presign: async (
        filename: string,
        contentType: string,
        folder = "media",
        storage: "auto" | "cloudinary" | "idrive" = "auto",
      ) => {
        const body = { filename, contentType, folder, storage };
        try {
          return await callRpc<PresignResponse>("media.presign", body);
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<PresignResponse>("/v1/media/presign", {
            method: "POST",
            body: JSON.stringify(body),
          });
        }
      },
      gifs: (q = "", limit = 20) =>
        request<{ data: GifItem[] }>(
          `/v1/media/gifs?q=${encodeURIComponent(q)}&limit=${limit}`,
        ),
    },
    users: {
      get: (username: string) =>
        request<import("@orbly/types").UserProfileResponse>(
          `/v1/users/${encodeURIComponent(username)}`,
        ),
      posts: (username: string, cursor?: string) =>
        request<PaginatedResponse<PostPublic>>(
          `/v1/users/${encodeURIComponent(username)}/posts${cursor ? `?cursor=${cursor}` : ""}`,
        ),
      broadcasts: (username: string) =>
        request<{ data: LiveBroadcastStats[] }>(
          `/v1/users/${encodeURIComponent(username)}/broadcasts`,
        ),
      orbits: (username: string) =>
        request<{ data: import("@orbly/types").OrbitPublic[] }>(
          `/v1/users/${encodeURIComponent(username)}/orbits`,
        ),
      mutualFollowers: (username: string, limit = 3) =>
        request<import("@orbly/types").MutualFollowersResponse>(
          `/v1/users/${encodeURIComponent(username)}/mutual-followers?limit=${limit}`,
        ),
      follow: async (userId: string) => {
        try {
          return await callRpc<{ following: boolean }>("users.follow", { userId });
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<{ following: boolean }>(
            `/v1/users/me/following/${encodeURIComponent(userId)}`,
            { method: "POST" },
          );
        }
      },
      unfollow: async (userId: string) => {
        try {
          return await callRpc<{ following: boolean }>("users.unfollow", { userId });
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<{ following: boolean }>(
            `/v1/users/me/following/${encodeURIComponent(userId)}`,
            { method: "DELETE" },
          );
        }
      },
      updateMe: async (body: Record<string, unknown>) => {
        try {
          return await callRpc<{ user: UserPublic }>("users.updateMe", body);
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<{ user: UserPublic }>("/v1/users/me", {
            method: "PATCH",
            body: JSON.stringify(body),
          });
        }
      },
    },
    posts: {
      create: (body: {
        content: string;
        mediaUrls?: string[];
        replyToId?: string;
        orbitId?: string;
        poll?: { options: string[]; durationHours?: number };
      }) => callRpc<{ post: PostPublic }>("posts.create", body),
      get: (id: string) => request<{ post: PostPublic }>(`/v1/posts/${id}`),
      update: async (
        id: string,
        body: { content: string; mediaUrls?: string[] },
      ) => {
        const payload = { postId: id, ...body };
        try {
          return await callRpc<{ post: PostPublic }>("posts.update", payload);
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<{ post: PostPublic }>(`/v1/posts/${encodeURIComponent(id)}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          });
        }
      },
      delete: async (id: string) => {
        try {
          return await callRpc<{ success: boolean }>("posts.delete", { postId: id });
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<{ success: boolean }>(
            `/v1/posts/${encodeURIComponent(id)}`,
            { method: "DELETE" },
          );
        }
      },
      like: (id: string) => callRpc<{ liked: boolean }>("posts.like", { postId: id }),
      unlike: (id: string) => callRpc<{ liked: boolean }>("posts.unlike", { postId: id }),
      repost: (id: string, content?: string) =>
        callRpc<{ post: PostPublic; reposted: boolean }>("posts.repost", {
          postId: id,
          content,
        }),
      unrepost: (id: string) =>
        callRpc<{ reposted: boolean; repostCount: number }>("posts.unrepost", {
          postId: id,
        }),
      replies: (id: string) =>
        request<PaginatedResponse<PostPublic>>(`/v1/posts/${id}/replies`),
      reposters: (id: string, cursor?: string) =>
        request<PaginatedResponse<UserPublic>>(
          `/v1/posts/${encodeURIComponent(id)}/reposts${
            cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
          }`,
        ),
      view: (id: string) =>
        callRpc<{ success: boolean; counted?: boolean; viewCount?: number }>(
          "posts.view",
          { postId: id },
        ),
      votePoll: (id: string, optionId: string) =>
        callRpc<{ post: PostPublic }>("posts.poll.vote", { postId: id, optionId }),
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
      explore: (tab: "for-you" | "trending", cursor?: string) => {
        const params = new URLSearchParams({ tab });
        if (cursor) params.set("cursor", cursor);
        return request<PaginatedResponse<PostPublic>>(
          `/v1/feed/explore?${params.toString()}`,
        );
      },
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
          `/v1/orbits/${q ? `?q=${encodeURIComponent(q)}` : ""}`,
          { auth: false },
        ),
      get: (slug: string) =>
        request<{ orbit: OrbitPublic; isMember: boolean }>(`/v1/orbits/${slug}`),
      join: (slug: string) => callRpc<{ joined: boolean }>("orbits.join", { slug }),
      leave: (slug: string) => callRpc<{ joined: boolean }>("orbits.leave", { slug }),
      posts: (slug: string, cursor?: string) =>
        request<PaginatedResponse<PostPublic>>(
          `/v1/orbits/${slug}/posts${cursor ? `?cursor=${cursor}` : ""}`,
        ),
    },
    notifications: {
      list: (cursor?: string) => {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        const q = params.toString();
        return request<{
          data: NotificationItem[];
          unreadCount: number;
          nextCursor: string | null;
          hasMore: boolean;
        }>(`/v1/notifications/${q ? `?${q}` : ""}`);
      },
      read: async (notificationId: string) => {
        try {
          return await callRpc<{ success: boolean }>("notifications.read", { notificationId });
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<{ success: boolean }>(
            `/v1/notifications/${encodeURIComponent(notificationId)}/read`,
            { method: "POST" },
          );
        }
      },
      readAll: async () => {
        try {
          return await callRpc<{ success: boolean }>("notifications.readAll", {});
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<{ success: boolean }>("/v1/notifications/read-all", {
            method: "POST",
          });
        }
      },
    },
    bookmarks: {
      list: (cursor?: string) =>
        request<PaginatedResponse<PostPublic>>(
          `/v1/bookmarks${cursor ? `/?cursor=${encodeURIComponent(cursor)}` : "/"}`,
        ),
      add: (postId: string) => callRpc<{ bookmarked: boolean }>("bookmarks.add", { postId }),
      remove: (postId: string) => callRpc<{ bookmarked: boolean }>("bookmarks.remove", { postId }),
    },
    conversations: {
      list: () => request<{ data: ConversationItem[] }>("/v1/conversations/"),
      create: (participantId: string) =>
        callRpc<{ conversationId: string }>("conversations.create", { participantId }),
      delete: (id: string) =>
        callRpc<{ success: boolean }>("conversations.delete", { conversationId: id }),
      messages: (id: string, before?: string) =>
        request<{ data: MessageItem[] }>(
          `/v1/conversations/${id}/messages${before ? `?before=${before}` : ""}`,
        ),
      send: (id: string, content: string, mediaUrls?: string[]) =>
        callRpc<{ message: MessageItem }>("conversations.send", {
          conversationId: id,
          content,
          mediaUrls,
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
    live: {
      list: () =>
        request<{ configured: boolean; data: LiveChannelPublic[] }>("/v1/live/"),
      get: (channelId: string) =>
        request<{ configured: boolean; channel: LiveChannelPublic & { isHost?: boolean } }>(
          `/v1/live/${channelId}`,
        ),
      start: (body: {
        title: string;
        mode?: "audio" | "video";
        kind?: "broadcast" | "space";
        orbitId?: string;
      }) => callRpc<LiveStartResponse>("live.start", body),
      end: (channelId: string) => callRpc<LiveEndResponse>("live.end", { channelId }),
      stats: (channelId: string) =>
        request<{ stats: LiveBroadcastStats }>(`/v1/live/${channelId}/stats`),
      token: (channelId: string) => callRpc<LiveJoinResponse>("live.token", { channelId }),
      leave: (channelId: string) => callRpc<{ success: boolean }>("live.leave", { channelId }),
      comments: (channelId: string) =>
        request<{ data: LiveCommentPublic[] }>(`/v1/live/${channelId}/comments`),
      sendChat: (channelId: string, content: string) =>
        callRpc<LiveCommentPublic>("live.chat.send", { channelId, content }),
      requestSpeak: (channelId: string) =>
        callRpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.request", {
          channelId,
        }),
      cancelSpeakRequest: (channelId: string) =>
        callRpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.cancel-request", {
          channelId,
        }),
      approveSpeaker: (channelId: string, userId: string) =>
        callRpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.approve", {
          channelId,
          userId,
        }),
      inviteSpeaker: (channelId: string, userId: string) =>
        callRpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.invite", {
          channelId,
          userId,
        }),
      revokeSpeaker: (channelId: string, userId: string) =>
        callRpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.revoke", {
          channelId,
          userId,
        }),
      denySpeakRequest: (channelId: string, userId: string) =>
        callRpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.deny", {
          channelId,
          userId,
        }),
      grantModerator: (channelId: string, userId: string) =>
        callRpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.moderator.grant", {
          channelId,
          userId,
        }),
      revokeModerator: (channelId: string, userId: string) =>
        callRpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.moderator.revoke", {
          channelId,
          userId,
        }),
    },
  };
}

export type LiveRoomKind = "broadcast" | "space";
export type LiveRoomRole = "host" | "moderator" | "speaker" | "listener";

export interface LiveSpeakerPublic {
  userId: string;
  role: "host" | "moderator" | "speaker";
  user?: UserPublic | null;
}

export interface LiveSpeakRequestPublic {
  userId: string;
  user?: UserPublic | null;
}

export interface LiveChannelPublic {
  id: string;
  title: string;
  kind?: LiveRoomKind;
  mode: "audio" | "video";
  status: "live" | "ended";
  listenerCount: number;
  speakerCount?: number;
  maxSpeakers?: number;
  startedAt: string;
  endedAt?: string | null;
  orbitId?: string | null;
  host?: UserPublic | null;
  isHost?: boolean;
  canManageRoom?: boolean;
  speakers?: LiveSpeakerPublic[];
  speakerRequests?: LiveSpeakRequestPublic[];
  myRole?: LiveRoomRole;
  hasSpeakRequest?: boolean;
}

export interface LiveKitConnect {
  url: string;
  token: string;
  roomName: string;
  role?: LiveRoomRole;
}

export interface LiveStartResponse {
  channel: LiveChannelPublic;
  livekit: LiveKitConnect;
}

export interface LiveJoinResponse {
  channel: LiveChannelPublic;
  livekit: LiveKitConnect;
}

export interface LiveCommentPublic {
  id: string;
  channelId: string;
  content: string;
  createdAt: string;
  author?: UserPublic | null;
}

export interface LiveBroadcastStats {
  channelId: string;
  title: string;
  kind?: LiveRoomKind;
  mode: "audio" | "video";
  status: "live" | "ended";
  durationSeconds: number;
  durationLabel: string;
  peakListeners: number;
  totalComments: number;
  currentListeners: number;
  startedAt: string;
  endedAt?: string | null;
  replayPostId?: string | null;
  hasReplayVideo: boolean;
  replayUrl?: string | null;
  recordingStatus?: "none" | "recording" | "processing" | "ready" | "failed";
  host?: UserPublic | null;
}

export interface LiveEndResponse {
  success: boolean;
  stats: LiveBroadcastStats;
  recapPostId?: string | null;
}

export type ApiClient = ReturnType<typeof createApiClient>;
export { formatUserError } from "./errors";

/** Kayıtlı hesap rozeti — cihazdaki diğer oturumlar için hafif istek */
export async function fetchNotificationsUnreadCount(
  baseUrl: string,
  accessToken: string,
): Promise<number> {
  const root = baseUrl.replace(/\/$/, "");
  try {
    const res = await fetch(`${root}/v1/notifications/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return 0;
    const json = (await res.json()) as { unreadCount?: number };
    return typeof json.unreadCount === "number" ? json.unreadCount : 0;
  } catch {
    return 0;
  }
}
