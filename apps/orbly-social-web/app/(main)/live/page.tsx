"use client";

import { useLiveList } from "@orbly/features";
import { Radio } from "lucide-react";
import { useState } from "react";

import { GoLiveModal } from "@/components/live/go-live-modal";
import { StartSpaceModal } from "@/components/live/start-space-modal";
import { LiveChannelCard } from "@/components/live/live-channel-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/page-loading";

export default function LivePage() {
  const [goLiveOpen, setGoLiveOpen] = useState(false);
  const [spaceOpen, setSpaceOpen] = useState(false);
  const { data, isLoading } = useLiveList();
  const channels = data?.data ?? [];
  const liveAvailable = data?.configured === true;

  return (
    <>
      <PageHeader
        title="Canlı"
        subtitle="Sohbet odaları ve canlı yayınlar"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSpaceOpen(true)}
              disabled={isLoading || !liveAvailable}
              className="rounded-full font-bold px-4 flex-1 sm:flex-none text-[15px]"
            >
              Sohbet odası
            </Button>
            <Button
              onClick={() => setGoLiveOpen(true)}
              disabled={isLoading || !liveAvailable}
              className="rounded-full font-bold px-4 flex-1 sm:flex-none text-[15px]"
            >
              Yayına başla
            </Button>
          </div>
        }
      />

      {!isLoading && !liveAvailable && (
        <div className="mx-4 mt-4 p-4 rounded-xl border border-border bg-bg-secondary/40 text-[15px] text-text-secondary text-center">
          Canlı yayın şu an kullanılamıyor. Lütfen daha sonra tekrar dene.
        </div>
      )}

      {isLoading ? (
        <PageLoading />
      ) : channels.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="Şu an canlı yayın yok"
          description="İlk sen ol — sesli veya görüntülü yayın başlat, ekranını paylaş."
          action={
            <Button
              onClick={() => setGoLiveOpen(true)}
              disabled={isLoading || !liveAvailable}
              className="rounded-full font-bold"
            >
              Yayına başla
            </Button>
          }
        />
      ) : (
        <div>
          {channels.map((ch) => (
            <LiveChannelCard key={ch.id} channel={ch} />
          ))}
        </div>
      )}

      <GoLiveModal
        open={goLiveOpen}
        onClose={() => setGoLiveOpen(false)}
        liveAvailable={liveAvailable}
      />
      <StartSpaceModal
        open={spaceOpen}
        onClose={() => setSpaceOpen(false)}
        liveAvailable={liveAvailable}
      />
    </>
  );
}
