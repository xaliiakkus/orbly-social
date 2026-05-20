"use client";

import {
  convoRoom,
  isMessageMine,
  useConversationMessages,
  useConversations,
  useSendMessage,
  useSocketRooms,
} from "@orbly/features";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChatMessage } from "@/components/messages/chat-message";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
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

  useSocketRooms(() => getSocket(accessToken), id ? [convoRoom(id)] : []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data]);

  const onFile = async (file: File) => {
    const url = await uploadFile(file);
    send.mutate(
      { content: text.trim() || "📎", mediaUrls: [url] },
      { onSuccess: () => setText("") },
    );
  };

  return (
    <>
      <PageHeader
        title={participant?.displayName ?? "Sohbet"}
        subtitle={participant ? `@${participant.username}` : undefined}
        action={
          participant ? (
            <Link href={`/profile/${participant.username}`} className="shrink-0">
              <Avatar
                src={participant.avatarUrl}
                name={participant.displayName}
                size="sm"
                className="h-10 w-10"
              />
            </Link>
          ) : null
        }
      />
      <div className="flex flex-col h-[calc(100dvh-120px)] min-h-[400px]">
        <div className="flex-1 overflow-y-auto">
          {data?.data.map((m) => (
            <ChatMessage key={m.id} message={m} me={me} other={participant} />
          ))}
          <div ref={bottomRef} />
        </div>
        <form
          className="border-t border-border p-3 flex gap-2 items-end shrink-0"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            send.mutate({ content: text.trim() }, { onSuccess: () => setText("") });
          }}
        >
          <label className="p-2 cursor-pointer text-accent shrink-0">
            📎
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder="Mesaj yaz"
            className="flex-1 bg-bg-secondary border border-border rounded-2xl px-4 py-2.5 text-[15px] outline-none resize-none min-h-[44px]"
          />
          <button
            type="submit"
            disabled={!text.trim() || send.isPending}
            className="bg-accent text-white font-bold px-5 py-2.5 rounded-full disabled:opacity-50 shrink-0"
          >
            Gönder
          </button>
        </form>
      </div>
    </>
  );
}
