export const POST_MAX_LENGTH = 280;
export const MAX_MEDIA_PER_POST = 4;
export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 4;
export const DEFAULT_POLL_HOURS = 24;

/** Server → client Socket.IO events */
export const SOCKET_EVENTS = {
  notification: "notification",
  message: "message",
  feedNew: "feed:new",
  postStats: "post:stats",
  postReply: "post:reply",
  userAction: "user:action",
  liveStarted: "live:started",
  liveEnded: "live:ended",
  channelLive: "channel:live",
  channelEnded: "channel:ended",
  channelUpdate: "channel:update",
  channelChat: "channel:chat",
  channelReplay: "channel:replay",
  liveReplay: "live:replay",
  channelSpeakers: "channel:speakers",
  liveSpeakerGranted: "live:speaker:granted",
  liveSpeakerRevoked: "live:speaker:revoked",
} as const;

export function liveRoom(channelId: string) {
  return `live:${channelId}`;
}

/** Client → server room subscription */
export const SOCKET_SUBSCRIBE = "subscribe";
export const SOCKET_UNSUBSCRIBE = "unsubscribe";

export function postRoom(postId: string) {
  return `post:${postId}`;
}

export function convoRoom(conversationId: string) {
  return `convo:${conversationId}`;
}
