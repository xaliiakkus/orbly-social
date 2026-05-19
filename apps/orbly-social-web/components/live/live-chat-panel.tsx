"use client";

import { SOCKET_EVENTS, liveRoom, useLiveComments, useSocketRooms } from "@orbly/features";
import type { LiveCommentPublic } from "@orbly/api-client";
import { formatUserError } from "@orbly/api-client";
import { Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import { getSocket } from "@/lib/socket";
import { useSession } from "next-auth/react";

export function LiveChatPanel({
  channelId,
  isHost = false,
  canManageRoom = false,
  isSpace = false,
  onInviteSpeaker,
}: {
  channelId: string;
  isHost?: boolean;
  canManageRoom?: boolean;
  isSpace?: boolean;
  onInviteSpeaker?: (userId: string) => void | Promise<void>;
}) {
  const canInvite = canManageRoom || isHost;
  const { data: session } = useSession();
  const me = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<LiveCommentPublic[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useLiveComments(channelId);

  const getSocketStable = useCallback(() => {
    return getSocket(session?.accessToken ?? useAuthStore.getState().accessToken);
  }, [session?.accessToken]);

  useSocketRooms(getSocketStable, channelId ? [liveRoom(channelId)] : []);

  useEffect(() => {
    if (data?.data) setComments(data.data);
  }, [data]);

  useEffect(() => {
    const socket = getSocketStable();
    if (!socket || !channelId) return;

    const onChat = (payload: unknown) => {
      const msg = payload as LiveCommentPublic;
      if (!msg?.id) return;
      if (msg.channelId && msg.channelId !== channelId) return;
      setComments((prev) => {
        if (prev.some((c) => c.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on(SOCKET_EVENTS.channelChat, onChat);
    return () => {
      socket.off(SOCKET_EVENTS.channelChat, onChat);
    };
  }, [channelId, getSocketStable]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setError("");
    setSending(true);
    try {
      const msg = await api.live.sendChat(channelId, content);
      setText("");
      setComments((prev) => (prev.some((c) => c.id === msg.id) ? prev : [...prev, msg]));
    } catch (err) {
      setError(formatUserError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className="flex flex-col w-full lg:w-[340px] lg:max-w-[38%] lg:min-w-[280px] border-t lg:border-t-0 lg:border-l border-border bg-bg-primary shrink-0 h-[320px] lg:h-auto lg:min-h-0">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="font-extrabold text-[17px]">Sohbet</h2>
        <p className="text-text-secondary text-[13px]">Yayın sırasında mesajlaş</p>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading && !comments.length ? (
          <p className="p-4 text-text-secondary text-sm text-center">Yükleniyor…</p>
        ) : comments.length === 0 ? (
          <p className="p-6 text-text-secondary text-sm text-center">
            İlk yorumu sen yaz. Yayıncı ve izleyiciler burada konuşur.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {comments.map((c) => {
              const mine = c.author?.id === me?.id;
              return (
                <li key={c.id} className="px-3 py-2.5 hover:bg-bg-hover/40">
                  <div className="flex gap-2">
                    <Avatar
                      src={c.author?.avatarUrl}
                      name={c.author?.displayName ?? "?"}
                      size="sm"
                      className="shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {canInvite && isSpace && c.author?.id && !mine ? (
                          <button
                            type="button"
                            onClick={() => void onInviteSpeaker?.(c.author!.id)}
                            className="font-bold text-[14px] truncate text-left hover:underline text-accent"
                            title="Konuşmacı yap"
                          >
                            {c.author?.displayName ?? "Kullanıcı"}
                          </button>
                        ) : (
                          <span
                            className={cn(
                              "font-bold text-[14px] truncate",
                              mine && "text-accent",
                            )}
                          >
                            {c.author?.displayName ?? "Kullanıcı"}
                          </span>
                        )}
                        <time className="text-[11px] text-text-secondary shrink-0">
                          {formatRelativeTime(c.createdAt)}
                        </time>
                      </div>
                      <p className="text-[15px] mt-0.5 break-words leading-snug">{c.content}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="p-3 border-t border-border flex gap-2 items-end shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesaj gönder…"
          maxLength={280}
          className="flex-1 rounded-full bg-bg-secondary border border-border px-4 py-2.5 text-[15px] outline-none focus:border-accent/50"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-40 shrink-0"
          aria-label="Gönder"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="px-3 pb-2 text-like text-xs">{error}</p>}
    </aside>
  );
}
