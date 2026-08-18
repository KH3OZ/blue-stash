import { StashComposer } from "@/components/home/stash-composer";
import { StashCollectionContainer } from "@/components/stash/stash-collection-container";

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <StashComposer />
      </div>
      <StashCollectionContainer />
    </div>
  );
}
