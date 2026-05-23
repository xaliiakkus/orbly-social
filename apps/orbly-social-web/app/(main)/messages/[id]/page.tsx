"use client";

import {
  convoRoom,
  groupMessagesByDay,
  isMessageMine,
  useConversationMessages,
  useConversations,
  useSendMessage,
  useSocketRooms,
} from "@orbly/features";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChatComposer } from "@/components/messages/chat-composer";
import { ChatDateDivider } from "@/components/messages/chat-date-divider";
import { ChatHeaderBar } from "@/components/messages/chat-header-bar";
import { ChatMessage } from "@/components/messages/chat-message";
import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";
import { uploadFile } from "@/lib/upload";
import type { UserPublic } from "@orbly/types";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const storeUser = useAuthStore((s) => s.user);
  const me: UserPublic | null | undefined =
    storeUser ?? (session?.orblyUser as UserPublic | undefined) ?? null;
  const accessToken =
    useAuthStore((s) => s.accessToken) ?? session?.accessToken ?? null;
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: convos } = useConversations();
  const { data } = useConversationMessages(id);
  const send = useSendMessage(id);

  const participant = useMemo(() => {
    const fromList = convos?.data.find((c) => c.id === id)?.participant;
    if (fromList) return fromList;
    if (!me || !data?.data.length) return null;
    const otherMsg = data.data.find((m) => !isMessageMine(m.senderId, me.id));
    return otherMsg?.sender ?? null;
  }, [convos?.data, id, data?.data, me]);

  const dayGroups = useMemo(
    () => groupMessagesByDay(data?.data ?? []),
    [data?.data],
  );

  const flatMessages = data?.data ?? [];

  useSocketRooms(() => getSocket(accessToken), id ? [convoRoom(id)] : []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.data.length]);

  const onFile = async (file: File) => {
    if (!me?.id) return;
    const url = await uploadFile(file);
    send.mutate(
      { content: text.trim() || "📎", mediaUrls: [url], senderId: me.id },
      { onSuccess: () => setText("") },
    );
  };

  const submit = () => {
    if (!text.trim() || !me?.id) return;
    send.mutate(
      { content: text.trim(), senderId: me.id },
      { onSuccess: () => setText("") },
    );
  };

  return (
    <div className="flex flex-col min-h-dvh max-h-dvh">
      <ChatHeaderBar participant={participant} />

      <div className="flex-1 overflow-y-auto relative">
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, var(--color-accent) 0%, transparent 42%), radial-gradient(circle at 80% 90%, var(--color-orbit) 0%, transparent 38%)",
          }}
          aria-hidden
        />
        <div className="relative min-h-full flex flex-col justify-end py-2">
          {!flatMessages.length ? (
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
              <p className="text-lg font-bold text-text-primary">Sohbete başla</p>
              <p className="text-text-secondary text-[15px] mt-2 max-w-xs">
                {participant
                  ? `${participant.displayName} ile ilk mesajını gönder.`
                  : "İlk mesajını yaz."}
              </p>
            </div>
          ) : (
            dayGroups.map((group) => (
              <div key={group.dateKey}>
                <ChatDateDivider label={group.label} />
                {group.messages.map((m) => {
                  const messageIndex = flatMessages.findIndex((x) => x.id === m.id);
                  return (
                    <ChatMessage
                      key={m.id}
                      message={m}
                      me={me}
                      other={participant}
                      allMessages={flatMessages}
                      messageIndex={messageIndex}
                    />
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      <ChatComposer
        text={text}
        onTextChange={setText}
        onSubmit={submit}
        onAttach={(file) => void onFile(file)}
        pending={send.isPending}
      />
    </div>
  );
}
