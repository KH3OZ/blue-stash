import { Suspense } from "react";

import { StashCollectionContainer } from "@/components/stash/stash-collection-container";

export default function WallPage() {
  return (
    <Suspense>
      <StashCollectionContainer />
    </Suspense>
  );
}
