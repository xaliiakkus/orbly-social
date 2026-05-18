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

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, getAccessToken, onUnauthorized, rpc } = options;
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
      }) => rpc<AuthResponse>("auth.register", body),
      login: async (body: { email: string; password: string }) => {
        try {
          return await rpc<AuthResponse>("auth.login", body);
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<AuthResponse>("/v1/auth/login", {
            method: "POST",
            body: JSON.stringify(body),
            auth: false,
          });
        }
      },
      refresh: (refreshToken: string) =>
        rpc<AuthResponse>("auth.refresh", { refreshToken }),
      me: () => request<{ user: UserPublic }>("/v1/auth/me"),
      usernameAvailable: (username: string) =>
        request<{ available: boolean }>(
          `/v1/auth/username-available?username=${encodeURIComponent(username)}`,
          { auth: false },
        ),
      onboarding: (body: Record<string, unknown>) =>
        rpc<{ user: UserPublic }>("auth.onboarding", body),
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
    },
    media: {
      presign: async (filename: string, contentType: string, folder = "media") => {
        const body = { filename, contentType, folder };
        try {
          return await rpc<PresignResponse>("media.presign", body);
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
        request<{ user: UserPublic; isFollowing: boolean; isSelf: boolean }>(
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
      follow: (userId: string) => rpc<{ following: boolean }>("users.follow", { userId }),
      unfollow: (userId: string) => rpc<{ following: boolean }>("users.unfollow", { userId }),
      updateMe: async (body: Record<string, unknown>) => {
        try {
          return await rpc<{ user: UserPublic }>("users.updateMe", body);
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
      }) => rpc<{ post: PostPublic }>("posts.create", body),
      get: (id: string) => request<{ post: PostPublic }>(`/v1/posts/${id}`),
      update: async (
        id: string,
        body: { content: string; mediaUrls?: string[] },
      ) => {
        const payload = { postId: id, ...body };
        try {
          return await rpc<{ post: PostPublic }>("posts.update", payload);
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
          return await rpc<{ success: boolean }>("posts.delete", { postId: id });
        } catch (e) {
          if (!isRpcConnectionError(e)) throw e;
          return request<{ success: boolean }>(
            `/v1/posts/${encodeURIComponent(id)}`,
            { method: "DELETE" },
          );
        }
      },
      like: (id: string) => rpc<{ liked: boolean }>("posts.like", { postId: id }),
      unlike: (id: string) => rpc<{ liked: boolean }>("posts.unlike", { postId: id }),
      repost: (id: string, content?: string) =>
        rpc<{ post: PostPublic }>("posts.repost", { postId: id, content }),
      replies: (id: string) =>
        request<PaginatedResponse<PostPublic>>(`/v1/posts/${id}/replies`),
      view: (id: string) =>
        rpc<{ success: boolean }>("posts.view", { postId: id }),
      votePoll: (id: string, optionId: string) =>
        rpc<{ post: PostPublic }>("posts.poll.vote", { postId: id, optionId }),
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
      join: (slug: string) => rpc<{ joined: boolean }>("orbits.join", { slug }),
      leave: (slug: string) => rpc<{ joined: boolean }>("orbits.leave", { slug }),
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
      readAll: () => rpc<{ success: boolean }>("notifications.readAll", {}),
    },
    bookmarks: {
      list: (cursor?: string) =>
        request<PaginatedResponse<PostPublic>>(
          `/v1/bookmarks/${cursor ? `?cursor=${cursor}` : ""}`,
        ),
      add: (postId: string) => rpc<{ bookmarked: boolean }>("bookmarks.add", { postId }),
      remove: (postId: string) => rpc<{ bookmarked: boolean }>("bookmarks.remove", { postId }),
    },
    conversations: {
      list: () => request<{ data: ConversationItem[] }>("/v1/conversations/"),
      create: (participantId: string) =>
        rpc<{ conversationId: string }>("conversations.create", { participantId }),
      delete: (id: string) =>
        rpc<{ success: boolean }>("conversations.delete", { conversationId: id }),
      messages: (id: string, before?: string) =>
        request<{ data: MessageItem[] }>(
          `/v1/conversations/${id}/messages${before ? `?before=${before}` : ""}`,
        ),
      send: (id: string, content: string, mediaUrls?: string[]) =>
        rpc<{ message: MessageItem }>("conversations.send", {
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
      }) => rpc<LiveStartResponse>("live.start", body),
      end: (channelId: string) => rpc<LiveEndResponse>("live.end", { channelId }),
      stats: (channelId: string) =>
        request<{ stats: LiveBroadcastStats }>(`/v1/live/${channelId}/stats`),
      token: (channelId: string) => rpc<LiveJoinResponse>("live.token", { channelId }),
      leave: (channelId: string) => rpc<{ success: boolean }>("live.leave", { channelId }),
      comments: (channelId: string) =>
        request<{ data: LiveCommentPublic[] }>(`/v1/live/${channelId}/comments`),
      sendChat: (channelId: string, content: string) =>
        rpc<LiveCommentPublic>("live.chat.send", { channelId, content }),
      requestSpeak: (channelId: string) =>
        rpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.request", {
          channelId,
        }),
      cancelSpeakRequest: (channelId: string) =>
        rpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.cancel-request", {
          channelId,
        }),
      approveSpeaker: (channelId: string, userId: string) =>
        rpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.approve", {
          channelId,
          userId,
        }),
      inviteSpeaker: (channelId: string, userId: string) =>
        rpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.invite", {
          channelId,
          userId,
        }),
      revokeSpeaker: (channelId: string, userId: string) =>
        rpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.revoke", {
          channelId,
          userId,
        }),
      denySpeakRequest: (channelId: string, userId: string) =>
        rpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.deny", {
          channelId,
          userId,
        }),
      grantModerator: (channelId: string, userId: string) =>
        rpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.moderator.grant", {
          channelId,
          userId,
        }),
      revokeModerator: (channelId: string, userId: string) =>
        rpc<{ success: boolean; channel: LiveChannelPublic }>("live.space.moderator.revoke", {
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
