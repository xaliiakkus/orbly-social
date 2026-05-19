import { Suspense } from "react";

import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { ExploreContent } from "./explore-content";

export default function ExplorePage() {
  return (
    <Suspense fallback={<FeedSkeleton rows={6} />}>
      <ExploreContent />
    </Suspense>
  );
}
