"use client";

import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PostCard } from "@/components/post/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { api } from "@/lib/api";

export default function BookmarksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => api.bookmarks.list(),
  });

  return (
    <>
      <PageHeader
        title="Yer İmleri"
        subtitle="Kaydettiğin gönderiler"
      />
      {isLoading && <FeedSkeleton rows={5} />}
      {data?.data.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {!isLoading && !data?.data.length && (
        <EmptyState
          icon={Bookmark}
          title="Kayıtlı gönderi yok"
          description="Bir gönderinin yer imi ikonuna tıklayarak buraya ekleyebilirsin."
        />
      )}
    </>
  );
}
