import { Suspense } from "react";

import { StashCollectionContainer } from "@/components/stash/stash-collection-container";
import WallLoading from "@/app/wall/loading";

export default function WallPage() {
  return (
    <Suspense fallback={<WallLoading />}>
      <StashCollectionContainer />
    </Suspense>
  );
}
