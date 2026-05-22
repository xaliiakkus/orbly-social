"use client";

import { MessageCircle, PenLine, Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { ConversationRow } from "@/components/messages/conversation-row";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/page-loading";
import { useAuthStore } from "@/lib/auth-store";
import { useConversations, useCreateConversation } from "@orbly/features";
import { cn } from "@/lib/cn";

export default function MessagesPage() {
  const viewerId = useAuthStore((s) => s.user?.id);
  const [newUserId, setNewUserId] = useState("");
  const [q, setQ] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const { data, isLoading } = useConversations();
  const create = useCreateConversation();

  const filtered = useMemo(() => {
    const list = data?.data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (c) =>
        c.participant?.displayName?.toLowerCase().includes(term) ||
        c.participant?.username?.toLowerCase().includes(term) ||
        c.lastMessage?.content?.toLowerCase().includes(term),
    );
  }, [data, q]);

  const unreadTotal = useMemo(
    () => (data?.data ?? []).reduce((n, c) => n + c.unreadCount, 0),
    [data?.data],
  );

  const startChat = () => {
    if (!newUserId.trim()) return;
    create.mutate(newUserId.trim(), {
      onSuccess: (res) => {
        setNewUserId("");
        setShowNewChat(false);
        window.location.href = `/messages/${res.conversationId}`;
      },
    });
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 bg-gradient-to-br from-accent/12 via-orbit/8 to-transparent pointer-events-none"
          aria-hidden
        />
        <div className="relative px-4 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Mesajlar</h1>
              <p className="text-text-secondary text-[15px] mt-1">
                {unreadTotal > 0
                  ? `${unreadTotal} okunmamış sohbet`
                  : "Özel sohbetlerin"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewChat((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[14px] transition-colors shrink-0",
                showNewChat
                  ? "bg-bg-secondary text-text-primary border border-border"
                  : "bg-accent text-white shadow-lg shadow-accent/25",
              )}
            >
              <PenLine className="h-4 w-4" />
              Yeni
            </button>
          </div>

          <label className="relative block mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kişi veya mesaj ara…"
              className="w-full glass-card rounded-full pl-11 pr-4 py-3 text-[15px] outline-none border border-border/80 focus:border-accent/50"
            />
          </label>

          {showNewChat ? (
            <div className="mt-3 glass-card rounded-2xl p-3 border border-border/80 space-y-2">
              <p className="text-[13px] font-semibold text-text-secondary px-1">
                Kullanıcı adı veya ID ile sohbet başlat
              </p>
              <div className="flex gap-2">
                <input
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="@kullaniciadi"
                  className="flex-1 bg-bg-primary border border-border rounded-full px-4 py-2.5 text-[15px] outline-none focus:border-accent/50"
                  onKeyDown={(e) => e.key === "Enter" && startChat()}
                />
                <Button
                  size="sm"
                  className="gap-1.5 shrink-0 rounded-full px-4"
                  onClick={startChat}
                  disabled={create.isPending}
                >
                  <UserPlus className="h-4 w-4" />
                  Başlat
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1">
        {isLoading && <PageLoading rows={6} />}
        {!isLoading &&
          filtered.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              viewerId={viewerId}
            />
          ))}

        {!isLoading && !filtered.length && (
          <EmptyState
            icon={MessageCircle}
            title={q ? "Eşleşen sohbet yok" : "Henüz mesajın yok"}
            description={
              q
                ? "Başka bir isim veya mesaj metni dene."
                : "Yeni sohbet ile arkadaşlarına ulaş."
            }
            action={
              !q ? (
                <Button onClick={() => setShowNewChat(true)} className="rounded-full gap-2">
                  <PenLine className="h-4 w-4" />
                  Sohbet başlat
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
