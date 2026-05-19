"use client";

import { MessageCircle, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/page-loading";
import { useConversations, useCreateConversation } from "@orbly/features";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function MessagesPage() {
  const [newUserId, setNewUserId] = useState("");
  const [q, setQ] = useState("");
  const { data, isLoading } = useConversations();
  const create = useCreateConversation();

  const filtered = useMemo(() => {
    const list = data?.data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((c) =>
      c.participant?.displayName?.toLowerCase().includes(term) ||
      c.participant?.username?.toLowerCase().includes(term) ||
      c.lastMessage?.content?.toLowerCase().includes(term),
    );
  }, [data, q]);

  const startChat = () => {
    if (!newUserId.trim()) return;
    create.mutate(newUserId.trim(), {
      onSuccess: (res) => {
        setNewUserId("");
        window.location.href = `/messages/${res.conversationId}`;
      },
    });
  };

  return (
    <>
      <PageHeader title="Mesajlar" subtitle="Özel sohbetler" />
      <div className="p-4 border-b border-border space-y-3 bg-bg-secondary/20">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sohbetlerde ara…"
            className="w-full bg-bg-primary rounded-full pl-11 pr-4 py-2.5 text-[15px] outline-none border border-border focus:border-accent/50"
          />
        </label>
        <div className="flex gap-2">
          <input
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            placeholder="Kullanıcı adı veya ID ile yeni sohbet"
            className="flex-1 bg-bg-primary border border-border rounded-full px-4 py-2 text-[15px] outline-none focus:border-accent/50"
            onKeyDown={(e) => e.key === "Enter" && startChat()}
          />
          <Button size="sm" className="gap-1.5 shrink-0" onClick={startChat} disabled={create.isPending}>
            <UserPlus className="h-4 w-4" />
            Başlat
          </Button>
        </div>
      </div>

      {isLoading && <PageLoading rows={5} />}
      {!isLoading &&
        filtered.map((c) => (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className={cn(
              "flex gap-3 px-4 py-4 border-b border-border hover:bg-bg-hover transition-colors",
              c.unreadCount > 0 && "bg-accent/5",
            )}
          >
            {c.participant && (
              <Avatar src={c.participant.avatarUrl} name={c.participant.displayName} size="md" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2 items-baseline">
                <p className="font-bold truncate text-[15px]">
                  {c.participant?.displayName ?? "Sohbet"}
                </p>
                {c.lastMessage?.createdAt && (
                  <time className="text-text-secondary text-[13px] shrink-0">
                    {formatRelativeTime(c.lastMessage.createdAt)}
                  </time>
                )}
              </div>
              <p className="text-text-secondary text-[15px] truncate mt-0.5">
                {c.lastMessage?.content ?? "Henüz mesaj yok"}
              </p>
            </div>
            {c.unreadCount > 0 && (
              <span className="bg-accent text-white text-xs font-bold h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center shrink-0 self-center">
                {c.unreadCount}
              </span>
            )}
          </Link>
        ))}

      {!isLoading && !filtered.length && (
        <EmptyState
          icon={MessageCircle}
          title={q ? "Eşleşen sohbet yok" : "Henüz mesajın yok"}
          description={
            q
              ? "Başka bir isim veya mesaj metni dene."
              : "Yukarıdan kullanıcı adı veya ID ile yeni bir sohbet başlatabilirsin."
          }
        />
      )}
    </>
  );
}
