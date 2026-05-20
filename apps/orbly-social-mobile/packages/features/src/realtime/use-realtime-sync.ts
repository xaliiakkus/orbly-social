import { useEffect } from "react";

import { SOCKET_EVENTS } from "../constants";
import { useOrblyQueryClient } from "../context";
import { appendMessageToCache, applyPostStatsToCache } from "./cache";
import {
  applyNotificationToCache,
  type NotificationSocketEvent,
} from "./notification-cache";
import type {
  MessageEvent,
  PostStatsEvent,
  RealtimeSocket,
  UserActionEvent,
} from "./types";

export function useRealtimeSync(
  getSocket: () => RealtimeSocket | null,
  getViewerId?: () => string | null,
) {
  const qc = useOrblyQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onPostStats = (payload: unknown) => {
      const event = payload as PostStatsEvent;
      if (event?.postId && event.stats) {
        applyPostStatsToCache(qc, event, getViewerId?.() ?? null);
      }
    };

    const onMessage = (payload: unknown) => {
      const event = payload as MessageEvent;
      if (event?.conversationId && event.message) appendMessageToCache(qc, event);
    };

    const onNotification = (payload: unknown) => {
      const event = payload as NotificationSocketEvent;
      if (event?.id) {
        applyNotificationToCache(qc, event);
      } else {
        void qc.invalidateQueries({ queryKey: ["notifications"] });
      }
    };

    const onConnect = () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    };

    const onFeedNew = () => {
      void qc.invalidateQueries({ queryKey: ["feed"] });
    };

    const onPostReply = () => {
      void qc.invalidateQueries({ queryKey: ["feed"] });
    };

    const onUserAction = (payload: unknown) => {
      const event = payload as UserActionEvent;
      if (event?.action === "follow" || event?.action === "unfollow") {
        void qc.invalidateQueries({ queryKey: ["profile"] });
      }
    };

    const onLiveListChange = () => {
      void qc.invalidateQueries({ queryKey: ["live"] });
    };

    socket.on(SOCKET_EVENTS.postStats, onPostStats);
    socket.on(SOCKET_EVENTS.message, onMessage);
    socket.on("connect", onConnect);
    socket.on(SOCKET_EVENTS.notification, onNotification);
    socket.on(SOCKET_EVENTS.feedNew, onFeedNew);
    socket.on(SOCKET_EVENTS.postReply, onPostReply);
    socket.on(SOCKET_EVENTS.userAction, onUserAction);
    socket.on(SOCKET_EVENTS.liveStarted, onLiveListChange);
    socket.on(SOCKET_EVENTS.liveEnded, onLiveListChange);

    return () => {
      socket.off(SOCKET_EVENTS.postStats, onPostStats);
      socket.off(SOCKET_EVENTS.message, onMessage);
      socket.off("connect", onConnect);
      socket.off(SOCKET_EVENTS.notification, onNotification);
      socket.off(SOCKET_EVENTS.feedNew, onFeedNew);
      socket.off(SOCKET_EVENTS.postReply, onPostReply);
      socket.off(SOCKET_EVENTS.userAction, onUserAction);
      socket.off(SOCKET_EVENTS.liveStarted, onLiveListChange);
      socket.off(SOCKET_EVENTS.liveEnded, onLiveListChange);
    };
  }, [getSocket, getViewerId, qc]);
}
