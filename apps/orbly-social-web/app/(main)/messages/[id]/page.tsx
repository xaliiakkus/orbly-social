"use client";

import { convoRoom, useConversationMessages, useSendMessage, useSocketRooms } from "@orbly/features";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { MediaImage } from "@/components/ui/media-image";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import { getSocket } from "@/lib/socket";
import { uploadFile } from "@/lib/upload";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const me = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data } = useConversationMessages(id);
  const send = useSendMessage(id);

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
      <PageHeader title="Sohbet" />
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <div className="flex-1 overflow-y-auto">
          {data?.data.map((m) => {
            const mine = m.senderId === me?.id;
            return (
              <div
                key={m.id}
                className={cn("px-4 py-2 flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-[15px]",
                    mine ? "bg-accent text-white" : "bg-bg-secondary",
                  )}
                >
                  <p>{m.content}</p>
                  {m.mediaUrls?.map((url) => (
                    <MediaImage
                      key={url}
                      src={url}
                      alt=""
                      className="mt-2 rounded-xl max-h-48 w-auto"
                    />
                  ))}
                  <time className="text-[11px] opacity-70 block mt-1">
                    {formatRelativeTime(m.createdAt)}
                  </time>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form
          className="border-t border-border p-3 flex gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            send.mutate({ content: text.trim() }, { onSuccess: () => setText("") });
          }}
        >
          <label className="p-2 cursor-pointer text-accent">
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
            className="flex-1 bg-bg-secondary border border-border rounded-2xl px-4 py-2 text-[15px] outline-none resize-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || send.isPending}
            className="bg-accent text-white font-bold px-4 py-2 rounded-full disabled:opacity-50"
          >
            Gönder
          </button>
        </form>
      </div>
    </>
  );
}
